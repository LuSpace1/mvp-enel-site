"""Logica de recoleccion y agregacion de KPIs del portal."""

from __future__ import annotations

import csv
import io
import re
from datetime import date, timedelta

from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Avg, Count, Max, OuterRef, Q, Subquery, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

from .models import Evento, Opinion, OrigenVisitante, Sesion, Visitante

NOMBRE_EVENTO = re.compile(r"^[a-z0-9_.-]{1,64}$")
SECCION_CIERRE = "cierre"
UMBRAL_COMPLETITUD = 0.6
EVENTOS_NO_INTERACCION = {"pagina.vista", "seccion.ver", "seccion.tiempo", "sesion.fin"}


# ---------------------------------------------------------------------------
# Recoleccion
# ---------------------------------------------------------------------------


def normalizar_correo(correo: str) -> str:
    return correo.strip().lower()


def dominios_permitidos() -> tuple[str, ...]:
    """Dominios aceptados para entrar al portal, si se configuran."""
    return tuple(getattr(settings, "PORTAL_CORREO_DOMINIOS", ()) or ())


def correo_valido(correo: str) -> bool:
    dominios = dominios_permitidos()
    if not dominios:
        return True
    correo = normalizar_correo(correo)
    return any(correo.endswith(f"@{dominio}") for dominio in dominios)


def obtener_visitante(anonymous_id: str, visitante_id=None) -> Visitante:
    """
    Resuelve el visitante de un lote.

    `visitante_id` es la identidad estable que devuelve `identificar`: evita que
    un navegador identificado desde dos equipos vuelva a crear filas nuevas
    cuando su `anonymous_id` original fue fusionado.
    """
    if visitante_id:
        existente = Visitante.objects.filter(id=visitante_id).first()
        if existente:
            return existente
    visitante, _ = Visitante.objects.get_or_create(
        anonymous_id=anonymous_id,
        defaults={"origen": OrigenVisitante.PILOTO},
    )
    return visitante


def _visitante_de_identificacion(anonymous_id: str, visitante_id=None) -> Visitante:
    """
    Resuelve la fila que se va a identificar.

    Manda el navegador actual (`anonymous_id`). `visitante_id` solo se usa si
    esa fila ya fue fusionada en otra persona, para no recrear visitantes
    huerfanos en cada lote.
    """
    existente = Visitante.objects.filter(anonymous_id=anonymous_id).first()
    if existente:
        return existente
    if visitante_id:
        resuelto = Visitante.objects.filter(id=visitante_id).first()
        if resuelto:
            return resuelto
    return obtener_visitante(anonymous_id)


@transaction.atomic
def identificar(anonymous_id: str, correo: str, visitante_id=None) -> Visitante:
    """
    Vincula un navegador con una persona.

    Si el correo ya existe en otro visitante, se conserva el mas antiguo y se
    mueven sus visitas y eventos: asi entrar desde el notebook y el celular no
    duplica personas cuando la persona se identifica en ambos.
    """
    visitante = _visitante_de_identificacion(anonymous_id, visitante_id)
    correo = normalizar_correo(correo)
    if visitante.email != correo:
        visitante.email = correo
        visitante.email_verificado = False
    visitante.last_seen_at = timezone.now()

    canonico = (
        Visitante.objects.filter(email=correo)
        .exclude(pk=visitante.pk)
        .order_by("first_seen_at")
        .first()
    )
    if canonico:
        Sesion.objects.filter(visitante=visitante).update(visitante=canonico)
        Evento.objects.filter(visitante=visitante).update(visitante=canonico)
        Opinion.objects.filter(visitante=visitante).update(visitante=canonico)
        visitante.delete()
        canonico.last_seen_at = timezone.now()
        canonico.save(update_fields=["last_seen_at"])
        visitante = canonico

    visitante.save(update_fields=["email", "email_verificado", "last_seen_at"])
    return visitante


@transaction.atomic
def vincular_usuario(user) -> Visitante:
    """
    Vincula la cuenta autenticada con su visitante de analitica.

    Si la persona ya habia entrado con el formulario anterior, se conserva esa
    fila y sus visitas; si tenia varias, se fusionan en la mas antigua.
    """
    correo = normalizar_correo(getattr(user, "email", "") or "")
    candidatos = (
        list(Visitante.objects.filter(email=correo).order_by("first_seen_at"))
        if correo
        else []
    )
    principal = Visitante.objects.filter(user=user).first()
    if principal is None:
        principal = candidatos[0] if candidatos else None
    if principal is None:
        principal = Visitante(anonymous_id=f"user:{user.pk}")
    principal.user = user
    principal.email = correo or principal.email
    principal.origen = OrigenVisitante.PILOTO
    principal.save()

    for otro in candidatos:
        if otro.pk == principal.pk:
            continue
        Sesion.objects.filter(visitante=otro).update(visitante=principal)
        Evento.objects.filter(visitante=otro).update(visitante=principal)
        Opinion.objects.filter(visitante=otro).update(visitante=principal)
        otro.delete()

    return principal


