from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from django.db import transaction
from django.utils.html import format_html, format_html_join
from django.utils.safestring import mark_safe

from .models import (
    IdentityAuditAction,
    IdentityAuditLog,
    IdentityAuditSource,
    Role,
    User,
)
from .roles import (
    DEFAULT_USER_CAPABILITIES,
    ROLE_CAPABILITIES,
    ROLE_COLORS,
    ROLE_LABELS,
)
from .services.identity_service import IdentityService
from .signals import suppress_identity_audit


def _capabilities_card(
    title: str, capabilities: tuple[str, ...], color: str = "#6b7280"
) -> str:
    """Tarjeta HTML para visualizar capacidades de un rol en el panel de Django."""
    return format_html(
        "<div style='border-left:4px solid {color};background:#f8f9fa;"
        "padding:8px 12px;margin:6px 0;border-radius:4px'>"
        "<div style='font-weight:600;color:{color};margin-bottom:4px'>{title}</div>"
        "<ul style='margin:0;padding-left:20px'>{items}</ul></div>",
        color=color,
        title=title,
        items=format_html_join("", "<li>{}</li>", ((cap,) for cap in capabilities)),
    )


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Administración de usuarios en el panel de Django."""

    list_display = (
        "username",
        "full_name",
        "email",
        "enel_id",
        "display_roles",
        "is_active",
        "is_staff",
    )
    list_filter = ("is_active", "is_staff", "groups")
    search_fields = ("username", "email", "first_name", "last_name", "enel_id")
    readonly_fields = ("effective_access",)
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Datos personales", {"fields": ("first_name", "last_name", "email")}),
        (
            "Estado y roles",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "effective_access",
                ),
                "description": (
                    "Asigna el grupo 'CMS_Admin' para otorgar permisos editoriales en /cms. "
                    "Los usuarios sin grupo tienen acceso de solo lectura (Lector) al portal."
                ),
            },
        ),
        ("Fechas relevantes", {"fields": ("last_login", "date_joined")}),
        ("Informacion corporativa", {"fields": ("enel_id",)}),
    )
    filter_horizontal = ("groups",)

    @admin.display(description="Nombre completo")
    def full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name or "—"

    @admin.display(description="Rol en el Portal")
    def display_roles(self, obj):
        group_names = list(obj.groups.values_list("name", flat=True))
        if not group_names:
            return mark_safe(
                '<span style="background:#f3f4f6; color:#4b5563; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:500;">Lector</span>'
            )
        badges = []
        for name in group_names:
            color = ROLE_COLORS.get(name, "#4b5563")
            badges.append(
                format_html(
                    '<span style="background:{color}; color:#fff; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:600; margin-right:4px;">{label}</span>',
                    color=color,
                    label=name,
                )
            )
        return mark_safe("".join(badges))

    @admin.display(description="Acceso efectivo (Portal Enel)")
    def effective_access(self, obj):
        if obj is None or not obj.pk:
            return "Guarda el usuario para calcular su acceso efectivo."

        group_names = list(obj.groups.values_list("name", flat=True))
        cards = []

        if obj.is_superuser:
            cards.append(
                mark_safe(
                    "<div style='border-left:4px solid #ba2121;background:#fff5f5;"
                    "padding:8px 12px;margin:6px 0;border-radius:4px'>"
                    "<div style='font-weight:600;color:#ba2121;margin-bottom:4px'>Superusuario de Django</div>"
                    "<p style='margin:0'>Acceso total a la base de datos y administración técnica de Django.</p></div>"
                )
            )

        if not group_names:
            cards.append(
                _capabilities_card(
                    "Lector del Portal (Sin grupos asignados)",
                    DEFAULT_USER_CAPABILITIES,
                    "#6b7280",
                )
            )
        else:
            for name in group_names:
                caps = ROLE_CAPABILITIES.get(name)
                label = ROLE_LABELS.get(name, name)
                color = ROLE_COLORS.get(name, "#4b5563")
                if caps:
                    cards.append(_capabilities_card(f"{label} ({name})", caps, color))
                else:
                    cards.append(
                        format_html(
                            "<div style='border-left:4px solid #9ca3af;background:#f9fafb;"
                            "padding:8px 12px;margin:6px 0;border-radius:4px'>"
                            "<div style='font-weight:600;color:#4b5563'>{name}</div>"
                            "<p style='margin:0;font-size:12px;color:#6b7280'>Grupo sin capacidades editoriales directas en el portal.</p></div>",
                            name=name,
                        )
                    )

        return mark_safe("".join(cards))

    def has_delete_permission(self, request, obj=None):
        """Impide el borrado físico: las bajas se manejan desactivando el usuario."""
        return False

    def save_model(self, request, obj, form, change):
        """Guarda cambios del usuario delegando a IdentityService para registrar auditoría."""
        previous = None
        if change and obj.pk:
            previous = (
                User.objects.filter(pk=obj.pk)
                .values("first_name", "last_name", "email", "enel_id", "is_active")
                .first()
            )

        profile: dict = {}
        if previous:
            for field in ("first_name", "last_name", "email", "enel_id"):
                value = getattr(obj, field)
                if previous[field] != value:
                    profile[field] = value or ""
            for field in profile:
                setattr(obj, field, previous[field])

        with transaction.atomic():
            actor = request.user if request.user.is_authenticated else None
            if not change:
                IdentityService.create_local_user(obj, actor=actor)
                return

            super().save_model(request, obj, form, change)

            if profile:
                IdentityService.update_user(
                    obj,
                    profile,
                    actor=actor,
                    source=IdentityAuditSource.LOCAL,
                )

            if previous and previous["is_active"] != obj.is_active:
                if obj.is_active:
                    IdentityService.activate_user(
                        obj, actor=actor, source=IdentityAuditSource.LOCAL
                    )
                else:
                    IdentityService.deactivate_user(
                        obj, actor=actor, source=IdentityAuditSource.LOCAL
                    )

    def save_related(self, request, form, formsets, change):
        """Guarda membresías de grupos delegando a IdentityService para auditar los cambios."""
        instance = form.instance
        previous_group_ids = (
            set(instance.groups.values_list("id", flat=True)) if change else set()
        )

        with suppress_identity_audit():
            super().save_related(request, form, formsets, change)

        current_group_ids = set(instance.groups.values_list("id", flat=True))
        actor = request.user if request.user.is_authenticated else None

        for group_id in current_group_ids - previous_group_ids:
            group = Group.objects.get(pk=group_id)
            role = IdentityService.ensure_technical_role(
                group.name,
                actor=actor,
                source=IdentityAuditSource.LOCAL,
            )
            IdentityService.assign_technical_role(
                instance,
                role,
                actor=actor,
                source=IdentityAuditSource.LOCAL,
            )

        for group_id in previous_group_ids - current_group_ids:
            group = Group.objects.get(pk=group_id)
            role = Role.objects.filter(technical_group=group).first()
            if role:
                IdentityService.remove_technical_role(
                    instance,
                    role,
                    actor=actor,
                    source=IdentityAuditSource.LOCAL,
                )
            else:
                IdentityService._log(
                    instance,
                    actor,
                    IdentityAuditAction.LOCAL_PERMISSION_CHANGE,
                    source=IdentityAuditSource.LOCAL,
                    detail=f"Rol removido localmente desde el Admin: {group.name}",
                )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """Administración del catálogo de roles del portal."""

    list_display = ("display_name", "kind", "technical_group", "is_active")
    list_filter = ("kind", "is_active")
    search_fields = ("display_name",)


try:
    admin.site.unregister(Group)
except admin.sites.NotRegistered:
    pass


@admin.register(Group)
class GroupAdmin(BaseGroupAdmin):
    """
    Grupo técnico de Enel / CompAC (CMS_Admin, Portal_Admin).

    Reemplaza la lista cruda de permisos técnicos de Django por un panel legible
    que explica las capacidades del rol en el portal.
    """

    list_display = ("name", "role_label", "members_count")
    search_fields = ("name",)
    fields = ("name", "role_description")
    readonly_fields = ("role_description",)

    @admin.display(description="Tipo de rol")
    def role_label(self, obj):
        return ROLE_LABELS.get(obj.name, "Grupo auxiliar")

    @admin.display(description="Usuarios con este rol")
    def members_count(self, obj):
        return obj.user_set.count()

    @admin.display(description="Capacidades en el Portal")
    def role_description(self, obj):
        caps = ROLE_CAPABILITIES.get(obj.name)
        label = ROLE_LABELS.get(obj.name, obj.name)
        color = ROLE_COLORS.get(obj.name, "#4b5563")
        if caps:
            return _capabilities_card(
                f"Capacidades de {label} ({obj.name})", caps, color
            )
        return format_html(
            "<em>'{name}' no es un rol técnico con capacidades declaradas en el portal.</em>",
            name=obj.name,
        )


@admin.register(IdentityAuditLog)
class IdentityAuditLogAdmin(admin.ModelAdmin):
    """Visualización en solo lectura de la bitácora de auditoría de identidad."""

    list_display = ("created_at", "action", "target_user", "actor", "source")
    list_filter = ("action", "source")
    search_fields = ("target_user__username", "actor__username", "detail")
    readonly_fields = (
        "target_user",
        "actor",
        "action",
        "source",
        "detail",
        "created_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
