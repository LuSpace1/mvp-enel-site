from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from .models import Dispositivo

MAX_EVENTOS_POR_LOTE = 100


class IdentificacionSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)


class EventoEntradaSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=64)
    seccion = serializers.CharField(
        max_length=64, required=False, allow_blank=True, default=""
    )
    recurso = serializers.CharField(
        max_length=160, required=False, allow_blank=True, default=""
    )
    valor = serializers.FloatField(required=False, allow_null=True, default=None)
    datos = serializers.JSONField(required=False, default=dict)
    ocurrido_en = serializers.DateTimeField(required=False, default=None)


class SesionEntradaSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    iniciada_en = serializers.DateTimeField(required=False, default=None)
    entrada = serializers.CharField(
        max_length=64, required=False, allow_blank=True, default=""
    )
    dispositivo = serializers.ChoiceField(
        choices=Dispositivo.choices, required=False, default=Dispositivo.ESCRITORIO
    )
    referrer = serializers.CharField(
        max_length=255, required=False, allow_blank=True, default=""
    )
    campana = serializers.CharField(
        max_length=120, required=False, allow_blank=True, default=""
    )
    duracion_activa = serializers.IntegerField(required=False, min_value=0, default=0)
    profundidad = serializers.FloatField(
        required=False, min_value=0, max_value=1, default=0
    )
    secciones_vistas = serializers.IntegerField(required=False, min_value=0, default=0)
    completo = serializers.BooleanField(required=False, default=False)


class OpinionEntradaSerializer(serializers.Serializer):
    puntaje = serializers.IntegerField(min_value=1, max_value=5)
    comentario = serializers.CharField(
        max_length=2000, required=False, allow_blank=True, default=""
    )
    seccion = serializers.CharField(
        max_length=64, required=False, allow_blank=True, default="cierre"
    )


class ColectaSerializer(serializers.Serializer):
    anonymous_id = serializers.CharField(max_length=64)
    visitante_id = serializers.UUIDField(required=False, allow_null=True, default=None)
    sesion = SesionEntradaSerializer()
    identificacion = IdentificacionSerializer(required=False)
    eventos = EventoEntradaSerializer(many=True, required=False, default=list)
    opinion = OpinionEntradaSerializer(required=False)

    def validate_eventos(self, eventos):
        if len(eventos) > MAX_EVENTOS_POR_LOTE:
            raise serializers.ValidationError(
                f"Maximo {MAX_EVENTOS_POR_LOTE} eventos por lote."
            )
        limite = timezone.now() + timedelta(minutes=5)
        for evento in eventos:
            ocurrido = evento.get("ocurrido_en")
            if not ocurrido or ocurrido > limite:
                evento["ocurrido_en"] = timezone.now()
        return eventos