@transaction.atomic
def registrar_lote(anonymous_id: str, datos: dict) -> Sesion:
    """
    Guarda o actualiza una visita con su lote de eventos.

    El frontend envia el resumen de la visita en cada lote, de modo que un
    cierre de pestaña no pierda la duracion ni la profundidad alcanzada.
    """
    visitante = obtener_visitante(anonymous_id, datos.get("visitante_id"))
    entrada = datos["sesion"]
    ahora = timezone.now()

    sesion, creada = Sesion.objects.get_or_create(
        id=entrada["id"],
        defaults={
            "visitante": visitante,
            "iniciada_en": entrada.get("iniciada_en") or ahora,
            "ultima_actividad": ahora,
            "entrada": entrada.get("entrada", ""),
            "dispositivo": entrada.get("dispositivo", "ESCRITORIO"),
            "referrer": entrada.get("referrer", ""),
            "campana": entrada.get("campana", ""),
        },
    )
    if not creada and sesion.visitante_id != visitante.id:
        raise PermissionDenied("La visita no pertenece a este visitante.")

    profundidad = float(entrada.get("profundidad") or 0)
    secciones = int(entrada.get("secciones_vistas") or 0)
    duracion = int(entrada.get("duracion_activa") or 0)
    completo = bool(entrada.get("completo")) and profundidad >= UMBRAL_COMPLETITUD

    sesion.ultima_actividad = ahora
    sesion.duracion_activa = max(sesion.duracion_activa, duracion)
    sesion.profundidad = max(sesion.profundidad, min(profundidad, 1))
    sesion.secciones_vistas = max(sesion.secciones_vistas, secciones)
    sesion.completo = sesion.completo or completo
    sesion.save(
        update_fields=[
            "ultima_actividad",
            "duracion_activa",
            "profundidad",
            "secciones_vistas",
            "completo",
        ]
    )

    eventos = [
        evento
        for evento in datos.get("eventos") or []
        if NOMBRE_EVENTO.match(evento.get("nombre", ""))
    ]
    if eventos:
        Evento.objects.bulk_create(
            [
                Evento(
                    sesion=sesion,
                    visitante=sesion.visitante,
                    nombre=evento["nombre"],
                    seccion=evento.get("seccion", ""),
                    recurso=evento.get("recurso", ""),
                    valor=evento.get("valor"),
                    datos=evento.get("datos") or {},
                    ocurrido_en=evento.get("ocurrido_en") or ahora,
                )
                for evento in eventos
            ],
            batch_size=200,
        )

    if datos.get("opinion"):
        registrar_opinion(sesion, datos["opinion"])

    visitante.last_seen_at = ahora
    visitante.save(update_fields=["last_seen_at"])
    return sesion


def registrar_opinion(sesion: Sesion, opinion: dict) -> Opinion:
    registro, _ = Opinion.objects.update_or_create(
        sesion=sesion,
        defaults={
            "visitante": sesion.visitante,
            "puntaje": opinion["puntaje"],
            "comentario": opinion.get("comentario", "")[:2000],
            "seccion": opinion.get("seccion") or SECCION_CIERRE,
        },
    )
    return registro


# ---------------------------------------------------------------------------
# Agregacion
# ---------------------------------------------------------------------------


def rango_por_defecto(desde: date | None, hasta: date | None) -> tuple[date, date]:
    hoy = timezone.localdate()
    hasta = hasta or hoy
    desde = desde or (hasta - timedelta(days=29))
    if desde > hasta:
        desde, hasta = hasta, desde
    return desde, hasta


def _visitas(desde: date, hasta: date):
    return Sesion.objects.filter(iniciada_en__date__range=(desde, hasta))


def _eventos(desde: date, hasta: date):
    return Evento.objects.filter(ocurrido_en__date__range=(desde, hasta))


def _mediana(valores) -> float | None:
    limpios = sorted(valor for valor in valores if valor is not None)
    if not limpios:
        return None
    total = len(limpios)
    mitad = total // 2
    if total % 2:
        return round(float(limpios[mitad]), 1)
    return round((limpios[mitad - 1] + limpios[mitad]) / 2, 1)


def _promedio(valor: float | None) -> float | None:
    return round(float(valor), 1) if valor is not None else None


def _proporcion(parte: int, total: int) -> float:
    return round(parte / total, 4) if total else 0


