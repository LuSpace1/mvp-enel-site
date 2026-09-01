from django.db import models
from django.utils.text import slugify


class VideoLink(models.Model):
    title = models.CharField(max_length=255, verbose_name="Título del Video")
    youtube_url = models.URLField(verbose_name="Enlace de YouTube")
    section_identifier = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Identificador de Sección",
        help_text="Nombre que identifica el video en la página (Ej: 'hero_main').",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Enlace de Video"
        verbose_name_plural = "Enlaces de Video"
        ordering = ["id"]

    def __str__(self):
        return f"{self.title} ({self.section_identifier})"

    def save(self, *args, **kwargs):
        if not self.section_identifier:
            self.section_identifier = slugify(self.title)
        super().save(*args, **kwargs)
