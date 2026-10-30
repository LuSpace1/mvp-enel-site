"""Service Layer del CMS: borradores, publicacion atomica y versiones."""

from __future__ import annotations

import copy
from typing import Any

from django.db import IntegrityError, transaction
from django.utils import timezone

from .models import (
    ContentRevision,
    ContentVersionSequence,
    MediaAsset,
    RevisionStatus,
)
from .registry import build_default_payload
from .validation import default_payload, normalize_payload


class RevisionConflict(Exception):
    """Otra persona guardo el borrador antes que esta (bloqueo optimista)."""


def _published_qs():
    return ContentRevision.objects.filter(status=RevisionStatus.PUBLISHED)


def _current_qs():
    return _published_qs().filter(is_current=True)


def _draft_qs():
    return ContentRevision.objects.filter(status=RevisionStatus.DRAFT)


def _ensure_sequence() -> ContentVersionSequence:
    """Devuelve la fila de secuencia bloqueada para asignar el siguiente numero."""
    sequence = ContentVersionSequence.objects.select_for_update().filter(pk=1).first()
    if sequence is not None:
        return sequence

    try:
        # El savepoint permite recuperarse de una creacion concurrente.
        with transaction.atomic():
            ContentVersionSequence.objects.create(pk=1, next_number=1)
    except IntegrityError:
        pass
    return ContentVersionSequence.objects.select_for_update().get(pk=1)


def _next_version_number() -> int:
    """Reserva el siguiente numero de version. Debe llamarse dentro de atomic()."""
    sequence = _ensure_sequence()
    number = sequence.next_number
    sequence.next_number = number + 1
    sequence.save(update_fields=["next_number"])
    return number


def _create_default_published(number: int) -> ContentRevision:
    return ContentRevision.objects.create(
        status=RevisionStatus.PUBLISHED,
        payload=default_payload(),
        lock_version=1,
        version_number=number,
        is_current=True,
        message="Contenido inicial",
        published_at=timezone.now(),
    )


def ensure_published() -> ContentRevision:
    """Garantiza una version vigente sin crear un borrador."""
    published = _current_qs().first()
    if published is not None:
        return published

    with transaction.atomic():
        # Bloquea la secuencia antes de comprobar de nuevo: si otra peticion
        # publico mientras esperabamos, reutilizamos su version.
        _ensure_sequence()
        published = _current_qs().first()
        if published is not None:
            return published

        published = _create_default_published(_next_version_number())
        return published


def get_published() -> ContentRevision:
    """Lectura publica: no bloquea la fila cuando ya existe una publicacion."""
    published = _current_qs().first()
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
        try:
            # El savepoint evita que la violacion de unicidad invalide la
            # transaccion que luego consulta el borrador creado por la otra
            # peticion.
            with transaction.atomic():
                draft = ContentRevision.objects.create(
                    status=RevisionStatus.DRAFT,
                    payload=payload,
                    lock_version=1,
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
    expected_lock_version: int,
    message: str = "",
) -> ContentRevision:
    normalized = normalize_payload(payload)

    with transaction.atomic():
        draft = _draft_qs().select_for_update().first()
        if draft is None:
            raise RevisionConflict(
                "No hay un borrador activo. Activa el modo edición para continuar."
            )

        if expected_lock_version != draft.lock_version:
            raise RevisionConflict(
                "El borrador cambio desde que lo abriste. Recarga para no pisar cambios."
            )

        draft.lock_version += 1
        draft.payload = normalized
        draft.updated_by = user
        if message:
            draft.message = message[:255]
        draft.save(
            update_fields=[
                "payload",
                "lock_version",
                "updated_by",
                "message",
                "updated_at",
            ]
        )
        return draft


def publish(
    user,
    *,
    expected_lock_version: int,
    message: str = "",
) -> ContentRevision:
    """Publica el borrador como una version nueva e inmutable.

    El borrador se elimina al publicar: la siguiente sesion de edicion crea uno
    nuevo clonando la version vigente. Asi el historial solo contiene versiones
    publicadas y el borrador nunca consume un numero de version.
    """
    with transaction.atomic():
        draft = _draft_qs().select_for_update().first()
        if draft is None:
            raise RevisionConflict(
                "No hay un borrador activo. Activa el modo edición para publicar."
            )
        if expected_lock_version != draft.lock_version:
            raise RevisionConflict(
                "El borrador cambio desde que lo revisaste. Actualiza la vista previa "
                "y vuelve a publicar."
            )

        normalized = normalize_payload(draft.payload)
        number = _next_version_number()

        _published_qs().filter(is_current=True).update(is_current=False)
        published = ContentRevision.objects.create(
            status=RevisionStatus.PUBLISHED,
            payload=normalized,
            lock_version=1,
            version_number=number,
            is_current=True,
            based_on=draft.based_on,
            created_by=draft.created_by,
            updated_by=user,
            published_by=user,
            published_at=timezone.now(),
            message=(message or draft.message)[:255],
        )

        draft.delete()
        return published


def restore_revision(user, revision: ContentRevision) -> ContentRevision:
    """Copia una version publicada al borrador para revisarla y publicarla de nuevo."""
    with transaction.atomic():
        # Mismo orden de locks que publish() y discard_draft(): primero el
        # borrador y despues la publicacion, para evitar deadlocks.
        draft = _draft_qs().select_for_update().first()
        revision = (
            _published_qs().select_for_update().filter(pk=revision.pk).first()
        )
        if revision is None:
            raise RevisionConflict(
                "Solo se puede restaurar una version publicada."
            )
        if revision.is_current:
            raise RevisionConflict(
                "La version vigente ya esta publicada. Edita el borrador para cambiarla."
            )

        normalized = normalize_payload(revision.payload)
        fecha = revision.published_at or revision.created_at
        mensaje = (
            f"Restaurada version v{revision.version_number} "
            f"del {fecha:%d-%m-%Y %H:%M}"
        )

        if draft is None:
            draft = ContentRevision.objects.create(
                status=RevisionStatus.DRAFT,
                payload=normalized,
                lock_version=1,
                based_on=revision,
                created_by=user,
                updated_by=user,
                message=mensaje,
            )
        else:
            draft.lock_version += 1
            draft.payload = normalized
            draft.based_on = revision
            draft.updated_by = user
            draft.message = mensaje
            draft.save(
                update_fields=[
                    "payload",
                    "lock_version",
                    "based_on",
                    "updated_by",
                    "message",
                    "updated_at",
                ]
            )
        return draft


def discard_draft(user) -> ContentRevision:
    """Devuelve el borrador al contenido de la version vigente."""
    with transaction.atomic():
        # Mismo orden de locks que publish(): borrador y despues publicacion,
        # para que descartar y publicar no puedan bloquearse mutuamente.
        draft = _draft_qs().select_for_update().first()
        published = _current_qs().select_for_update().first()
        if published is None or draft is None:
            raise RevisionConflict("No hay un borrador activo para descartar.")

        normalized = normalize_payload(published.payload)

        draft.lock_version += 1
        draft.payload = normalized
        draft.updated_by = user
        draft.message = (
            f"Borrador descartado; se restauro la version v{published.version_number} "
            f"del {published.published_at:%d-%m-%Y %H:%M}"
            if published.published_at
            else "Borrador descartado; se restauro la ultima publicacion"
        )
        draft.save(
            update_fields=[
                "payload",
                "lock_version",
                "updated_by",
                "message",
                "updated_at",
            ]
        )
        return draft


def list_versions():
    return (
        _published_qs()
        .select_related("created_by", "updated_by", "published_by")
        .order_by("-version_number")
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
