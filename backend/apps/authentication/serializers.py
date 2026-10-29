from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import IdentityAuditLog, User
from .permissions import is_portal_admin, user_has_group
from .roles import admin_role_name, cms_admin_role_name


class UserSerializer(serializers.ModelSerializer):
    """Serializador del perfil de usuario y sus permisos en el portal."""

    groups = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")
    full_name = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    capabilities = serializers.SerializerMethodField()

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
            "capabilities",
            "created_at",
            "updated_at",
        )

    def get_full_name(self, obj) -> str:
        return obj.get_full_name() or obj.username

    def get_roles(self, obj) -> list[str]:
        roles: list[str] = []
        if is_portal_admin(obj):
            roles.append(admin_role_name())
        if user_has_group(obj, [cms_admin_role_name()]):
            roles.append(cms_admin_role_name())
        return list(dict.fromkeys(roles))

    def get_capabilities(self, obj) -> dict[str, bool]:
        from apps.cms.permissions import can_manage_cms

        return {"can_manage_cms": can_manage_cms(obj)}


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Login del portal: permite iniciar sesión con ID Enel o correo corporativo.
    Devuelve los tokens JWT junto con los datos y permisos del usuario.
    """

    def validate(self, attrs):
        raw_credential = (attrs.get(self.username_field) or "").strip()

        # Buscar usuario por username (ID Enel) o por correo corporativo (insensible a mayúsculas)
        matched_user = (
            User.objects.filter(username__iexact=raw_credential).first()
            or User.objects.filter(email__iexact=raw_credential).first()
        )

        if matched_user:
            attrs[self.username_field] = matched_user.username

        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class IdentityAuditLogSerializer(serializers.ModelSerializer):
    """Serializador para el registro de auditoría de usuarios y roles."""

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
