from __future__ import annotations

from datetime import date
from uuid import UUID

from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Sesion
from .permissions import CanViewAnalytics
from .serializers import (
    ColectaSerializer,
    IdentificacionSerializer,
    OpinionEntradaSerializer,
)
from .services import (
    correo_valido,
    exportar_csv,
    identificar,
    registrar_lote,
    registrar_opinion,
    tablero,
)
from .services import (
    personas as personas_kpi,
)
from .throttling import ColectaThrottle


def _fechas(request) -> tuple[date | None, date | None]:
    desde = parse_date(request.query_params.get("desde", ""))
    hasta = parse_date(request.query_params.get("hasta", ""))
    if request.query_params.get("desde") and desde is None:
        raise ValidationError({"desde": "Formato esperado: YYYY-MM-DD."})
    if request.query_params.get("hasta") and hasta is None:
        raise ValidationError({"hasta": "Formato esperado: YYYY-MM-DD."})
    return desde, hasta


class ColectaView(APIView):
    """Recibe el lote de eventos de una visita (publico, detras de VPN)."""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ColectaThrottle]

    def post(self, request):
        serializador = ColectaSerializer(data=request.data)
        serializador.is_valid(raise_exception=True)
        datos = serializador.validated_data

        identificacion = datos.get("identificacion")
        if identificacion:
            if not correo_valido(identificacion["email"]):
                raise ValidationError(
                    {"identificacion": "El correo no pertenece a un dominio permitido."}
                )
            identificar(
                datos["anonymous_id"],
                identificacion["email"],
                datos.get("visitante_id"),
            )

        sesion = registrar_lote(datos["anonymous_id"], datos)
        return Response({"sesion_id": str(sesion.id)}, status=status.HTTP_202_ACCEPTED)


class IdentificarView(APIView):
    """Vincula el navegador actual con el correo corporativo (fase piloto)."""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ColectaThrottle]

    def post(self, request):
        serializador = IdentificacionSerializer(data=request.data)
        serializador.is_valid(raise_exception=True)
        anonymous_id = str(request.data.get("anonymous_id") or "")
        if not anonymous_id:
            raise ValidationError({"anonymous_id": "Requerido."})
        if not correo_valido(serializador.validated_data["email"]):
            raise ValidationError(
                {"email": "El correo no pertenece a un dominio permitido."}
            )

        visitante = identificar(
            anonymous_id,
            serializador.validated_data["email"],
            request.data.get("visitante_id"),
        )
        return Response(
            {"visitante_id": str(visitante.id), "email": visitante.email},
            status=status.HTTP_200_OK,
        )


class OpinionView(APIView):
    """Guarda el Likert de una visita que ya existe."""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ColectaThrottle]

    def post(self, request):
        serializador = OpinionEntradaSerializer(data=request.data)
        serializador.is_valid(raise_exception=True)
        sesion_id = request.data.get("sesion_id")
        anonymous_id = str(request.data.get("anonymous_id") or "")
        filtro = Q(visitante__anonymous_id=anonymous_id)
        try:
            visitante_id = request.data.get("visitante_id")
            if visitante_id:
                filtro |= Q(visitante_id=UUID(str(visitante_id)))
        except (ValueError, TypeError):
            pass
        sesion = Sesion.objects.filter(filtro, id=sesion_id).first()
        if sesion is None:
            raise ValidationError({"sesion_id": "Visita desconocida."})
        opinion = registrar_opinion(sesion, serializador.validated_data)
        return Response({"id": str(opinion.id)}, status=status.HTTP_201_CREATED)


class DashboardView(APIView):
    permission_classes = [CanViewAnalytics]

    def get(self, request):
        desde, hasta = _fechas(request)
        return Response(tablero(desde, hasta))


class PersonasView(APIView):
    permission_classes = [CanViewAnalytics]

    def get(self, request):
        desde, hasta = _fechas(request)
        try:
            pagina = int(request.query_params.get("pagina", 1))
            tamano = int(request.query_params.get("tamano", 25))
        except ValueError as error:
            raise ValidationError({"pagina": "Debe ser numerico."}) from error
        return Response(personas_kpi(desde, hasta, pagina, tamano))


class ExportView(APIView):
    permission_classes = [CanViewAnalytics]

    def get(self, request):
        desde, hasta = _fechas(request)
        contenido = exportar_csv(desde, hasta)
        nombre = f"kpis-portal-{timezone.localdate().isoformat()}.csv"
        respuesta = HttpResponse(contenido, content_type="text/csv; charset=utf-8")
        respuesta["Content-Disposition"] = f'attachment; filename="{nombre}"'
        return respuesta
