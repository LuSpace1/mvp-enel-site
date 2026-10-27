"""Auditoria de cambios locales de permisos (fuera de la Service Layer/SCIM)."""

import threading
from contextlib import contextmanager

from django.contrib.auth.models import Group
from django.db.models.signals import m2m_changed, post_delete, post_save, pre_save
from django.dispatch import receiver

from .models import (
    IdentityAuditAction,
    IdentityAuditLog,
    IdentityAuditSource,
    Role,
    User,
)

_local = threading.local()


@contextmanager
def suppress_identity_audit():
    """Evita el doble registro cuando la capa de servicios ya audita el cambio."""
    previous = getattr(_local, "suppressed", False)
    _local.suppressed = True
    try:
        yield
    finally:
        _local.suppressed = previous


def _audit_suppressed() -> bool:
    return getattr(_local, "suppressed", False)


def _record(user, detail: str, actor=None) -> IdentityAuditLog:
    return IdentityAuditLog.objects.create(
        target_user=user,
        actor=actor if (actor and getattr(actor, "is_authenticated", False)) else None,
        action=IdentityAuditAction.LOCAL_PERMISSION_CHANGE,
        source=IdentityAuditSource.LOCAL,
        detail=detail,
    )


@receiver(m2m_changed, sender=User.groups.through)
def log_group_membership_change(sender, instance, action, pk_set, reverse, **kwargs):
    """Toda membresia agregada/removida fuera de la Service Layer queda auditada como local."""
    if action not in {"post_add", "post_remove", "post_clear"}:
        return
    if _audit_suppressed():
        return

    if action == "post_clear":
        if not reverse:
            _record(
                instance,
                "Cambio local de permisos: se limpiaron todos los roles del usuario.",
            )
        return

    if reverse:
        group = instance
        verb = "agregado" if action == "post_add" else "removido"
        for user in User.objects.filter(id__in=list(pk_set or [])):
            _record(user, f"Cambio local de permisos: rol '{group.name}' {verb}.")
    else:
        user = instance
        verb = "agregado" if action == "post_add" else "removido"
        for group in Group.objects.filter(id__in=list(pk_set or [])):
            _record(user, f"Cambio local de permisos: rol '{group.name}' {verb}.")


@receiver(post_save, sender=Group)
def log_group_creation(sender, instance, created, **kwargs):
    """Un grupo creado fuera de SCIM/Service Layer queda auditado como cambio local."""
    if created and not _audit_suppressed():
        _record(None, f"Grupo creado localmente: {instance.name}")


@receiver(post_delete, sender=Group)
def log_group_deletion(sender, instance, **kwargs):
    """Un grupo eliminado localmente queda auditado (el historial de identidad se conserva)."""
    if not _audit_suppressed():
        _record(None, f"Grupo eliminado localmente: {instance.name}")


@receiver(pre_save, sender=Role)
def capture_previous_role_state(sender, instance, **kwargs):
    if not instance.pk:
        instance._previous_catalog_state = None
        return
    instance._previous_catalog_state = (
        Role.objects.filter(pk=instance.pk)
        .values("display_name", "kind", "is_active", "technical_group_id")
        .first()
    )


@receiver(post_save, sender=Role)
def log_role_catalog_change(sender, instance, created, **kwargs):
    """Los cambios locales al catalogo de roles se registran como inconsistencia operativa."""
    if created or _audit_suppressed():
        return

    previous = getattr(instance, "_previous_catalog_state", None)
    if not previous:
        return

    changes: list[str] = []
    if previous["display_name"] != instance.display_name:
        changes.append(
            f"nombre: '{previous['display_name']}' -> '{instance.display_name}'"
        )
    if previous["kind"] != instance.kind:
        changes.append(f"tipo: {previous['kind']} -> {instance.kind}")
    if previous["is_active"] != instance.is_active:
        changes.append(f"activo: {previous['is_active']} -> {instance.is_active}")
    if previous["technical_group_id"] != instance.technical_group_id:
        changes.append("grupo tecnico modificado")

    if changes:
        _record(
            None,
            f"Cambio local del catalogo de roles '{instance.display_name}': "
            + "; ".join(changes),
        )
