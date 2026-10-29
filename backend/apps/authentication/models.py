import uuid

from django.contrib.auth.models import AbstractUser, Group
from django.core.exceptions import ValidationError
from django.db import models


class User(AbstractUser):
    """
    Usuario del sistema.
    Permite asociar el ID corporativo de Enel (username o enel_id)
    y gestiona permisos mediante grupos (roles).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enel_id = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Identificador corporativo Enel alternativo o complementario.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        ordering = ["username"]
        indexes = [
            models.Index(fields=["enel_id"], name="auth_user_enel_id_idx"),
            models.Index(fields=["email"], name="auth_user_email_idx"),
        ]

    def __str__(self):
        full_name = self.get_full_name()
        if full_name:
            return f"{self.username} - {full_name}"
        return self.username


class RoleKind(models.TextChoices):
    """Tipo de rol: Funcional (negocio) o Técnico (grupo Django)."""

    FUNCTIONAL = "FUNCTIONAL", "Funcional"
    TECHNICAL = "TECHNICAL", "Tecnico"


class Role(models.Model):
    """
    Catálogo de roles del portal.
    Se vincula a un grupo de Django para otorgar los permisos técnicos correspondientes.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    display_name = models.CharField(
        max_length=100, unique=True, verbose_name="Nombre del Rol"
    )
    kind = models.CharField(
        max_length=20,
        choices=RoleKind.choices,
        default=RoleKind.TECHNICAL,
        db_index=True,
        verbose_name="Tipo de Rol",
    )
    technical_group = models.OneToOneField(
        Group,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="sig_role",
        verbose_name="Grupo Tecnico Django",
        help_text="Grupo donde se materializan los permisos del rol.",
    )
    description = models.TextField(blank=True, verbose_name="Descripcion")
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
        ordering = ["display_name"]

    def __str__(self):
        return f"{self.display_name} ({self.get_kind_display()})"


class IdentityAuditAction(models.TextChoices):
    USER_PROVISIONED = "USER_PROVISIONED", "Usuario aprovisionado"
    USER_UPDATED = "USER_UPDATED", "Usuario actualizado"
    USER_ACTIVATED = "USER_ACTIVATED", "Usuario activado"
    USER_DEACTIVATED = "USER_DEACTIVATED", "Usuario desactivado"
    ROLE_ASSIGNED = "ROLE_ASSIGNED", "Rol asignado"
    ROLE_REMOVED = "ROLE_REMOVED", "Rol removido"
    LOCAL_PERMISSION_CHANGE = "LOCAL_PERMISSION_CHANGE", "Cambio local de permisos"


class IdentityAuditSource(models.TextChoices):
    LOCAL = "LOCAL", "Local (Admin/Portal)"
    SCIM = "SCIM", "CompAC SCIM"


class IdentityAuditLogQuerySet(models.QuerySet):
    """Protege la bitácora para que sea solo de lectura e inserción (inmutable)."""

    def update(self, **kwargs):
        raise ValidationError(
            "La auditoria de identidad es inmutable: no se puede actualizar."
        )

    def delete(self):
        raise ValidationError(
            "La auditoria de identidad es inmutable: no se puede eliminar."
        )

    def bulk_update(self, objs, fields, batch_size=None):
        raise ValidationError(
            "La auditoria de identidad es inmutable: no se puede actualizar."
        )


class IdentityAuditLog(models.Model):
    """
    Bitácora inmutable de eventos de identidad:
    registra altas, bajas y cambios de roles indicando si vinieron de CompAC (SCIM) o de forma Local.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    target_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="identity_audit_logs",
        verbose_name="Usuario Afectado",
    )
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="identity_audit_actions",
        verbose_name="Ejecutado por",
    )
    action = models.CharField(
        max_length=40,
        choices=IdentityAuditAction.choices,
        db_index=True,
        verbose_name="Accion",
    )
    source = models.CharField(
        max_length=20,
        choices=IdentityAuditSource.choices,
        default=IdentityAuditSource.LOCAL,
        verbose_name="Origen",
    )
    detail = models.TextField(blank=True, verbose_name="Detalle")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha")

    objects = IdentityAuditLogQuerySet.as_manager()

    class Meta:
        db_table = "authentication_identity_audit_log"
        verbose_name = "Registro de Auditoria de Identidad"
        verbose_name_plural = "Registros de Auditoria de Identidad"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} sobre {self.target_user} ({self.source})"

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise ValidationError(
                "La auditoria de identidad es inmutable: no se puede modificar."
            )
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError(
            "La auditoria de identidad es inmutable: no se puede eliminar."
        )
