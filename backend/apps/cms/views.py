from __future__ import annotations

import hashlib
import io
import json
import os

from django.conf import settings
from django.http import FileResponse
from django.utils.http import content_disposition_header
from PIL import Image, ImageOps, UnidentifiedImageError
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ContentRevision, MediaAsset
from .permissions import CanManageCms
from .registry import schema
from .serializers import (
    DraftSaveSerializer,
    MediaAssetSerializer,
    MediaUploadSerializer,
    PublishSerializer,
    RevisionDetailSerializer,
    RevisionSerializer,
)
from .services import (
    RevisionConflict,
    create_media,
    discard_draft,
    ensure_draft,
    get_draft,
    get_published,
    list_revisions,
    publish,
    restore_revision,
    save_draft,
)

Image.MAX_IMAGE_PIXELS = 50_000_000

MIME_BY_FORMAT = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp",
}
EXTENSION_BY_FORMAT = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}


def _etag(payload) -> str:
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def _has_unpublished_changes(draft: ContentRevision, published: ContentRevision) -> bool:
    """Compara solo contenido y orden; la version del borrador cambia en cada guardado."""
    return (
        draft.payload.get("order") != published.payload.get("order")
        or draft.payload.get("sections") != published.payload.get("sections")
    )


def _not_modified(request, etag: str) -> bool:
    header = request.headers.get("If-None-Match", "")
    return etag in {
        part.strip().strip('"') for part in header.split(",") if part.strip()
    }


