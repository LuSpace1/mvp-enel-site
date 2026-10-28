"""Service Layer del CMS: borradores, publicacion atomica y revisiones."""

from __future__ import annotations

import copy
from typing import Any

from django.db import IntegrityError, transaction
from django.utils import timezone

from content.models import VideoLink

from .models import ContentRevision, MediaAsset, RevisionStatus
from .registry import build_default_payload
from .validation import default_payload, normalize_payload


class RevisionConflict(Exception):
    """Otra persona guardo el borrador antes que esta (bloqueo optimista)."""


def _published_qs():
    return ContentRevision.objects.filter(status=RevisionStatus.PUBLISHED)


def _draft_qs():
    return ContentRevision.objects.filter(status=RevisionStatus.DRAFT)


def _create_default_published() -> ContentRevision:
    payload = default_payload()
    payload["version"] = 1
    return ContentRevision.objects.create(
        status=RevisionStatus.PUBLISHED,
        payload=payload,
        version=1,
        message="Contenido inicial",
        published_at=timezone.now(),
    )


def ensure_published() -> ContentRevision:
    """Garantiza la publicacion inicial sin crear un borrador."""
    published = _published_qs().first()
    if published is not None:
        return published

    with transaction.atomic():
        try:
            # El savepoint permite recuperarse de una creacion concurrente sin
            # dejar marcada para rollback la transaccion exterior.
            with transaction.atomic():
                published = _create_default_published()
        except IntegrityError:
            # Otra peticion creo la publicacion en paralelo.
            published = _published_qs().get()
        else:
            # Inyecta el video del hero actual en la base al inicializar el CMS.
            _sync_hero_video(published.payload)
        return published


def get_published() -> ContentRevision:
    """Lectura publica: no bloquea la fila cuando ya existe una publicacion."""
    published = _published_qs().first()
    if published is not None:
        return published
    return ensure_published()


def get_draft() -> ContentRevision | None:
    """Devuelve el borrador activo, si existe. No lo crea."""
    return _draft_qs().order_by("-created_at").first()


def ensure_draft(user=None) -> ContentRevision:
    """Crea el borrador solo cuando se activa el modo edicion."""
    with transaction.atomic():
        published = ensure_published()
        draft = _draft_qs().select_for_update().first()
        if draft is not None:
            return draft

        payload = copy.deepcopy(published.payload)
        payload["version"] = 1
        try:
            # El savepoint evita que la violacion de unicidad invalide la
            # transaccion que luego consulta el borrador creado por la otra
            # peticion.
            with transaction.atomic():
                draft = ContentRevision.objects.create(
                    status=RevisionStatus.DRAFT,
                    payload=payload,
                    version=1,
                    based_on=published,
                    created_by=user,
                    updated_by=user,
                )
        except IntegrityError:
            # Otra persona activo el modo edicion al mismo tiempo.
            draft = _draft_qs().select_for_update().get()
        return draft


def save_draft(
    user,
    payload: dict[str, Any],
    expected_version: int,
    message: str = "",
) -> ContentRevision:
    normalized = normalize_payload(payload)

    with transaction.atomic():
        draft = _draft_qs().select_for_update().first()
        if draft is None:
            raise RevisionConflict(
                "No hay un borrador activo. Activa el modo edición para continuar."
            )

        if expected_version != draft.version:
            raise RevisionConflict(
                "El borrador cambio desde que lo abriste. Recarga para no pisar cambios."
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


def publish(
    user,
    *,
    expected_version: int,
    message: str = "",
) -> tuple[ContentRevision, ContentRevision]:
    """Publica el borrador de forma atomica y deja un borrador nuevo."""
    with transaction.atomic():
        draft = _draft_qs().select_for_update().first()
        if draft is None:
            raise RevisionConflict(
                "No hay un borrador activo. Activa el modo edición para publicar."
            )
        if expected_version != draft.version:
            raise RevisionConflict(
                "El borrador cambio desde que lo revisaste. Actualiza la vista previa "
                "y vuelve a publicar."
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
        published = ensure_published()
        draft = _draft_qs().select_for_update().first()
        if draft is None:
            draft = ContentRevision.objects.create(
                status=RevisionStatus.DRAFT,
                payload=copy.deepcopy(published.payload),
                version=1,
                based_on=published,
                created_by=user,
                updated_by=user,
            )
        normalized = normalize_payload(revision.payload)

        draft.version += 1
        normalized["version"] = draft.version
        draft.payload = normalized
        draft.updated_by = user
        draft.message = f"Restaurada revision del {revision.created_at:%d-%m-%Y %H:%M}"
        draft.save(
            update_fields=["payload", "version", "updated_by", "message", "updated_at"]
        )
        return draft


def discard_draft(user) -> ContentRevision:
    """Devuelve el borrador al contenido de la ultima publicacion."""
    with transaction.atomic():
        # Mismo orden de locks que publish(): borrador y despues publicacion,
        # para que descartar y publicar no puedan bloquearse mutuamente.
        draft = _draft_qs().select_for_update().first()
        published = ensure_published()
        published = _published_qs().select_for_update().filter(pk=published.pk).first()
        if published is None or draft is None:
            raise RevisionConflict("No hay un borrador activo para descartar.")

        normalized = normalize_payload(published.payload)

        draft.version += 1
        normalized["version"] = draft.version
        draft.payload = normalized
        draft.updated_by = user
        draft.message = (
            f"Borrador descartado; se restauro la publicacion del "
            f"{published.published_at:%d-%m-%Y %H:%M}"
            if published.published_at
            else "Borrador descartado; se restauro la ultima publicacion"
        )
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
