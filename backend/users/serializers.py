import uuid

from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser


class AnonymousAuthSerializer(serializers.Serializer):
    uuid = serializers.CharField(max_length=150)

    def validate_uuid(self, value):
        try:
            uuid.UUID(str(value))
        except ValueError:
            raise serializers.ValidationError("El identificador enviado no es válido.")
        return str(value)

    def create(self, validated_data):
        uuid_str = validated_data["uuid"]
        user, _ = CustomUser.objects.get_or_create(
            id=uuid_str,
            defaults={
                "username": uuid_str,
                "is_platform_admin": False,
            },
        )
        refresh = RefreshToken.for_user(user)
        return {
            "user_id": str(user.id),
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
