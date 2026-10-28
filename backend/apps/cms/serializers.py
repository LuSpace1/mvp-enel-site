from rest_framework import serializers

from .models import ContentRevision, MediaAsset


def _user_data(user):
    if not user:
        return None
    return {
        "id": str(user.pk),
        "username": user.username,
        "name": user.get_full_name() or user.username,
    }


class MediaAssetSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    created_by = serializers.SerializerMethodField()

    class Meta:
        model = MediaAsset
        fields = (
            "id",
            "url",
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

    def get_url(self, obj) -> str:
        return f"/api/cms/media/{obj.pk}/"

    def get_created_by(self, obj):
        return _user_data(obj.created_by)


class RevisionSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    updated_by = serializers.SerializerMethodField()
    published_by = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ContentRevision
        fields = (
            "id",
            "status",
            "status_label",
            "version",
            "message",
            "created_by",
            "updated_by",
            "published_by",
            "created_at",
            "updated_at",
            "published_at",
        )

    def get_created_by(self, obj):
        return _user_data(obj.created_by)

    def get_updated_by(self, obj):
        return _user_data(obj.updated_by)

    def get_published_by(self, obj):
        return _user_data(obj.published_by)


class RevisionDetailSerializer(RevisionSerializer):
    class Meta(RevisionSerializer.Meta):
        fields = (*RevisionSerializer.Meta.fields, "payload")


class DraftSaveSerializer(serializers.Serializer):
    payload = serializers.JSONField()
    version = serializers.IntegerField(min_value=1)
    message = serializers.CharField(required=False, allow_blank=True, max_length=255)


class PublishSerializer(serializers.Serializer):
    version = serializers.IntegerField(min_value=1)
    message = serializers.CharField(required=False, allow_blank=True, max_length=255)


class MediaUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    alt = serializers.CharField(required=False, allow_blank=True, max_length=255)
