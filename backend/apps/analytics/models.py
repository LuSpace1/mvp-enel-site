import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class OrigenVisitante(models.TextChoices):
    """De donde salio la identidad del visitante."""

    PILOTO = "PILOTO", "Identificacion piloto"
    SCIM = "SCIM", "CompAC (SCIM)"
    SSO = "SSO", "SSO corporativo"


class Dispositivo(models.TextChoices):
    ESCRITORIO = "ESCRITORIO", "Escritorio"
    MOVIL = "MOVIL", "Movil"
    TABLET = "TABLET", "Tablet"


class Visitante(models.Model):
    """
    Persona o dispositivo que recorre el portal.

    `anonymous_id` es el identificador del navegador que emite el frontend. El
    correo solo se completa cuando la persona se identifica en la fase piloto.
    `user` queda nulo hasta que CompAC/SCIM aprovisione la identidad real; en
    ese momento se vincula sin migrar ningun evento.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    anonymous_id = models.CharField(
        max_length=64, unique=True, db_index=True, verbose_name="Identificador anonimo"
    )
    email = models.EmailField(
        blank=True, default="", db_index=True, verbose_name="Correo"
    )
    origen = models.CharField(
        max_length=20,
        choices=OrigenVisitante.choices,
        default=OrigenVisitante.PILOTO,
        db_index=True,
        verbose_name="Origen",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="analytics_visitantes",
        verbose_name="Usuario del producto",
    )
    first_seen_at = models.DateTimeField(auto_now_add=True, verbose_name="Primera vez")
    last_seen_at = models.DateTimeField(auto_now=True, verbose_name="Ultima vez")

    class Meta:
        verbose_name = "Visitante"
        verbose_name_plural = "Visitantes"
        ordering = ["-last_seen_at"]

    def __str__(self):
        return self.email or self.anonymous_id


class Sesion(models.Model):
    """
    Visita: bloque de actividad que se cierra a los 30 minutos sin interaccion.

    El frontend conserva el identificador mientras la persona sigue activa y lo
    rota al superar la ventana. El servidor guarda el resumen para que el
    tablero no dependa de recalcular todo el recorrido.
    """

    id = models.UUIDField(
        primary_key=True, editable=False, verbose_name="Identificador"
    )
    visitante = models.ForeignKey(
        Visitante,
        on_delete=models.CASCADE,
        related_name="sesiones",
        verbose_name="Visitante",
    )
    iniciada_en = models.DateTimeField(db_index=True, verbose_name="Iniciada en")
    ultima_actividad = models.DateTimeField(
        db_index=True, verbose_name="Ultima actividad"
    )
    entrada = models.CharField(
        max_length=64, blank=True, default="", verbose_name="Seccion de entrada"
    )
    dispositivo = models.CharField(
        max_length=20,
        choices=Dispositivo.choices,
        default=Dispositivo.ESCRITORIO,
        verbose_name="Dispositivo",
    )
    referrer = models.CharField(
        max_length=255, blank=True, default="", verbose_name="Referencia"
    )
    campana = models.CharField(
        max_length=120, blank=True, default="", verbose_name="Campaña"
    )
    duracion_activa = models.PositiveIntegerField(
        default=0, verbose_name="Duracion activa (s)"
    )
    profundidad = models.FloatField(default=0, verbose_name="Profundidad (0-1)")
    secciones_vistas = models.PositiveSmallIntegerField(
        default=0, verbose_name="Secciones distintas vistas"
    )
    completo = models.BooleanField(default=False, verbose_name="Recorrido completo")
    finalizada_en = models.DateTimeField(
        null=True, blank=True, verbose_name="Finalizada en"
    )

    class Meta:
        verbose_name = "Visita"
        verbose_name_plural = "Visitas"
        ordering = ["-iniciada_en"]
        indexes = [
            models.Index(
                fields=["iniciada_en", "completo"], name="analytics_sesion_rango_idx"
            ),
        ]

    def __str__(self):
        return f"{self.visitante} - {self.iniciada_en:%Y-%m-%d %H:%M}"


class Evento(models.Model):
    """Evento crudo emitido por el frontend."""

    id = models.BigAutoField(primary_key=True)
    sesion = models.ForeignKey(
        Sesion, on_delete=models.CASCADE, related_name="eventos", verbose_name="Visita"
    )
    visitante = models.ForeignKey(
        Visitante,
        on_delete=models.CASCADE,
        related_name="eventos",
        verbose_name="Visitante",
    )
    nombre = models.CharField(max_length=64, db_index=True, verbose_name="Evento")
    seccion = models.CharField(
        max_length=64, blank=True, default="", db_index=True, verbose_name="Seccion"
    )
    recurso = models.CharField(
        max_length=160, blank=True, default="", verbose_name="Recurso"
    )
    valor = models.FloatField(null=True, blank=True, verbose_name="Valor")
    datos = models.JSONField(default=dict, blank=True, verbose_name="Datos")
    ocurrido_en = models.DateTimeField(db_index=True, verbose_name="Ocurrido en")
    creado_en = models.DateTimeField(auto_now_add=True, verbose_name="Recibido en")

    class Meta:
        verbose_name = "Evento"
        verbose_name_plural = "Eventos"
        ordering = ["-ocurrido_en"]
        indexes = [
            models.Index(
                fields=["nombre", "ocurrido_en"], name="analytics_evento_nombre_idx"
            ),
            models.Index(
                fields=["seccion", "ocurrido_en"], name="analytics_evento_seccion_idx"
            ),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.seccion or 'sin seccion'})"


class Opinion(models.Model):
    """Likert y reseña enviados al llegar a la seccion de recursos."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    visitante = models.ForeignKey(
        Visitante,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="opiniones",
        verbose_name="Visitante",
    )
    sesion = models.OneToOneField(
        Sesion, on_delete=models.CASCADE, related_name="opinion", verbose_name="Visita"
    )
    puntaje = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)], verbose_name="Puntaje"
    )
    comentario = models.TextField(blank=True, default="", verbose_name="Comentario")
    seccion = models.CharField(
        max_length=64, default="cierre", verbose_name="Seccion de origen"
    )
    creada_en = models.DateTimeField(
        auto_now_add=True, db_index=True, verbose_name="Creada en"
    )

    class Meta:
        verbose_name = "Opinion"
        verbose_name_plural = "Opiniones"
        ordering = ["-creada_en"]

    def __str__(self):
        return f"{self.puntaje}/5"
