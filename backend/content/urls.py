from django.urls import path

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
]
