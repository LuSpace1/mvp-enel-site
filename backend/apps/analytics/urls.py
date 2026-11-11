from django.urls import path

from .views import (
    ColectaView,
    DashboardView,
    ExportView,
    IdentificarView,
    OpinionView,
)

urlpatterns = [
    path("eventos/", ColectaView.as_view(), name="analytics_eventos"),
    path("identificar/", IdentificarView.as_view(), name="analytics_identificar"),
    path("opiniones/", OpinionView.as_view(), name="analytics_opiniones"),
    path("admin/dashboard/", DashboardView.as_view(), name="analytics_dashboard"),
    path("admin/export/", ExportView.as_view(), name="analytics_export"),
]
