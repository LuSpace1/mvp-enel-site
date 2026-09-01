from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ("id", "username", "is_platform_admin", "is_active")
    list_filter = ("is_platform_admin", "is_active")
    search_fields = ("id", "username")
    ordering = ("-date_joined",)
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            "Permisos",
            {"fields": ("is_platform_admin", "is_active", "is_staff", "is_superuser")},
        ),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser:
            qs = qs.filter(is_platform_admin=False)
        return qs
