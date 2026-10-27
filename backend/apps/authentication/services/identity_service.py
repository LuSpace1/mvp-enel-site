from django.conf import settings
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction

from apps.authentication.models import (
    IdentityAuditAction,
    IdentityAuditLog,
    IdentityAuditSource,
    Role,
    RoleKind,
    User,
)
from apps.authentication.roles import core_technical_roles
from apps.authentication.signals import suppress_identity_audit
from apps.authentication.validators import is_valid_corporate_id

# Marca de atributo ausente en payloads parciales (distingue "no enviado" de null).
_UNSET = object()


def coerce_bool(value) -> bool:
    """Convierte booleanos SCIM sin ambiguedad: el texto "false" es False."""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in ("true", "1", "yes")
    return bool(value)


def extract_email(data: dict):
    """
    Extrae el correo de un payload de identidad.

    Devuelve `None` si el payload no trae el atributo (para no borrarlo en un
    PATCH parcial) y `""` si lo trae vacio (para limpiarlo en un PUT/replace).
    """
    if "email" in data:
        value = data.get("email")
        return str(value).strip() if value is not None else ""
    if "emails" in data:
        emails = data.get("emails")
        if isinstance(emails, str):
            return emails.strip()
        if isinstance(emails, list):
            for item in emails:
                if isinstance(item, dict) and item.get("value"):
                    return str(item["value"]).strip()
                if isinstance(item, str) and item.strip():
                    return item.strip()
            return ""
    return None


class IdentityError(Exception):
    """Error base de la capa de identidad."""


class UserAlreadyExistsError(IdentityError):
    """El userName (Enel ID) ya esta registrado; SCIM responde 409 Conflict."""


class UserNotFoundError(IdentityError):
    """No existe un usuario con el identificador solicitado."""


class RoleNotFoundError(IdentityError):
    """No existe un rol con el identificador solicitado."""


