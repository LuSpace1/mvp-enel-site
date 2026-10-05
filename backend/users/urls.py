from django.urls import path

from .views import AdminAuthView, AnonymousAuthView

urlpatterns = [
    path("auth/anonymous/", AnonymousAuthView.as_view(), name="auth_anonymous"),
    path("auth/admin/", AdminAuthView.as_view(), name="auth_admin"),
]
