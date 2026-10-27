"""
Serializadores SCIM 2.0 del conector de identidades.

`meta` es obligatorio en toda respuesta; `User.groups` usa {value, display} y
`Group.members` usa {value, type, display}.
"""

import re
from datetime import UTC

from django.utils import timezone
from rest_framework import serializers

from .models import Role, User

SCIM_USER_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:User"
SCIM_GROUP_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:Group"
SCIM_LIST_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:ListResponse"
SCIM_PATCH_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:PatchOp"
SCIM_ERROR_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:Error"

SCIM_USERS_PATH = "/api/scim/v2/Users"
SCIM_GROUPS_PATH = "/api/scim/v2/Groups"


def iso8601(value) -> str:
    """Formatea un datetime como ISO 8601 UTC con sufijo Z (ej. 2026-09-08T10:59:58Z)."""
    if value is None:
        return timezone.now().astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    return value.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def build_meta(resource_type: str, last_modified, location: str) -> dict:
    return {
        "resourceType": resource_type,
        "lastModified": iso8601(last_modified),
        "location": location,
    }


def build_list_response(
    resources: list, total: int, start_index: int, count: int
) -> dict:
    return {
        "schemas": [SCIM_LIST_SCHEMA],
        "totalResults": total,
        "startIndex": start_index,
        "itemsPerPage": len(resources),
        "Resources": resources,
    }


def scim_error(detail: str, status_code: int) -> dict:
    return {
        "schemas": [SCIM_ERROR_SCHEMA],
        "detail": detail,
        "status": str(status_code),
    }


_FILTER_PATTERN = re.compile(r'^\s*(\w+)\s+eq\s+(?:"([^"]*)"|([^\s"]+))\s*$')


def parse_scim_filter(filter_expr: str) -> tuple[str, str]:
    """
    Parser minimo del filtro SCIM `attr eq "value"`.

    Acepta el valor entre comillas (texto) o sin comillas (booleanos/numeros
    como `active eq true`). Devuelve (atributo, valor). Lanza ValidationError
    si no puede interpretarlo.
    """
    match = _FILTER_PATTERN.match(filter_expr or "")
    if not match:
        raise serializers.ValidationError(
            f"Filtro SCIM no soportado: '{filter_expr}'. Se espera: atributo eq \"valor\"."
        )
    value = match.group(2) if match.group(2) is not None else match.group(3)
    return match.group(1), value


class ScimUserSerializer(serializers.ModelSerializer):
    """Recurso SCIM `User` (Core Schema)."""

    schemas = serializers.SerializerMethodField()
    userName = serializers.CharField(source="username", read_only=True)
    name = serializers.SerializerMethodField()
    emails = serializers.SerializerMethodField()
    active = serializers.BooleanField(source="is_active", read_only=True)
    groups = serializers.SerializerMethodField()
    meta = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "schemas",
            "id",
            "userName",
            "name",
            "emails",
            "active",
            "groups",
            "meta",
        )

    def get_schemas(self, obj) -> list[str]:
        return [SCIM_USER_SCHEMA]

    def get_name(self, obj) -> dict:
        return {"givenName": obj.first_name or "", "familyName": obj.last_name or ""}

    def get_emails(self, obj) -> list[dict]:
        if not obj.email:
            return []
        return [{"value": obj.email, "primary": True}]

    def get_groups(self, obj) -> list[dict]:
        """
        Grupos del usuario como recurso SCIM. `value` usa el id del `Role` del
        catalogo cuando existe; si no, el id del Django Group.
        """
        result = []
        for group in obj.groups.all():
            role = getattr(group, "sig_role", None)
            result.append(
                {
                    "value": str(role.id) if role else str(group.id),
                    "display": role.display_name if role else group.name,
                }
            )
        return result

    def get_meta(self, obj) -> dict:
        request = self.context.get("request")
        location = (
            request.build_absolute_uri(f"{SCIM_USERS_PATH}/{obj.id}")
            if request
            else f"{SCIM_USERS_PATH}/{obj.id}"
        )
        return build_meta("User", obj.updated_at, location)


class ScimGroupSerializer(serializers.ModelSerializer):
    """Recurso SCIM `Group`. El catalogo `Role` es la fuente."""

    schemas = serializers.SerializerMethodField()
    displayName = serializers.CharField(source="display_name", read_only=True)
    members = serializers.SerializerMethodField()
    meta = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ("schemas", "id", "displayName", "members", "meta")

    def get_schemas(self, obj) -> list[str]:
        return [SCIM_GROUP_SCHEMA]

    def get_members(self, obj) -> list[dict]:
        if obj.technical_group_id is None:
            return []
        users = sorted(
            obj.technical_group.user_set.all(), key=lambda user: user.username
        )
        return [
            {"value": str(user.id), "type": "User", "display": user.username}
            for user in users
        ]

    def get_meta(self, obj) -> dict:
        request = self.context.get("request")
        location = (
            request.build_absolute_uri(f"{SCIM_GROUPS_PATH}/{obj.id}")
            if request
            else f"{SCIM_GROUPS_PATH}/{obj.id}"
        )
        return build_meta("Group", obj.updated_at, location)


class ScimPatchOperationSerializer(serializers.Serializer):
    op = serializers.ChoiceField(choices=["add", "remove", "replace"])
    path = serializers.CharField(required=False, allow_blank=True)
    value = serializers.JSONField(required=False)


class ScimPatchOpSerializer(serializers.Serializer):
    """
    Payload de PATCH /Groups/{id} para asignar o revocar roles por SCIM.

    Se valida que las operaciones operen sobre la propiedad `members`.
    """

    schemas = serializers.ListField(child=serializers.CharField(), required=False)
    Operations = ScimPatchOperationSerializer(many=True)

    def validate(self, attrs):
        schemas = attrs.get("schemas") or []
        if schemas and SCIM_PATCH_SCHEMA not in schemas:
            raise serializers.ValidationError(
                f"El schema del payload debe ser '{SCIM_PATCH_SCHEMA}'."
            )
        if not attrs.get("Operations"):
            raise serializers.ValidationError(
                "El payload PatchOp debe incluir al menos una operacion."
            )
        for operation in attrs["Operations"]:
            path = operation.get("path", "")
            if not path.startswith("members"):
                raise serializers.ValidationError(
                    f"Solo se soportan operaciones sobre 'members'. Recibido: '{path}'."
                )
        return attrs


class ScimUserPatchOpSerializer(serializers.Serializer):
    """
    Payload PatchOp de `PATCH /Users/{id}`.

    Rutas admitidas: `active`, `name.givenName`, `name.familyName`, `emails` y
    `externalId`. Las rutas no soportadas responden 400.
    """

    schemas = serializers.ListField(child=serializers.CharField(), required=False)
    Operations = ScimPatchOperationSerializer(many=True)

    def validate(self, attrs):
        schemas = attrs.get("schemas") or []
        if schemas and SCIM_PATCH_SCHEMA not in schemas:
            raise serializers.ValidationError(
                f"El schema del payload debe ser '{SCIM_PATCH_SCHEMA}'."
            )
        if not attrs.get("Operations"):
            raise serializers.ValidationError(
                "El payload PatchOp debe incluir al menos una operacion."
            )
        return attrs