class IdentityService:
    """
    Capa de servicios de identidad.

    Es el unico punto de entrada para crear usuarios, cambiar su estado y
    asignar o quitar roles. Las vistas HTTP (SCIM, login, admin asistido) no
    escriben modelos de identidad directamente.
    """

    # ------------------------------------------------------------------
    # Auditoria
    # ------------------------------------------------------------------
    @staticmethod
    def _log(
        target_user,
        actor,
        action: str,
        source: str = IdentityAuditSource.LOCAL,
        detail: str = "",
    ) -> IdentityAuditLog:
        return IdentityAuditLog.objects.create(
            target_user=target_user,
            actor=actor
            if (actor and getattr(actor, "is_authenticated", False))
            else None,
            action=action,
            source=source,
            detail=detail,
        )

    @staticmethod
    def _touch_user(user: User) -> None:
        """Actualiza `updated_at` para que `meta.lastModified` refleje cambios de rol."""
        user.save(update_fields=["updated_at"])

    @staticmethod
    def _touch_role(role: Role) -> None:
        with suppress_identity_audit():
            role.save(update_fields=["updated_at"])

    # ------------------------------------------------------------------
    # Consultas
    # ------------------------------------------------------------------
    @staticmethod
    def get_user(user_id) -> User:
        try:
            return User.objects.prefetch_related("groups__sig_role").get(id=user_id)
        except (User.DoesNotExist, ValueError, TypeError, DjangoValidationError) as exc:
            raise UserNotFoundError(f"Usuario '{user_id}' no encontrado.") from exc

    @staticmethod
    def list_users(include_inactive: bool = False):
        qs = User.objects.prefetch_related("groups__sig_role").order_by("username")
        if not include_inactive:
            qs = qs.filter(is_active=True)
        return qs

    @staticmethod
    def get_role(role_id) -> Role:
        try:
            return (
                Role.objects.select_related("technical_group")
                .prefetch_related("technical_group__user_set")
                .get(id=role_id)
            )
        except (Role.DoesNotExist, ValueError, TypeError, DjangoValidationError) as exc:
            raise RoleNotFoundError(f"Rol '{role_id}' no encontrado.") from exc

    @staticmethod
    def list_roles(include_inactive: bool = False):
        qs = (
            Role.objects.select_related("technical_group")
            .prefetch_related("technical_group__user_set")
            .order_by("display_name")
        )
        if not include_inactive:
            qs = qs.filter(is_active=True)
        return qs

    @staticmethod
    def is_role_allowed(display_name: str) -> bool:
        """
        Lista opcional de grupos permitidos (`SCIM_ALLOWED_GROUPS`).

        Lista vacia: catalogo dinamico. Si se configura, solo se pueden crear
        los grupos listados; el rol de administracion del portal siempre esta
        permitido para no bloquear la operacion base.
        """
        allowed = list(getattr(settings, "SCIM_ALLOWED_GROUPS", []) or [])
        if not allowed:
            return True
        return display_name in set(core_technical_roles()) | set(allowed)

    # ------------------------------------------------------------------
    # Roles tecnicos
    # ------------------------------------------------------------------
    @staticmethod
    def _reactivate_role_if_needed(
        role: Role, actor=None, source: str = IdentityAuditSource.SCIM
    ) -> None:
        """Reactiva un rol desactivado al reasignarlo (no deja membresias sobre roles inactivos)."""
        if role.is_active:
            return
        role.is_active = True
        with suppress_identity_audit():
            role.save(update_fields=["is_active", "updated_at"])
        IdentityService._log(
            None,
            actor,
            IdentityAuditAction.ROLE_ASSIGNED,
            source=source,
            detail=f"Rol tecnico reactivado: {role.display_name}",
        )

    @staticmethod
    @transaction.atomic
    def ensure_technical_role(
        display_name: str,
        actor=None,
        source: str = IdentityAuditSource.SCIM,
    ) -> Role:
        """
        Obtiene o crea el Rol Tecnico y su Django Group asociado.

        Soporta creaciones concurrentes: si otra peticion creo el rol (o su
        grupo) primero, se reutiliza en vez de responder un error interno.
        """
        role = (
            Role.objects.select_related("technical_group")
            .filter(display_name=display_name)
            .first()
        )
        if role:
            if role.technical_group_id is None:
                with suppress_identity_audit():
                    group, _ = Group.objects.get_or_create(name=display_name)
                role.technical_group = group
                with suppress_identity_audit():
                    role.save(update_fields=["technical_group", "updated_at"])
            return role

        created = False
        try:
            with transaction.atomic():
                with suppress_identity_audit():
                    group, _ = Group.objects.get_or_create(name=display_name)
                role = Role.objects.create(
                    display_name=display_name,
                    kind=RoleKind.TECHNICAL,
                    technical_group=group,
                    description="Rol tecnico creado automaticamente por la capa de identidad.",
                )
                created = True
        except IntegrityError:
            # Carrera con otra peticion: el rol ya existe, se reutiliza.
            role = Role.objects.select_related("technical_group").get(
                display_name=display_name
            )

        if created:
            IdentityService._log(
                None,
                actor,
                IdentityAuditAction.ROLE_ASSIGNED,
                source=source,
                detail=f"Rol tecnico creado: {display_name}",
            )
        return role

    @staticmethod
    @transaction.atomic
    def assign_technical_role(
        user: User, role: Role, actor=None, source: str = IdentityAuditSource.SCIM
    ) -> None:
        if role.technical_group_id is None:
            raise RoleNotFoundError(
                f"El rol '{role.display_name}' no tiene grupo tecnico asociado."
            )

        IdentityService._reactivate_role_if_needed(role, actor=actor, source=source)
        already_member = user.groups.filter(pk=role.technical_group_id).exists()
        if not already_member:
            with suppress_identity_audit():
                user.groups.add(role.technical_group)
            IdentityService._touch_user(user)
            IdentityService._touch_role(role)
            IdentityService._log(
                user,
                actor,
                IdentityAuditAction.ROLE_ASSIGNED,
                source=source,
                detail=f"Rol asignado: {role.display_name}",
            )

    @staticmethod
    @transaction.atomic
    def remove_technical_role(
        user: User, role: Role, actor=None, source: str = IdentityAuditSource.SCIM
    ) -> None:
        if role.technical_group_id is None:
            raise RoleNotFoundError(
                f"El rol '{role.display_name}' no tiene grupo tecnico asociado."
            )

        was_member = user.groups.filter(pk=role.technical_group_id).exists()
        if was_member:
            with suppress_identity_audit():
                user.groups.remove(role.technical_group)
            IdentityService._touch_user(user)
            IdentityService._touch_role(role)
            IdentityService._log(
                user,
                actor,
                IdentityAuditAction.ROLE_REMOVED,
                source=source,
                detail=f"Rol removido: {role.display_name}",
            )

    # ------------------------------------------------------------------
    # Ciclo de vida del usuario
    # ------------------------------------------------------------------
    @staticmethod
    @transaction.atomic
    def create_local_user(user: User, actor=None) -> User:
        """
        Crea una cuenta local de bootstrap desde el Admin (no desde SCIM).

        CompAC sigue siendo la fuente de altas en produccion; este metodo existe
        para que el Admin no escriba identidad por fuera de la Service Layer y
        deje la operacion auditada como `LOCAL`.
        """
        if User.objects.filter(username=user.username).exists():
            raise UserAlreadyExistsError(
                f"El userName '{user.username}' ya esta registrado."
            )
        if not user.password:
            user.set_unusable_password()
        try:
            user.save()
        except IntegrityError as exc:
            raise UserAlreadyExistsError(
                f"El userName '{user.username}' ya esta registrado."
            ) from exc

        IdentityService._log(
            user,
            actor,
            IdentityAuditAction.USER_PROVISIONED,
            source=IdentityAuditSource.LOCAL,
            detail="Usuario creado localmente desde el Admin de Django.",
        )
        return user

    @staticmethod
    @transaction.atomic
    def provision_user(
        data: dict, actor=None, source: str = IdentityAuditSource.SCIM
    ) -> User:
        """
        Crea un usuario a partir de un payload de identidad. Lanza
        `UserAlreadyExistsError` si el userName ya existe.

        La cuenta se crea sin contrasena usable: la autenticacion de personas
        correspondera al SSO corporativo (pendiente) y CompAC solo aprovisiona.
        """
        username = str(data.get("userName") or "").strip()
        if not username:
            raise IdentityError("El userName (Enel ID) es obligatorio.")
        if not is_valid_corporate_id(username):
            raise IdentityError(
                "El userName debe cumplir el formato corporativo Axxxxxx (ej: A123456)."
            )

        if User.objects.filter(username=username).exists():
            raise UserAlreadyExistsError(
                f"El userName '{username}' ya esta registrado."
            )

        name = data.get("name") or {}
        if not isinstance(name, dict):
            raise IdentityError(
                "El atributo 'name' debe ser un objeto con givenName y familyName."
            )
        email = extract_email(data) or ""
        external_id = str(data.get("externalId") or data.get("enel_id") or "").strip()

        user = User(
            username=username,
            enel_id=external_id or username,
            first_name=str(
                name.get("givenName", "") or data.get("first_name", "")
            ).strip(),
            last_name=str(
                name.get("familyName", "") or data.get("last_name", "")
            ).strip(),
            email=email,
            is_active=coerce_bool(data.get("active", True)),
        )
        user.set_unusable_password()
        try:
            with transaction.atomic():
                user.save()
        except IntegrityError as exc:
            # Carrera con otra peticion: el userName ya existe.
            raise UserAlreadyExistsError(
                f"El userName '{username}' ya esta registrado."
            ) from exc

        IdentityService._log(
            user,
            actor,
            IdentityAuditAction.USER_PROVISIONED,
            source=source,
            detail=f"Usuario aprovisionado: {username}",
        )
        return user

    @staticmethod
    @transaction.atomic
    def update_user(
        user: User, data: dict, actor=None, source: str = IdentityAuditSource.SCIM
    ) -> User:
        """
        Actualiza atributos de un usuario existente. No modifica el userName
        (en SCIM el identificador de red es inmutable) ni la contrasena.
        """
        changed: list[str] = []

        def apply(field: str, value: str) -> None:
            if getattr(user, field) != value:
                setattr(user, field, value)
                changed.append(field)

        name = data.get("name")
        if name is not None and not isinstance(name, dict):
            raise IdentityError(
                "El atributo 'name' debe ser un objeto con givenName y familyName."
            )

        if isinstance(name, dict):
            if "givenName" in name:
                apply("first_name", str(name.get("givenName") or "").strip())
            if "familyName" in name:
                apply("last_name", str(name.get("familyName") or "").strip())

        if "first_name" in data:
            apply("first_name", str(data.get("first_name") or "").strip())
        if "last_name" in data:
            apply("last_name", str(data.get("last_name") or "").strip())

        email = extract_email(data)
        if email is not None:
            apply("email", email)

        external_id = data.get("externalId", data.get("enel_id", _UNSET))
        if external_id is not _UNSET:
            apply("enel_id", str(external_id or "").strip() or "")

        status_change = None
        if "active" in data:
            active_value = coerce_bool(data["active"])
            if active_value != user.is_active:
                status_change = active_value

        if changed:
            unique_fields = sorted(set(changed))
            user.save(update_fields=[*unique_fields, "updated_at"])
            IdentityService._log(
                user,
                actor,
                IdentityAuditAction.USER_UPDATED,
                source=source,
                detail=f"Campos actualizados: {', '.join(unique_fields)}",
            )

        if status_change is not None:
            if status_change:
                IdentityService.activate_user(user, actor=actor, source=source)
            else:
                IdentityService.deactivate_user(user, actor=actor, source=source)
        return user

    @staticmethod
    @transaction.atomic
    def deactivate_user(
        user: User, actor=None, source: str = IdentityAuditSource.SCIM
    ) -> User:
        """
        Baja logica (active=false), nunca borrado fisico. Se conserva el
        registro y toda la historia para la auditoria.
        """
        if user.is_active:
            user.is_active = False
            user.save(update_fields=["is_active", "updated_at"])
        IdentityService._log(
            user,
            actor,
            IdentityAuditAction.USER_DEACTIVATED,
            source=source,
            detail="Cuenta inactivada (baja logica). El registro y su historia se conservan.",
        )
        return user

    @staticmethod
    @transaction.atomic
    def activate_user(
        user: User, actor=None, source: str = IdentityAuditSource.SCIM
    ) -> User:
        if not user.is_active:
            user.is_active = True
            user.save(update_fields=["is_active", "updated_at"])
        IdentityService._log(
            user,
            actor,
            IdentityAuditAction.USER_ACTIVATED,
            source=source,
            detail="Cuenta reactivada (unlock).",
        )
        return user