def _secciones(visitas, eventos) -> list[dict]:
    vistas = {
        fila["seccion"]: fila
        for fila in eventos.filter(nombre="seccion.ver")
        .values("seccion")
        .annotate(total=Count("id"), personas=Count("visitante", distinct=True))
    }
    tiempos = {
        fila["seccion"]: fila["promedio"]
        for fila in eventos.filter(nombre="seccion.tiempo")
        .values("seccion")
        .annotate(promedio=Avg("valor"))
    }
    interacciones = {
        fila["seccion"]: fila
        for fila in eventos.exclude(nombre__in=EVENTOS_NO_INTERACCION)
        .values("seccion")
        .annotate(total=Count("id"), personas=Count("visitante", distinct=True))
    }

    claves = set(vistas) | set(interacciones)
    resultado = []
    for clave in claves:
        if not clave:
            continue
        mostradas = int(vistas.get(clave, {}).get("total", 0))
        total_interacciones = int(interacciones.get(clave, {}).get("total", 0))
        resultado.append(
            {
                "clave": clave,
                "vistas": mostradas,
                "personas": int(vistas.get(clave, {}).get("personas", 0)),
                "interacciones": total_interacciones,
                "personas_interactuaron": int(
                    interacciones.get(clave, {}).get("personas", 0)
                ),
                "tasa_interaccion": _proporcion(total_interacciones, mostradas),
                "tiempo_medio": _promedio(tiempos.get(clave)),
            }
        )
    resultado.sort(key=lambda fila: fila["vistas"], reverse=True)
    return resultado


def _recursos(eventos) -> list[dict]:
    criticos = eventos.filter(
        Q(nombre__startswith="iso.")
        | Q(nombre__startswith="organigrama.")
        | Q(nombre__startswith="meoffice.")
        | Q(nombre="cierre.recurso")
    )
    filas = (
        criticos.values("nombre", "recurso")
        .annotate(aperturas=Count("id"), personas=Count("visitante", distinct=True))
        .order_by("-aperturas")[:30]
    )
    return [
        {
            "nombre": fila["nombre"],
            "recurso": fila["recurso"],
            "aperturas": fila["aperturas"],
            "personas": fila["personas"],
        }
        for fila in filas
    ]


def _satisfaccion(desde: date, hasta: date) -> dict:
    opiniones = Opinion.objects.filter(creada_en__date__range=(desde, hasta))
    distribucion = {puntaje: 0 for puntaje in range(1, 6)}
    for fila in opiniones.values("puntaje").annotate(total=Count("id")):
        distribucion[fila["puntaje"]] = fila["total"]
    ultimas = [
        {
            "puntaje": opinion.puntaje,
            "comentario": opinion.comentario,
            "seccion": opinion.seccion,
            "creada_en": opinion.creada_en.isoformat(),
        }
        for opinion in opiniones.order_by("-creada_en")[:25]
    ]
    return {
        "distribucion": [
            {"puntaje": puntaje, "cantidad": cantidad}
            for puntaje, cantidad in distribucion.items()
        ],
        "ultimas": ultimas,
        "promedio": _promedio(opiniones.aggregate(valor=Avg("puntaje"))["valor"]),
        "total": opiniones.count(),
    }


def _serie(visitas, desde: date, hasta: date) -> list[dict]:
    filas = {
        fila["fecha"]: fila
        for fila in visitas.annotate(fecha=TruncDate("iniciada_en"))
        .values("fecha")
        .annotate(
            visitas=Count("id"),
            completas=Count("id", filter=Q(completo=True)),
        )
    }
    # La linea debe mostrar los dias sin datos como cero, no saltarlos.
    serie = []
    dia = desde
    while dia <= hasta:
        fila = filas.get(dia)
        serie.append(
            {
                "fecha": dia.isoformat(),
                "visitas": fila["visitas"] if fila else 0,
                "completas": fila["completas"] if fila else 0,
            }
        )
        dia += timedelta(days=1)
    return serie


