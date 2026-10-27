"""
Conector SCIM 2.0 del portal.

Endpoints:
- `/api/scim/v2/Users`        GET (lista/filtro), POST (201/409)
- `/api/scim/v2/Users/{id}`   GET (404), PUT/PATCH, DELETE (204, baja logica)
- `/api/scim/v2/Groups`       GET, POST (201/409, lista opcional de grupos)
- `/api/scim/v2/Groups/{id}`  GET (404), PATCH (PatchOp add/remove/replace members)
- `/api/scim/v2/Schemas`      GET (Core User/Group)

Autenticacion OAuth2 Bearer (client_credentials, scope `scim`) o el rol de
administracion autenticado para operacion asistida. Toda mutacion pasa por la
Service Layer de identidad.
"""

import re
import uuid

from django.contrib.auth.models import Group
from django.db import transaction
from oauth2_provider.contrib.rest_framework import OAuth2Authentication
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.parsers import JSONParser
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import IdentityAuditSource, Role, User
from .permissions import HasScimAccess
from .scim_media import ScimJSONParser, ScimJSONRenderer
from .scim_serializers import (
    SCIM_GROUP_SCHEMA,
    SCIM_LIST_SCHEMA,
    SCIM_PATCH_SCHEMA,
    SCIM_USER_SCHEMA,
    ScimGroupSerializer,
    ScimPatchOpSerializer,
    ScimUserPatchOpSerializer,
    ScimUserSerializer,
    build_list_response,
    parse_scim_filter,
    scim_error,
)
from .services.identity_service import (
    IdentityError,
    IdentityService,
    RoleNotFoundError,
    UserAlreadyExistsError,
    UserNotFoundError,
    coerce_bool,
)
from .throttling import ScimRateThrottle

SCIM_AUTHENTICATION_CLASSES = [
    OAuth2Authentication,
    JWTAuthentication,
    SessionAuthentication,
]

_MEMBER_REMOVE_PATTERN = re.compile(r'members\[value\s+eq\s+"([^"]+)"\]')


class ScimAPIView(APIView):
    """
    Vista base del conector: autenticacion OAuth2/JWT/sesion, permiso `scim`,
    limite de peticiones y media types `application/json` y `application/scim+json`.
    """

    authentication_classes = SCIM_AUTHENTICATION_CLASSES
    permission_classes = [HasScimAccess]
    throttle_classes = [ScimRateThrottle]
    parser_classes = [JSONParser, ScimJSONParser]
    renderer_classes = [JSONRenderer, ScimJSONRenderer]


def _pagination_params(request) -> tuple[int, int]:
    """Parametros de paginacion SCIM: `startIndex` (1-based) y `count` (maximo 200)."""
    try:
        start_index = max(1, int(request.query_params.get("startIndex", 1)))
    except (TypeError, ValueError):
        start_index = 1
    try:
        count = min(200, max(0, int(request.query_params.get("count", 100))))
    except (TypeError, ValueError):
        count = 100
    return start_index, count


def _paginated_response(request, queryset, serializer_class) -> Response:
    total = queryset.count()
    start_index, count = _pagination_params(request)
    page = queryset[start_index - 1 : start_index - 1 + count]
    data = serializer_class(page, many=True, context={"request": request}).data
    return Response(build_list_response(list(data), total, start_index, count))


def _validation_detail(exc: DRFValidationError) -> str:
    detail = exc.detail
    if isinstance(detail, dict):
        return "; ".join(f"{key}: {value}" for key, value in detail.items())
    if isinstance(detail, (list, tuple)):
        return "; ".join(str(item) for item in detail)
    return str(detail)