class PublicContentView(APIView):
    """Contenido publicado. Es la unica fuente publica para pagina, header e indice."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        published = get_published()
        payload = published.payload
        etag = _etag({"id": str(published.pk), "payload": payload})
        if _not_modified(request, etag):
            response = Response(status=status.HTTP_304_NOT_MODIFIED)
            response["ETag"] = f'"{etag}"'
            response["Cache-Control"] = "no-cache"
            return response

        response = Response(
            {
                "payload": payload,
                "revision_id": str(published.pk),
                "revision_version": published.version,
                "published_at": published.published_at,
                "updated_at": published.updated_at,
            }
        )
        response["ETag"] = f'"{etag}"'
        response["Cache-Control"] = "no-cache"
        return response


class CmsSchemaView(APIView):
    permission_classes = [CanManageCms]

    def get(self, request):
        return Response(schema())


class StartEditingView(APIView):
    """Crea (o reutiliza) el borrador cuando la persona activa el modo edicion."""

    permission_classes = [CanManageCms]

    def post(self, request):
        published = get_published()
        draft = ensure_draft(request.user)
        return Response(
            {
                "draft": RevisionDetailSerializer(draft).data,
                "has_unpublished_changes": _has_unpublished_changes(draft, published),
            },
            status=status.HTTP_201_CREATED,
        )


class AdminContentView(APIView):
    permission_classes = [CanManageCms]

    def get(self, request):
        draft = get_draft()
        published = get_published()
        return Response(
            {
                "draft": RevisionDetailSerializer(draft).data if draft else None,
                "published": RevisionSerializer(published).data,
                "has_unpublished_changes": (
                    _has_unpublished_changes(draft, published) if draft else False
                ),
                "user": {
                    "id": str(request.user.pk),
                    "username": request.user.username,
                    "name": request.user.get_full_name() or request.user.username,
                },
            }
        )

    def put(self, request):
        serializer = DraftSaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            draft = save_draft(
                request.user,
                data["payload"],
                expected_version=data.get("version"),
                message=data.get("message", ""),
            )
        except RevisionConflict as exc:
            current = get_draft()
            return Response(
                {
                    "detail": str(exc),
                    "code": "revision_conflict",
                    "current_version": current.version if current else None,
                },
                status=status.HTTP_409_CONFLICT,
            )
        published = get_published()
        return Response(
            {
                "draft": RevisionDetailSerializer(draft).data,
                "has_unpublished_changes": _has_unpublished_changes(draft, published),
            }
        )


class PublishView(APIView):
    permission_classes = [CanManageCms]

    def post(self, request):
        serializer = PublishSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            published, draft = publish(
                request.user, serializer.validated_data.get("message", "")
            )
        except RevisionConflict as exc:
            return Response(
                {"detail": str(exc), "code": "editing_not_active"},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(
            {
                "published": RevisionSerializer(published).data,
                "draft": RevisionDetailSerializer(draft).data,
            },
            status=status.HTTP_201_CREATED,
        )


class RevisionListView(APIView):
    permission_classes = [CanManageCms]

    def get(self, request):
        revisions = list_revisions()[:200]
        return Response({"results": RevisionSerializer(revisions, many=True).data})


class RevisionDetailView(APIView):
    permission_classes = [CanManageCms]

    def get(self, request, pk):
        revision = (
            ContentRevision.objects.select_related(
                "created_by", "updated_by", "published_by"
            )
            .filter(pk=pk)
            .first()
        )
        if revision is None:
            return Response(
                {"detail": "Revision no encontrada."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(RevisionDetailSerializer(revision).data)


class RevisionRestoreView(APIView):
    permission_classes = [CanManageCms]

    def post(self, request, pk):
        revision = ContentRevision.objects.filter(pk=pk).first()
        if revision is None:
            return Response(
                {"detail": "Revision no encontrada."}, status=status.HTTP_404_NOT_FOUND
            )
        try:
            draft = restore_revision(request.user, revision)
        except RevisionConflict as exc:
            return Response(
                {"detail": str(exc), "code": "revision_conflict"},
                status=status.HTTP_409_CONFLICT,
            )
        return Response({"draft": RevisionDetailSerializer(draft).data})


class DiscardDraftView(APIView):
    """Devuelve el borrador a la ultima publicacion, descartando cambios."""

    permission_classes = [CanManageCms]

    def post(self, request):
        try:
            draft = discard_draft(request.user)
        except RevisionConflict as exc:
            return Response(
                {"detail": str(exc), "code": "revision_conflict"},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(
            {"draft": RevisionDetailSerializer(draft).data, "has_unpublished_changes": False}
        )


def _process_image(upload) -> tuple[bytes, str, int, int]:
    max_bytes = getattr(settings, "CMS_IMAGE_MAX_BYTES", 5 * 1024 * 1024)
    max_dimension = getattr(settings, "CMS_IMAGE_MAX_DIMENSION", 2560)
    allowed = set(
        getattr(
            settings,
            "CMS_IMAGE_ALLOWED_TYPES",
            ("image/jpeg", "image/png", "image/webp"),
        )
    )

    raw = upload.read()
    if not raw:
        raise ValidationError({"file": ["El archivo esta vacio."]})
    if len(raw) > max_bytes:
        raise ValidationError(
            {
                "file": [
                    f"La imagen supera el maximo de {max_bytes // (1024 * 1024)} MB."
                ]
            }
        )

    try:
        with Image.open(io.BytesIO(raw)) as probe:
            probe.verify()
        image = Image.open(io.BytesIO(raw))
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise ValidationError({"file": ["El archivo no es una imagen valida."]})

    image_format = (image.format or "").upper()
    if image_format not in MIME_BY_FORMAT:
        raise ValidationError({"file": ["Solo se permiten imagenes JPEG, PNG o WebP."]})
    mime_type = MIME_BY_FORMAT[image_format]
    if mime_type not in allowed:
        raise ValidationError({"file": ["Tipo de imagen no permitido."]})

    image = ImageOps.exif_transpose(image)
    if max(image.size) > max_dimension:
        image.thumbnail((max_dimension, max_dimension), Image.LANCZOS)

    if image_format == "JPEG":
        image = image.convert("RGB")

    output = io.BytesIO()
    if image_format == "JPEG":
        image.save(
            output, format=image_format, quality=88, optimize=True, progressive=True
        )
    elif image_format == "PNG":
        image.save(output, format=image_format, optimize=True)
    else:
        image.save(output, format=image_format, quality=88, method=6)

    processed = output.getvalue()
    if len(processed) > max_bytes:
        raise ValidationError(
            {
                "file": [
                    f"La imagen optimizada supera el maximo de {max_bytes // (1024 * 1024)} MB."
                ]
            }
        )
    return processed, mime_type, image.width, image.height


class MediaUploadView(APIView):
    permission_classes = [CanManageCms]

    def post(self, request):
        serializer = MediaUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        upload = serializer.validated_data["file"]
        processed, mime_type, width, height = _process_image(upload)
        asset = create_media(
            file_bytes=processed,
            mime_type=mime_type,
            width=width,
            height=height,
            checksum=hashlib.sha256(processed).hexdigest(),
            original_name=os.path.basename(upload.name or "imagen"),
            alt=serializer.validated_data.get("alt", ""),
            user=request.user,
        )
        return Response(
            MediaAssetSerializer(asset).data, status=status.HTTP_201_CREATED
        )


class MediaDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, pk):
        asset = MediaAsset.objects.filter(pk=pk).first()
        if asset is None:
            return Response(
                {"detail": "Imagen no encontrada."}, status=status.HTTP_404_NOT_FOUND
            )
        if _not_modified(request, asset.checksum):
            response = Response(status=status.HTTP_304_NOT_MODIFIED)
            response["ETag"] = f'"{asset.checksum}"'
            response["Cache-Control"] = "public, max-age=31536000, immutable"
            return response

        payload = bytes(asset.file)
        response = FileResponse(io.BytesIO(payload), content_type=asset.mime_type)
        image_format = next(
            (fmt for fmt, mime in MIME_BY_FORMAT.items() if mime == asset.mime_type),
            "",
        )
        extension = EXTENSION_BY_FORMAT.get(image_format, "img")
        filename = os.path.basename(
            asset.original_name or f"imagen-{asset.pk}.{extension}"
        )
        response["Content-Disposition"] = content_disposition_header(False, filename)
        response["Cache-Control"] = "public, max-age=31536000, immutable"
        response["ETag"] = f'"{asset.checksum}"'
        return response
