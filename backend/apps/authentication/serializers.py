from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import IdentityAuditLog, User
from .permissions import is_portal_admin
from .roles import admin_role_name


class UserSerializer(serializers.ModelSerializer):
    """Perfil de usuario: datos, grupos/roles vigentes y flags de estado."""

    groups = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")
    full_name = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "enel_id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "is_active",
            "is_staff",
            "is_superuser",
            "groups",
            "roles",
            "created_at",
            "updated_at",
        )

    def get_full_name(self, obj) -> str:
        return obj.get_full_name() or obj.username

    def get_roles(self, obj) -> list[str]:
        # Solo los roles vigentes en el catalogo otorgan permisos: un Role
        # desactivado no debe mostrarse como si diera acceso.
        return [admin_role_name()] if is_portal_admin(obj) else []


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT + perfil/roles del usuario para el login local (puente del MVP)."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class IdentityAuditLogSerializer(serializers.ModelSerializer):
    """Registro de auditoria de identidad con etiquetas legibles."""

    action_label = serializers.CharField(source="get_action_display", read_only=True)
    source_label = serializers.CharField(source="get_source_display", read_only=True)
    target_username = serializers.CharField(
        source="target_user.username", read_only=True, default=""
    )
    target_name = serializers.CharField(
        source="target_user.get_full_name", read_only=True, default=""
    )
    actor_username = serializers.CharField(
        source="actor.username", read_only=True, default=""
    )
    actor_name = serializers.CharField(
        source="actor.get_full_name", read_only=True, default=""
    )

    class Meta:
        model = IdentityAuditLog
        fields = (
            "id",
            "created_at",
            "action",
            "action_label",
            "source",
            "source_label",
            "detail",
            "target_user",
            "target_username",
            "target_name",
            "actor",
            "actor_username",
            "actor_name",
        )
