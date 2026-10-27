"""Service Layer del CMS: borradores, publicacion atomica y revisiones."""

from __future__ import annotations

import copy
from typing import Any

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from content.models import VideoLink

from .models import ContentRevision, MediaAsset, RevisionStatus
from .permissions import can_publish_cms
from .registry import build_default_payload
from .validation import default_payload, normalize_payload


class RevisionConflict(Exception):
    """Otra persona guardo el borrador antes que esta (bloqueo optimista)."""


def _published_qs():
    return ContentRevision.objects.filter(status=RevisionStatus.PUBLISHED)


def _draft_qs():
    return ContentRevision.objects.filter(status=RevisionStatus.DRAFT)


def ensure_initial_content() -> tuple[ContentRevision, ContentRevision]:
    """
    Garantiza que exista una publicacion y un borrador operables.

    En una base recien migrada crea ambos desde el contenido actual del portal.
    """
    with transaction.atomic():
        published = _published_qs().select_for_update().first()
        draft = _draft_qs().select_for_update().first()
        creado = False

        if published is None:
            payload = default_payload()
            payload["version"] = 1
            published = ContentRevision.objects.create(
                status=RevisionStatus.PUBLISHED,
                payload=payload,
                version=1,
                message="Contenido inicial",
                published_at=timezone.now(),
            )
            creado = True
        if draft is None:
            draft = ContentRevision.objects.create(
                status=RevisionStatus.DRAFT,
                payload=copy.deepcopy(published.payload),
                version=1,
                based_on=published,
            )
        if creado:
            # Inyecta el video del hero actual en la base al inicializar el CMS,
            # sin comandos auxiliares ni migraciones de datos.
            _sync_hero_video(published.payload)
        return published, draft


def get_published() -> ContentRevision:
    published, _ = ensure_initial_content()
    return published


def get_draft() -> ContentRevision:
    _, draft = ensure_initial_content()
    return draft


def _order_of(payload: dict[str, Any] | None) -> list[str]:
    if not isinstance(payload, dict):
        return []
    order = payload.get("order")
    return order if isinstance(order, list) else []


def save_draft(
    user,
    payload: dict[str, Any],
    expected_version: int | None = None,
    message: str = "",
) -> ContentRevision:
    normalized = normalize_payload(payload)

    with transaction.atomic():
        _, draft = ensure_initial_content()
        draft = _draft_qs().select_for_update().filter(pk=draft.pk).first()
        if draft is None:
            raise RevisionConflict(
                "El borrador cambió mientras guardabas. Recarga para continuar."
            )

        if expected_version is not None and expected_version != draft.version:
            raise RevisionConflict(
                "El borrador cambio desde que lo abriste. Recarga para no pisar cambios."
            )

        if normalized["order"] != _order_of(draft.payload) and not can_publish_cms(
            user
        ):
            raise PermissionDenied(
                "Solo el rol de publicacion puede cambiar el orden de las secciones."
            )

        draft.version += 1
        normalized["version"] = draft.version
        draft.payload = normalized
        draft.updated_by = user
        if message:
            draft.message = message[:255]
        draft.save(
            update_fields=["payload", "version", "updated_by", "message", "updated_at"]
        )
        return draft


def publish(user, message: str = "") -> tuple[ContentRevision, ContentRevision]:
    """Publica el borrador de forma atomica y deja un borrador nuevo."""
    with transaction.atomic():
        _, draft = ensure_initial_content()
        draft = _draft_qs().select_for_update().filter(pk=draft.pk).first()
        if draft is None:
            raise RevisionConflict(
                "Otra persona publicó antes. Recarga para continuar."
            )
        normalized = normalize_payload(draft.payload)
        normalized["version"] = draft.version

        for anterior in _published_qs().select_for_update():
            anterior.status = RevisionStatus.ARCHIVED
            anterior.save(update_fields=["status", "updated_at"])

        draft.status = RevisionStatus.PUBLISHED
        draft.payload = normalized
        draft.published_by = user
        draft.published_at = timezone.now()
        draft.updated_by = user
        if message:
            draft.message = message[:255]
        draft.save(
            update_fields=[
                "status",
                "payload",
                "published_by",
                "published_at",
                "updated_by",
                "message",
                "updated_at",
            ]
        )

        new_payload = copy.deepcopy(normalized)
        new_payload["version"] = 1
        new_draft = ContentRevision.objects.create(
            status=RevisionStatus.DRAFT,
            payload=new_payload,
            version=1,
            based_on=draft,
            created_by=user,
        )

        _sync_hero_video(draft.payload)
        return draft, new_draft


def restore_revision(user, revision: ContentRevision) -> ContentRevision:
    """Copia una revision al borrador para revisarla y publicarla de nuevo."""
    with transaction.atomic():
        _, draft = ensure_initial_content()
        draft = _draft_qs().select_for_update().filter(pk=draft.pk).first()
        if draft is None:
            raise RevisionConflict(
                "El borrador cambió al restaurar. Recarga para continuar."
            )
        normalized = normalize_payload(revision.payload)

        if normalized["order"] != _order_of(draft.payload) and not can_publish_cms(
            user
        ):
            raise PermissionDenied(
                "Solo el rol de publicacion puede restaurar un orden anterior."
            )

        draft.version += 1
        normalized["version"] = draft.version
        draft.payload = normalized
        draft.updated_by = user
        draft.message = f"Restaurada revision del {revision.created_at:%d-%m-%Y %H:%M}"
        draft.save(
            update_fields=["payload", "version", "updated_by", "message", "updated_at"]
        )
        return draft


def list_revisions():
    return ContentRevision.objects.select_related(
        "created_by", "updated_by", "published_by"
    ).all()


def _sync_hero_video(payload: dict[str, Any]) -> None:
    """Mantiene /api/videos/ coherente con el video del hero editado en el CMS."""
    portada = (payload.get("sections") or {}).get("portada") or {}
    url = (portada.get("video_youtube_url") or "").strip()
    if not url:
        return
    title = (portada.get("video_titulo") or "Mensaje del Gerente General").strip()
    VideoLink.objects.update_or_create(
        section_identifier="hero_main",
        defaults={"title": title[:255], "youtube_url": url},
    )


def create_media(
    *,
    file_bytes: bytes,
    mime_type: str,
    width: int,
    height: int,
    checksum: str,
    original_name: str,
    alt: str,
    user,
) -> MediaAsset:
    return MediaAsset.objects.create(
        file=file_bytes,
        mime_type=mime_type,
        size=len(file_bytes),
        width=width,
        height=height,
        checksum=checksum,
        original_name=original_name[:255],
        alt=alt[:255],
        created_by=user if getattr(user, "is_authenticated", False) else None,
    )


def build_payload() -> dict[str, Any]:
    return normalize_payload(build_default_payload())
