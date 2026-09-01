from django.utils import timezone
from rest_framework import serializers

from .models import VideoLink


class VideoLinkSerializer(serializers.ModelSerializer):
    is_recent = serializers.SerializerMethodField()

    class Meta:
        model = VideoLink
        fields = [
            "id",
            "title",
            "youtube_url",
            "section_identifier",
            "created_at",
            "updated_at",
            "is_recent",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_is_recent(self, obj):
        if obj.created_at:
            return (timezone.now() - obj.created_at).days < 7
        return False
