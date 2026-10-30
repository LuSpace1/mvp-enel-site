import uuid

from django.conf import settings
from django.db import models


class RevisionStatus(models.TextChoices):
    DRAFT = "DRAFT", "Borrador"
    PUBLISHED = "PUBLISHED", "Publicada"


class ContentRevision(models.Model):
    """
    Revision atomica del contenido del portal.

    Solo puede existir un borrador. Cada publicacion es una fila inmutable con
    un `version_number` secuencial y `is_current` marca la vigente. El payload
    contiene el contenido de todas las secciones y el orden global, de modo que
    publicar una version nunca deja el header y la pagina con ordenes distintos.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    status = models.CharField(
        max_length=20,
        choices=RevisionStatus.choices,
        default=RevisionStatus.DRAFT,
        db_index=True,
        verbose_name="Estado",
    )
    payload = models.JSONField(default=dict, verbose_name="Contenido")
    lock_version = models.PositiveIntegerField(
        default=1,
        verbose_name="Version de bloqueo",
        help_text="Contador optimista del borrador; no es una version publicada.",
    )
    version_number = models.PositiveIntegerField(
        null=True,
        blank=True,
        unique=True,
        verbose_name="Numero de version",
        help_text="Solo las publicaciones tienen numero de version.",
    )
    is_current = models.BooleanField(default=False, verbose_name="Vigente")
    message = models.CharField(max_length=255, blank=True, verbose_name="Mensaje")
    based_on = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="derived_revisions",
        verbose_name="Basada en",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cms_revisions_created",
        verbose_name="Creada por",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cms_revisions_updated",
        verbose_name="Actualizada por",
    )
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cms_revisions_published",
        verbose_name="Publicada por",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creada")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Actualizada")
    published_at = models.DateTimeField(null=True, blank=True, verbose_name="Publicada")

    class Meta:
        verbose_name = "Revision de contenido"
        verbose_name_plural = "Revisiones de contenido"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["status"],
                condition=models.Q(status=RevisionStatus.DRAFT),
                name="cms_unique_draft_revision",
            ),
            models.UniqueConstraint(
                fields=["is_current"],
                condition=models.Q(is_current=True),
                name="cms_unique_current_version",
            ),
        ]
        indexes = [
            models.Index(
                fields=["status", "-created_at"], name="cms_revision_status_idx"
            ),
            models.Index(
                fields=["status", "-version_number"],
                name="cms_revision_version_idx",
            ),
        ]

    def __str__(self):
        if self.version_number is not None:
            return f"{self.get_status_display()} v{self.version_number} ({self.id})"
        return f"{self.get_status_display()} ({self.id})"


class ContentVersionSequence(models.Model):
    """Contador global y atomico para asignar el numero de cada publicacion."""

    id = models.PositiveSmallIntegerField(
        primary_key=True, default=1, editable=False
    )
    next_number = models.PositiveIntegerField(
        default=1, verbose_name="Proximo numero de version"
    )

    class Meta:
        verbose_name = "Secuencia de versiones"
        verbose_name_plural = "Secuencia de versiones"

    def __str__(self):
        return f"Proximo numero de version: {self.next_number}"


class MediaAsset(models.Model):
    """Imagen almacenada como binario en la base de datos (alcance del MVP)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.BinaryField(verbose_name="Archivo")
    mime_type = models.CharField(max_length=100, verbose_name="Tipo de contenido")
    size = models.PositiveIntegerField(verbose_name="Tamano en bytes")
    width = models.PositiveIntegerField(null=True, blank=True, verbose_name="Ancho")
    height = models.PositiveIntegerField(null=True, blank=True, verbose_name="Alto")
    checksum = models.CharField(
        max_length=64, db_index=True, verbose_name="Checksum SHA-256"
    )
    original_name = models.CharField(
        max_length=255, blank=True, verbose_name="Nombre original"
    )
    alt = models.CharField(max_length=255, blank=True, verbose_name="Texto alternativo")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cms_media_created",
        verbose_name="Subida por",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Subida")

    class Meta:
        verbose_name = "Imagen del CMS"
        verbose_name_plural = "Imagenes del CMS"
        ordering = ["-created_at"]

    def __str__(self):
        return self.original_name or str(self.id)
