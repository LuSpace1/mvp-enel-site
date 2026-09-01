from django.urls import path
from django.views.generic import TemplateView

from .views import AdminVideoDetailView, AdminVideoListCreateView, PublicVideoListView

urlpatterns = [
    path("videos/", PublicVideoListView.as_view(), name="public_videos_list"),
    path(
        "admin/videos/",
        AdminVideoListCreateView.as_view(),
        name="admin_videos_list_create",
    ),
    path(
        "admin/videos/<int:pk>/",
        AdminVideoDetailView.as_view(),
        name="admin_video_detail",
    ),
    path("info/", TemplateView.as_view(template_name="info.html"), name="info"),
]
