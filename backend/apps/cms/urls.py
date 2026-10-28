from django.urls import path

from .views import (
    AdminContentView,
    CmsSchemaView,
    DiscardDraftView,
    MediaDetailView,
    MediaUploadView,
    PublicContentView,
    PublishView,
    RevisionDetailView,
    RevisionListView,
    RevisionRestoreView,
    StartEditingView,
)

urlpatterns = [
    path("public/", PublicContentView.as_view(), name="cms_public_content"),
    path("media/<uuid:pk>/", MediaDetailView.as_view(), name="cms_media_detail"),
    path("admin/schema/", CmsSchemaView.as_view(), name="cms_schema"),
    path("admin/content/", AdminContentView.as_view(), name="cms_admin_content"),
    path(
        "admin/content/editing/",
        StartEditingView.as_view(),
        name="cms_start_editing",
    ),
    path(
        "admin/content/discard/", DiscardDraftView.as_view(), name="cms_discard_draft"
    ),
    path("admin/publish/", PublishView.as_view(), name="cms_publish"),
    path("admin/revisions/", RevisionListView.as_view(), name="cms_revisions"),
    path(
        "admin/revisions/<uuid:pk>/",
        RevisionDetailView.as_view(),
        name="cms_revision_detail",
    ),
    path(
        "admin/revisions/<uuid:pk>/restore/",
        RevisionRestoreView.as_view(),
        name="cms_revision_restore",
    ),
    path("admin/media/", MediaUploadView.as_view(), name="cms_media_upload"),
]
