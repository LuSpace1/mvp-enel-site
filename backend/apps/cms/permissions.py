"""Permisos del CMS: un unico rol de administracion editorial."""

from rest_framework.permissions import BasePermission

from apps.authentication.permissions import user_has_group
from apps.authentication.roles import cms_admin_role_name

__all__ = [
    "CanManageCms",
    "can_manage_cms",
]


def can_manage_cms(user) -> bool:
    """
    El usuario puede administrar todo el CMS.

    Solo `CMS_Admin` (o un superusuario) tiene acceso. `Portal_Admin` no otorga
    permisos editoriales: es un rol tecnico separado para identidad/SCIM.
    """
    return user_has_group(user, [cms_admin_role_name()])


class CanManageCms(BasePermission):
    """Permiso unico para editar, publicar, reordenar y restaurar el CMS."""

    def has_permission(self, request, view):
        return can_manage_cms(request.user)
