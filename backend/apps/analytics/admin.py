from django.contrib import admin

from .models import Evento, Opinion, Sesion, Visitante


@admin.register(Visitante)
class VisitanteAdmin(admin.ModelAdmin):
    list_display = (
        "email",
        "email_verificado",
        "anonymous_id",
        "origen",
        "first_seen_at",
        "last_seen_at",
    )
    list_filter = ("origen",)
    search_fields = ("email", "anonymous_id")


@admin.register(Sesion)
class SesionAdmin(admin.ModelAdmin):
    list_display = (
        "visitante",
        "iniciada_en",
        "duracion_activa",
        "profundidad",
        "completo",
    )
    list_filter = ("completo", "dispositivo")
    date_hierarchy = "iniciada_en"


@admin.register(Evento)
class EventoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "seccion", "recurso", "ocurrido_en")
    list_filter = ("nombre", "seccion")
    date_hierarchy = "ocurrido_en"


@admin.register(Opinion)
class OpinionAdmin(admin.ModelAdmin):
    list_display = ("puntaje", "visitante", "creada_en")
    list_filter = ("puntaje",)
