from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from django.db import transaction

from .models import (
    IdentityAuditAction,
    IdentityAuditLog,
    IdentityAuditSource,
    Role,
    User,
)
from .roles import admin_role_name, capability_summary
from .services.identity_service import IdentityService
from .signals import suppress_identity_audit


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "enel_id",
        "is_active",
        "is_staff",
    )
    search_fields = ("username", "email", "first_name", "last_name", "enel_id")
    # Se omiten a proposito los permisos directos de Django: el acceso se
    # otorga por grupo (rol), no al usuario.
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Datos personales", {"fields": ("first_name", "last_name", "email")}),
        (
            "Estado y roles",
            {
                "fields": ("is_active", "is_staff", "is_superuser", "groups"),
                "description": (
                    "Los permisos se otorgan por grupo/rol. Los permisos directos de Django no se usan. "
                    "Los cambios locales quedan registrados como inconsistencias operativas."
                ),
            },
        ),
        ("Fechas relevantes", {"fields": ("last_login", "date_joined")}),
        ("Informacion corporativa", {"fields": ("enel_id",)}),
    )
    filter_horizontal = ("groups",)

    def has_delete_permission(self, request, obj=None):
        """La baja de cuentas es logica (`active=false`); no se borran desde el Admin."""
        return False

    def save_model(self, request, obj, form, change):
        """Altas y mutaciones del Admin delegan perfil, estado y roles a la Service Layer."""
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
            # Se revierten en memoria para que el servicio sea quien persiste y
            # audita el perfil; `super()` guarda estado/password y el servicio
            # aplica los campos de perfil.
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
        """
        Las membresías editadas en el Admin pasan por la Service Layer.

        Se silencia el signal de m2m para no duplicar la auditoria: cada alta o
        baja de rol se registra con origen `LOCAL` desde el servicio.
        """
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


class GroupAdmin(BaseGroupAdmin):
    """
    Grupo tecnico = rol del portal.

    Se oculta el editor de permisos de Django y se muestra, en solo lectura,
    la capacidad declarada en el codigo.
    """

    list_display = ("name", "role_summary")
    search_fields = ("name",)
    fields = ("name", "role_permissions")
    readonly_fields = ("role_permissions",)
    filter_horizontal = ()
    ordering = ("name",)

    @admin.display(description="Tipo")
    def role_summary(self, obj):
        return "Administrador" if obj.name == admin_role_name() else "-"

    @admin.display(description="Capacidades del rol")
    def role_permissions(self, obj):
        if obj is None:
            return "Guarda el grupo para ver sus capacidades."
        if obj.name != admin_role_name():
            return "Este grupo no tiene capacidades declaradas en el portal."
        return " ".join(capability_summary())


admin.site.unregister(Group)
admin.site.register(Group, GroupAdmin)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("display_name", "kind", "technical_group", "is_active")
    list_filter = ("kind", "is_active")
    search_fields = ("display_name",)


@admin.register(IdentityAuditLog)
class IdentityAuditLogAdmin(admin.ModelAdmin):
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
