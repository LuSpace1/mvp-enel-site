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
    """Verifica si el usuario pertenece a alguno de los grupos indicados."""
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
    """Verifica si el usuario tiene el rol de administrador técnico."""
    return user_has_group(user, [admin_role_name()])


class IsPortalAdmin(BasePermission):
    """Permiso exclusivo para administradores técnicos."""

    def has_permission(self, request, view):
        return is_portal_admin(request.user)


class HasScimAccess(BasePermission):
    """Permiso para llamadas SCIM de CompAC (mediante OAuth2 con scope scim) o admins."""

    def has_permission(self, request, view):
        if is_portal_admin(request.user):
            return True
        token = getattr(request, "auth", None)
        scopes = getattr(token, "scope", "") or ""
        return "scim" in str(scopes).split()


class ReadOnlyOrAdmin(BasePermission):
    """Permite lectura pública y reserva la escritura a administradores."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return is_portal_admin(request.user)