def tablero(desde: date | None = None, hasta: date | None = None) -> dict:
    desde, hasta = rango_por_defecto(desde, hasta)
    visitas = _visitas(desde, hasta)
    eventos = _eventos(desde, hasta)

    total_visitas = visitas.count()
    personas = visitas.values("visitante_id").distinct().count()
    completas = visitas.filter(completo=True)
    personas_completaron = completas.values("visitante_id").distinct().count()

    satisfaccion = _satisfaccion(desde, hasta)

    # Tiempo hasta llegar a Cierre, no la duracion total de la visita: una
    # persona puede quedarse leyendo los recursos despues de completar.
    llegadas = list(
        eventos.filter(nombre="sesion.completa").values_list("valor", flat=True)
    )
    tiempo_completitud = (
        _mediana(llegadas)
        if llegadas
        else _mediana(completas.values_list("duracion_activa", flat=True))
    )

    return {
        "rango": {"desde": desde.isoformat(), "hasta": hasta.isoformat()},
        "resumen": {
            "visitas": total_visitas,
            "personas": personas,
            "page_views": eventos.filter(nombre="pagina.vista").count(),
            "personas_completaron": personas_completaron,
            "tasa_completitud": _proporcion(personas_completaron, personas),
            "profundidad_media": round(
                float(visitas.aggregate(valor=Avg("profundidad"))["valor"] or 0), 4
            ),
            "secciones_promedio": round(
                float(visitas.aggregate(valor=Avg("secciones_vistas"))["valor"] or 0), 1
            ),
            "tiempo_completitud": tiempo_completitud,
            "permanencia_mediana": _mediana(
                visitas.values_list("duracion_activa", flat=True)
            ),
            "likert_promedio": satisfaccion["promedio"],
            "tasa_respuesta": _proporcion(satisfaccion["total"], total_visitas),
        },
        "secciones": _secciones(visitas, eventos),
        "recorrido": {
            "histograma": [
                {"secciones": fila["secciones_vistas"], "visitas": fila["total"]}
                for fila in visitas.values("secciones_vistas")
                .annotate(total=Count("id"))
                .order_by("secciones_vistas")
            ],
        },
        "recursos": _recursos(eventos),
        "satisfaccion": satisfaccion,
        "serie": _serie(visitas, desde, hasta),
    }


def _consulta_personas(desde: date, hasta: date):
    rango = Sesion.objects.filter(iniciada_en__date__range=(desde, hasta))
    ids = rango.values("visitante_id")
    ultima_opinion = Opinion.objects.filter(visitante=OuterRef("pk")).order_by(
        "-creada_en"
    )
    return Visitante.objects.filter(id__in=ids).annotate(
        visitas=Count("sesiones", filter=Q(sesiones__in=rango), distinct=True),
        tiempo_activo=Sum("sesiones__duracion_activa", filter=Q(sesiones__in=rango)),
        profundidad_maxima=Max("sesiones__profundidad", filter=Q(sesiones__in=rango)),
        completas=Count(
            "sesiones",
            filter=Q(sesiones__in=rango, sesiones__completo=True),
            distinct=True,
        ),
        likert=Subquery(ultima_opinion.values("puntaje")[:1]),
    )


def _persona_a_fila(visitante: Visitante) -> dict:
    return {
        "id": str(visitante.id),
        "email": visitante.email,
        "email_verificado": visitante.email_verificado,
        "origen": visitante.origen,
        "primera_vez": visitante.first_seen_at.isoformat(),
        "ultima_vez": visitante.last_seen_at.isoformat(),
        "visitas": visitante.visitas,
        "tiempo_activo": visitante.tiempo_activo or 0,
        "profundidad_maxima": round(visitante.profundidad_maxima or 0, 4),
        "completo": bool(visitante.completas),
        "likert": visitante.likert,
    }


def personas(
    desde: date | None = None,
    hasta: date | None = None,
    pagina: int = 1,
    tamano: int = 25,
) -> dict:
    desde, hasta = rango_por_defecto(desde, hasta)
    consulta = _consulta_personas(desde, hasta).order_by("-last_seen_at")

    total = consulta.count()
    tamano = max(1, min(tamano, 100))
    inicio = max(0, (max(pagina, 1) - 1) * tamano)
    filas = consulta[inicio : inicio + tamano]

    return {
        "total": total,
        "pagina": pagina,
        "tamano": tamano,
        "resultados": [_persona_a_fila(visitante) for visitante in filas],
    }


def exportar_csv(desde: date | None = None, hasta: date | None = None) -> str:
    """Exporta todas las personas del rango, sin paginar."""
    desde, hasta = rango_por_defecto(desde, hasta)
    filas = _consulta_personas(desde, hasta).order_by("-last_seen_at")
    salida = io.StringIO()
    escritor = csv.writer(salida)
    escritor.writerow(
        ["correo", "visitas", "tiempo_activo_s", "profundidad", "completo", "likert"]
    )
    for visitante in filas.iterator(chunk_size=500):
        fila = _persona_a_fila(visitante)
        escritor.writerow(
            [
                fila["email"],
                fila["visitas"],
                fila["tiempo_activo"],
                f"{fila['profundidad_maxima']:.2f}",
                "si" if fila["completo"] else "no",
                fila["likert"] or "",
            ]
        )
    return salida.getvalue()
