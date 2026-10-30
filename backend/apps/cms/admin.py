from django.contrib import admin

from .models import ContentRevision, MediaAsset


@admin.register(ContentRevision)
class ContentRevisionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "status",
        "version_number",
        "is_current",
        "message",
        "created_at",
        "published_at",
    )
    list_filter = ("status", "is_current")
    search_fields = ("message", "id")
    readonly_fields = (
        "id",
        "status",
        "payload",
        "lock_version",
        "version_number",
        "is_current",
        "message",
        "based_on",
        "created_by",
        "updated_by",
        "published_by",
        "created_at",
        "updated_at",
        "published_at",
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(MediaAsset)
class MediaAssetAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "original_name",
        "mime_type",
        "size",
        "width",
        "height",
        "created_at",
    )
    search_fields = ("original_name", "alt")
    readonly_fields = (
        "id",
        "file",
        "mime_type",
        "size",
        "width",
        "height",
        "checksum",
        "original_name",
        "alt",
        "created_by",
        "created_at",
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
