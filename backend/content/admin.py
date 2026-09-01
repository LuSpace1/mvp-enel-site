from django.contrib import admin

from .models import VideoLink


@admin.register(VideoLink)
class VideoLinkAdmin(admin.ModelAdmin):
    list_display = ("title", "section_identifier", "youtube_url", "updated_at")
    search_fields = ("title", "section_identifier")
    list_filter = ("updated_at",)
    readonly_fields = ("created_at", "updated_at")

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields + ("section_identifier",)
        return self.readonly_fields
