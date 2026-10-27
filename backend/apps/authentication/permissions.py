from rest_framework.permissions import SAFE_METHODS, BasePermission

from .roles import admin_role_name

__all__ = [
    "HasScimAccess",
    "IsPortalAdmin",
    "ReadOnlyOrAdmin",
    "is_portal_admin",
    "user_has_group",
]


def user_has_group(user, group_names: list[str]) -> bool:
    """
    Verifica si el usuario pertenece a alguno de los grupos indicados o es superusuario.

    Un grupo cuyo `Role` del catalogo fue desactivado no otorga permisos aunque
    existan membresias residuales. Un grupo sin entrada en el catalogo sigue
    contando (compatibilidad durante la transicion).
    """
    if not user or not getattr(user, "is_authenticated", False):
        return False
    if user.is_superuser:
        return True
    return (
        user.groups.filter(name__in=group_names)
        .exclude(sig_role__is_active=False)
        .exists()
    )


def is_portal_admin(user) -> bool:
    """El usuario tiene el rol tecnico de administracion del portal (o es superusuario)."""
    return user_has_group(user, [admin_role_name()])


class IsPortalAdmin(BasePermission):
    """Permiso exclusivo para el rol de administracion del portal."""

    def has_permission(self, request, view):
        return is_portal_admin(request.user)


class HasScimAccess(BasePermission):
    """
    Acceso al conector SCIM (maquina a maquina).

    Acepta un token OAuth2 con scope `scim` o el rol de administracion
    autenticado por JWT/sesion para operacion asistida. No hay acceso anonimo.
    """

    def has_permission(self, request, view):
        if is_portal_admin(request.user):
            return True
        token = getattr(request, "auth", None)
        scopes = getattr(token, "scope", "") or ""
        return "scim" in str(scopes).split()


class ReadOnlyOrAdmin(BasePermission):
    """Lectura publica; la escritura queda reservada al rol de administracion."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return is_portal_admin(request.user)