class ScimUsersView(ScimAPIView):
    def get(self, request):
        """GET /Users — listado con filtro `userName eq "X"` / `active eq true` y paginacion SCIM."""
        qs = IdentityService.list_users(include_inactive=True)

        filter_expr = request.query_params.get("filter")
        if filter_expr:
            try:
                attr, value = parse_scim_filter(filter_expr)
            except DRFValidationError as exc:
                return Response(
                    scim_error(_validation_detail(exc), 400),
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if attr == "userName":
                qs = qs.filter(username=value)
            elif attr == "externalId":
                qs = qs.filter(enel_id=value)
            elif attr == "active":
                qs = qs.filter(is_active=value.strip().lower() == "true")
            elif attr == "id":
                try:
                    user_id = uuid.UUID(value)
                except (ValueError, AttributeError):
                    return Response(
                        scim_error(f"id invalido: '{value}'.", 400),
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                qs = qs.filter(id=user_id)
            else:
                return Response(
                    scim_error(f"Atributo de filtro no soportado: '{attr}'.", 400),
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return _paginated_response(request, qs, ScimUserSerializer)

    def post(self, request):
        """POST /Users — aprovisionamiento (201) o conflicto por userName duplicado (409)."""
        try:
            user = IdentityService.provision_user(
                request.data,
                actor=request.user,
                source=IdentityAuditSource.SCIM,
            )
        except UserAlreadyExistsError as exc:
            return Response(scim_error(str(exc), 409), status=status.HTTP_409_CONFLICT)
        except IdentityError as exc:
            return Response(
                scim_error(str(exc), 400), status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ScimUserSerializer(user, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ScimUserDetailView(ScimAPIView):
    def get(self, request, user_id):
        try:
            user = IdentityService.get_user(user_id)
        except UserNotFoundError as exc:
            return Response(scim_error(str(exc), 404), status=status.HTTP_404_NOT_FOUND)
        return Response(ScimUserSerializer(user, context={"request": request}).data)

    def put(self, request, user_id):
        return self._update(request, user_id, partial=False)

    def patch(self, request, user_id):
        return self._update(request, user_id, partial=True)

    def _update(self, request, user_id, partial: bool):
        try:
            user = IdentityService.get_user(user_id)
        except UserNotFoundError as exc:
            return Response(scim_error(str(exc), 404), status=status.HTTP_404_NOT_FOUND)

        data = request.data
        if partial and self._is_patch_op(data):
            try:
                data = self._patch_op_payload(data)
            except DRFValidationError as exc:
                return Response(
                    scim_error(_validation_detail(exc), 400),
                    status=status.HTTP_400_BAD_REQUEST,
                )
        elif not partial:
            # PUT reemplaza el recurso: los atributos ausentes se vacian.
            data = {
                "name": request.data.get("name", {"givenName": "", "familyName": ""}),
                "emails": request.data.get("emails", []),
                "active": request.data.get("active", user.is_active),
            }
            if "externalId" in request.data:
                data["externalId"] = request.data["externalId"]

        try:
            user = IdentityService.update_user(
                user, data, actor=request.user, source=IdentityAuditSource.SCIM
            )
        except IdentityError as exc:
            return Response(
                scim_error(str(exc), 400), status=status.HTTP_400_BAD_REQUEST
            )
        # Releer para que la respuesta refleje grupos y estado ya actualizados.
        user = IdentityService.get_user(user.id)
        return Response(ScimUserSerializer(user, context={"request": request}).data)

    @staticmethod
    def _is_patch_op(data) -> bool:
        """Distingue un PatchOp de una representacion parcial del recurso."""
        return "Operations" in data or SCIM_PATCH_SCHEMA in (data.get("schemas") or [])

    @classmethod
    def _patch_op_payload(cls, data) -> dict:
        """
        Traduce un PatchOp de usuario a los atributos que consume
        `IdentityService.update_user`. Lanza ValidationError si la operacion o
        la ruta no estan soportadas.
        """
        serializer = ScimUserPatchOpSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        payload: dict = {}
        name: dict = {}
        for operation in serializer.validated_data["Operations"]:
            op = operation["op"]
            path = (operation.get("path") or "").strip()
            value = operation.get("value")

            if op == "remove":
                raise DRFValidationError(
                    f"Operacion 'remove' no soportada sobre '{path}' en Users."
                )

            if not path and isinstance(value, dict):
                payload.update(value)
            elif path == "active":
                payload["active"] = coerce_bool(value)
            elif path == "externalId":
                payload["externalId"] = value
            elif path == "name.givenName":
                name["givenName"] = value
            elif path == "name.familyName":
                name["familyName"] = value
            elif path == "name" and isinstance(value, dict):
                name.update(value)
            elif path == "emails":
                payload["emails"] = (
                    value if isinstance(value, list) else [{"value": value}]
                )
            else:
                raise DRFValidationError(
                    f"Ruta PatchOp no soportada en Users: '{path}'."
                )

        if name:
            payload["name"] = name
        return payload

    def delete(self, request, user_id):
        """DELETE /Users/{id} — baja logica (active=false) con 204 No Content."""
        try:
            user = IdentityService.get_user(user_id)
        except UserNotFoundError as exc:
            return Response(scim_error(str(exc), 404), status=status.HTTP_404_NOT_FOUND)
        IdentityService.deactivate_user(
            user, actor=request.user, source=IdentityAuditSource.SCIM
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ScimGroupsView(ScimAPIView):
    def get(self, request):
        """GET /Groups — listado con filtro `displayName eq "X"`."""
        qs = IdentityService.list_roles(include_inactive=True)

        filter_expr = request.query_params.get("filter")
        if filter_expr:
            try:
                attr, value = parse_scim_filter(filter_expr)
            except DRFValidationError as exc:
                return Response(
                    scim_error(_validation_detail(exc), 400),
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if attr == "displayName":
                qs = qs.filter(display_name=value)
            elif attr == "id":
                try:
                    role_id = uuid.UUID(value)
                except (ValueError, AttributeError):
                    return Response(
                        scim_error(f"id invalido: '{value}'.", 400),
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                qs = qs.filter(id=role_id)
            else:
                return Response(
                    scim_error(f"Atributo de filtro no soportado: '{attr}'.", 400),
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return _paginated_response(request, qs, ScimGroupSerializer)

    def post(self, request):
        """POST /Groups — crea el rol y su grupo tecnico (201) o conflicto (409)."""
        display_name = str(request.data.get("displayName") or "").strip()
        if not display_name:
            return Response(
                scim_error("El atributo displayName es obligatorio.", 400),
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not IdentityService.is_role_allowed(display_name):
            return Response(
                scim_error(
                    f"El rol '{display_name}' no esta en el catalogo de roles tecnicos permitidos.",
                    400,
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            Role.objects.filter(display_name=display_name).exists()
            or Group.objects.filter(name=display_name).exists()
        ):
            return Response(
                scim_error(f"El grupo '{display_name}' ya existe.", 409),
                status=status.HTTP_409_CONFLICT,
            )

        raw_members = request.data.get("members") or []
        if not isinstance(raw_members, list):
            return Response(
                scim_error("El atributo 'members' debe ser una lista.", 400),
                status=status.HTTP_400_BAD_REQUEST,
            )
        member_ids = []
        for member in raw_members:
            member_id = member.get("value") if isinstance(member, dict) else member
            if not member_id:
                return Response(
                    scim_error(
                        "Miembro invalido: cada entrada de 'members' requiere 'value'.",
                        400,
                    ),
                    status=status.HTTP_400_BAD_REQUEST,
                )
            member_ids.append(str(member_id))

        # Los usuarios deben existir: un id desconocido responde 400 en vez de ignorarse.
        try:
            members = [IdentityService.get_user(member_id) for member_id in member_ids]
        except UserNotFoundError as exc:
            return Response(
                scim_error(str(exc), 400), status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            role = IdentityService.ensure_technical_role(
                display_name, actor=request.user
            )

            for user in members:
                IdentityService.assign_technical_role(
                    user, role, actor=request.user, source=IdentityAuditSource.SCIM
                )

        serializer = ScimGroupSerializer(role, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ScimGroupDetailView(ScimAPIView):
    def get(self, request, group_id):
        try:
            role = IdentityService.get_role(group_id)
        except RoleNotFoundError as exc:
            return Response(scim_error(str(exc), 404), status=status.HTTP_404_NOT_FOUND)
        return Response(ScimGroupSerializer(role, context={"request": request}).data)

    def patch(self, request, group_id):
        """
        PATCH /Groups/{id} — asignacion, revocacion y reemplazo de roles via
        PatchOp sobre `members`. Los usuarios referenciados deben existir
        (respuesta 400 si no) y la operacion es atomica.
        """
        try:
            role = IdentityService.get_role(group_id)
        except RoleNotFoundError as exc:
            return Response(scim_error(str(exc), 404), status=status.HTTP_404_NOT_FOUND)

        serializer = ScimPatchOpSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except DRFValidationError as exc:
            return Response(
                scim_error(_validation_detail(exc), 400),
                status=status.HTTP_400_BAD_REQUEST,
            )

        operations = serializer.validated_data["Operations"]
        for operation in operations:
            if operation["op"] not in ("add", "remove", "replace"):
                return Response(
                    scim_error(
                        f"Operacion PatchOp no soportada: '{operation['op']}'.", 400
                    ),
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Resolver los usuarios antes de aplicar: un id inexistente responde 400
        # en vez de ignorarse en silencio (evita divergencias de permisos).
        resolved: list[tuple[str, list[User]]] = []
        for operation in operations:
            op = operation["op"]
            path = operation.get("path", "")
            if op == "remove":
                member_ids = self._remove_targets(path, operation.get("value"))
            else:
                member_ids = self._member_ids(operation.get("value"))
            if op in ("add", "replace") and not member_ids:
                return Response(
                    scim_error(
                        f"La operacion '{op} members' requiere al menos un miembro.",
                        400,
                    ),
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                users = [
                    IdentityService.get_user(member_id) for member_id in member_ids
                ]
            except UserNotFoundError as exc:
                return Response(
                    scim_error(str(exc), 400), status=status.HTTP_400_BAD_REQUEST
                )
            resolved.append((op, users))

        with transaction.atomic():
            for op, users in resolved:
                if op == "add":
                    for user in users:
                        IdentityService.assign_technical_role(
                            user,
                            role,
                            actor=request.user,
                            source=IdentityAuditSource.SCIM,
                        )
                elif op == "remove":
                    for user in users:
                        IdentityService.remove_technical_role(
                            user,
                            role,
                            actor=request.user,
                            source=IdentityAuditSource.SCIM,
                        )
                else:
                    self._replace_members(role, users, actor=request.user)

        # Releer el rol para que la respuesta refleje las membresias actualizadas.
        role = IdentityService.get_role(role.id)
        return Response(
            ScimGroupSerializer(role, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

    @staticmethod
    def _replace_members(role, users: list[User], actor=None) -> None:
        """
        `replace` sobre `members`: la lista enviada pasa a ser la membresia
        completa del rol (agrega faltantes y quita sobrantes).
        """
        desired_ids = {user.id for user in users}
        current = (
            list(role.technical_group.user_set.all()) if role.technical_group_id else []
        )
        current_ids = {user.id for user in current}

        for user in current:
            if user.id not in desired_ids:
                IdentityService.remove_technical_role(
                    user, role, actor=actor, source=IdentityAuditSource.SCIM
                )
        for user in users:
            if user.id not in current_ids:
                IdentityService.assign_technical_role(
                    user, role, actor=actor, source=IdentityAuditSource.SCIM
                )

    @staticmethod
    def _member_ids(value) -> list[str]:
        if not value:
            return []
        if isinstance(value, dict):
            return [str(value["value"])] if value.get("value") else []
        if isinstance(value, list):
            ids = []
            for item in value:
                if isinstance(item, dict) and item.get("value"):
                    ids.append(str(item["value"]))
                elif isinstance(item, str) and item.strip():
                    ids.append(item.strip())
            return ids
        return [str(value)]

    @classmethod
    def _remove_targets(cls, path: str, value) -> list[str]:
        match = _MEMBER_REMOVE_PATTERN.search(path or "")
        if match:
            return [match.group(1)]
        return cls._member_ids(value)


class ScimSchemasView(ScimAPIView):
    def get(self, request):
        """GET /Schemas — Core de User y Group (sin extensiones de negocio)."""
        schemas = [
            {
                "id": SCIM_USER_SCHEMA,
                "name": "User",
                "description": "SCIM Core User Schema",
                "attributes": [
                    {
                        "name": "userName",
                        "type": "string",
                        "required": True,
                        "uniqueness": "server",
                    },
                    {
                        "name": "name",
                        "type": "complex",
                        "subAttributes": [
                            {"name": "givenName", "type": "string"},
                            {"name": "familyName", "type": "string"},
                        ],
                    },
                    {
                        "name": "emails",
                        "type": "complex",
                        "multiValued": True,
                        "subAttributes": [{"name": "value", "type": "string"}],
                    },
                    {"name": "active", "type": "boolean"},
                    {
                        "name": "groups",
                        "type": "complex",
                        "multiValued": True,
                        "mutability": "readOnly",
                        "subAttributes": [
                            {"name": "value", "type": "string"},
                            {"name": "display", "type": "string"},
                        ],
                    },
                ],
            },
            {
                "id": SCIM_GROUP_SCHEMA,
                "name": "Group",
                "description": "SCIM Core Group Schema",
                "attributes": [
                    {"name": "displayName", "type": "string", "required": True},
                    {
                        "name": "members",
                        "type": "complex",
                        "multiValued": True,
                        "subAttributes": [
                            {"name": "value", "type": "string"},
                            {"name": "type", "type": "string"},
                            {"name": "display", "type": "string"},
                        ],
                    },
                ],
            },
        ]
        return Response(
            {
                "schemas": [SCIM_LIST_SCHEMA],
                "totalResults": len(schemas),
                "Resources": schemas,
            }
        )
