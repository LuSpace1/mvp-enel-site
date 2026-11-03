"""Permisos del modulo de KPIs."""

from rest_framework.permissions import BasePermission

from apps.cms.permissions import can_manage_cms

__all__ = ["CanViewAnalytics", "can_view_analytics"]


def can_view_analytics(user) -> bool:
    """El tablero de KPIs lo ve quien administra el CMS (equipo de Quality)."""
    return can_manage_cms(user)


class CanViewAnalytics(BasePermission):
    def has_permission(self, request, view):
        return can_view_analytics(request.user)
