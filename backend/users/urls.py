from django.urls import path
from django.views.generic import TemplateView

from .views import AdminAuthView, AnonymousAuthView

urlpatterns = [
    path("auth/anonymous/", AnonymousAuthView.as_view(), name="auth_anonymous"),
    path("auth/admin/", AdminAuthView.as_view(), name="auth_admin"),
    path("health/", TemplateView.as_view(template_name="health.html"), name="health"),
]
