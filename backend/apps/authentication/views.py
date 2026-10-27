from datetime import datetime, time

from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from oauth2_provider.views import TokenView
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import IdentityAuditAction, IdentityAuditLog, IdentityAuditSource, User
from .permissions import IsPortalAdmin
from .serializers import (
    CustomTokenObtainPairSerializer,
    IdentityAuditLogSerializer,
    UserSerializer,
)
from .throttling import LoginRateThrottle, TokenEndpointThrottle


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login local del portal (puente del MVP).

    Entrega access/refresh JWT y el perfil con sus roles. No hay registro
    publico ni recuperacion de contrasena: las cuentas llegan por CompAC.
    """

    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [LoginRateThrottle]


class ThrottledTokenView(TokenView):
    """
    Endpoint OAuth2 de token (`/o/token/` y alias `/token/`) con limite de
    peticiones por cliente/IP. Es una vista Django, fuera de DRF, por lo que el
    throttle se aplica manualmente.
    """

    def post(self, request, *args, **kwargs):
        throttle = TokenEndpointThrottle()
        if not throttle.allow_request(request, self):
            retry_after = int(throttle.wait() or 1)
            response = JsonResponse(
                {
                    "error": "too_many_requests",
                    "error_description": "Demasiadas solicitudes al endpoint de token; intenta mas tarde.",
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
            response["Retry-After"] = str(retry_after)
            return response
        return super().post(request, *args, **kwargs)


class MeView(APIView):
    """Datos del usuario autenticado y sus roles efectivos."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class UserPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Consulta de usuarios del portal.

    El listado/detalle global queda reservado al rol de administracion;
    `current` y `directory` estan disponibles para cualquier autenticado.
    La gestion de cuentas la hace CompAC por SCIM, no este endpoint.
    """

    queryset = User.objects.filter(is_active=True).prefetch_related("groups__sig_role")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = UserPagination

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [IsPortalAdmin()]
        return [permissions.IsAuthenticated()]

    @action(
        detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated]
    )
    def current(self, request):
        """Retorna el usuario autenticado actual."""
        return Response(self.get_serializer(request.user).data)


def _parse_iso_param(value):
    """Parsea fecha/hora ISO8601 (o fecha simple) y responde 400 si es invalida."""
    if not value:
        return None
    parsed = parse_datetime(value)
    if parsed is None:
        parsed_date = parse_date(value)
        if parsed_date is not None:
            parsed = datetime.combine(parsed_date, time.min)
    if parsed is None:
        raise DRFValidationError(
            {"detail": f"Fecha invalida: '{value}'. Usa formato ISO8601."}
        )
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed)
    return parsed


class IdentityAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Visor de auditoria de identidad (solo rol de administracion).

    Filtros: `user` (username afectado o ejecutor), `action`, `source`,
    `since`/`until` (ISO8601 o fecha) y `q` (texto en el detalle o usuarios).
    """

    queryset = IdentityAuditLog.objects.all().select_related("target_user", "actor")
    serializer_class = IdentityAuditLogSerializer
    permission_classes = [IsPortalAdmin]
    pagination_class = UserPagination

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        username = params.get("user")
        if username:
            qs = qs.filter(
                Q(target_user__username__iexact=username)
                | Q(actor__username__iexact=username)
            )

        action_value = params.get("action")
        if action_value:
            if action_value not in IdentityAuditAction.values:
                raise DRFValidationError(
                    {"detail": f"Accion invalida: '{action_value}'."}
                )
            qs = qs.filter(action=action_value)

        source_value = params.get("source")
        if source_value:
            if source_value not in IdentityAuditSource.values:
                raise DRFValidationError(
                    {"detail": f"Origen invalido: '{source_value}'."}
                )
            qs = qs.filter(source=source_value)

        since = _parse_iso_param(params.get("since"))
        if since:
            qs = qs.filter(created_at__gte=since)
        until = _parse_iso_param(params.get("until"))
        if until:
            qs = qs.filter(created_at__lte=until)

        query = params.get("q")
        if query:
            qs = qs.filter(
                Q(detail__icontains=query)
                | Q(target_user__username__icontains=query)
                | Q(actor__username__icontains=query)
            )
        return qs
