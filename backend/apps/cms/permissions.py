"""Permisos del CMS basados en grupos provisionados por CompAC."""

from rest_framework.permissions import BasePermission

from apps.authentication.permissions import is_portal_admin, user_has_group
from apps.authentication.roles import cms_editor_role_name, cms_publisher_role_name

__all__ = [
    "CanEditCms",
    "CanPublishCms",
    "can_edit_cms",
    "can_publish_cms",
]


def can_edit_cms(user) -> bool:
    if is_portal_admin(user):
        return True
    return user_has_group(user, [cms_editor_role_name(), cms_publisher_role_name()])


def can_publish_cms(user) -> bool:
    if is_portal_admin(user):
        return True
    return user_has_group(user, [cms_publisher_role_name()])


class CanEditCms(BasePermission):
    """Editor o publicador del CMS (o administrador del portal)."""

    def has_permission(self, request, view):
        return can_edit_cms(request.user)


class CanPublishCms(BasePermission):
    """Solo el publicador del CMS (o administrador del portal) publica y reordena."""

    def has_permission(self, request, view):
        return can_publish_cms(request.user)
