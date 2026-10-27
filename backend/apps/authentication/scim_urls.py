from django.urls import path

from .scim_views import (
    ScimGroupDetailView,
    ScimGroupsView,
    ScimSchemasView,
    ScimUserDetailView,
    ScimUsersView,
)

app_name = "scim"

urlpatterns = [
    # Se aceptan rutas con y sin barra final: algunas herramientas SCIM la agregan.
    path("Users", ScimUsersView.as_view(), name="users"),
    path("Users/", ScimUsersView.as_view()),
    path("Users/<uuid:user_id>", ScimUserDetailView.as_view(), name="user-detail"),
    path("Users/<uuid:user_id>/", ScimUserDetailView.as_view()),
    path("Groups", ScimGroupsView.as_view(), name="groups"),
    path("Groups/", ScimGroupsView.as_view()),
    path("Groups/<uuid:group_id>", ScimGroupDetailView.as_view(), name="group-detail"),
    path("Groups/<uuid:group_id>/", ScimGroupDetailView.as_view()),
    path("Schemas", ScimSchemasView.as_view(), name="schemas"),
    path("Schemas/", ScimSchemasView.as_view()),
]
