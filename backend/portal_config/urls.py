from django.contrib import admin
from django.urls import include, path

from apps.authentication.views import ThrottledTokenView

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/auth/", include("apps.authentication.urls")),
    path("api/scim/v2/", include("apps.authentication.scim_urls")),
    # Token OAuth2 client_credentials con limite de peticiones por cliente/IP.
    path("o/token/", ThrottledTokenView.as_view(), name="oauth2_token"),
    path("o/", include("oauth2_provider.urls", namespace="oauth2_provider")),
    # Alias en la ruta que suele documentar la integracion.
    path("token/", ThrottledTokenView.as_view(), name="oauth2_token_alias"),
    path("api/cms/", include("apps.cms.urls")),
]
