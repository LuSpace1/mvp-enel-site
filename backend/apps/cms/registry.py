"""
Registro de secciones y campos editables del portal.

La estructura visual vive en el frontend; este registro solo declara que
contenido puede cambiar el CMS. Cada seccion tiene una clave estable y campos
tipados. Los valores por defecto reproducen el contenido publicado actual.
"""

from dataclasses import dataclass, field
from typing import Any


def rich_doc(*paragraphs: str) -> dict[str, Any]:
    """Documento de texto enriquecido compatible con el editor (JSON, no HTML)."""
    content: list[dict[str, Any]] = []
    for paragraph in paragraphs:
        content.append(
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": paragraph}],
            }
        )
    return {"type": "doc", "content": content}


@dataclass(frozen=True)
class FieldDef:
    key: str
    label: str
    type: str  # text | textarea | rich | url | youtube | image | number | select | list
    default: Any = ""
    required: bool = False
    max_length: int | None = None
    help_text: str = ""
    options: tuple[tuple[str, str], ...] = ()
    item_fields: tuple["FieldDef", ...] = ()
    max_items: int = 40

    def to_dict(self) -> dict[str, Any]:
        data: dict[str, Any] = {
            "key": self.key,
            "label": self.label,
            "type": self.type,
            "default": self.default,
            "required": self.required,
            "help_text": self.help_text,
        }
        if self.max_length is not None:
            data["max_length"] = self.max_length
        if self.options:
            data["options"] = [
                {"value": value, "label": label} for value, label in self.options
            ]
        if self.item_fields:
            data["item_fields"] = [item.to_dict() for item in self.item_fields]
            data["max_items"] = self.max_items
        return data


@dataclass(frozen=True)
class SectionDef:
    key: str
    label: str
    nav_label: str
    description: str = ""
    reorderable: bool = True
    fixed_position: int | None = None  # 0 = primero, -1 = último
    fields: tuple[FieldDef, ...] = field(default_factory=tuple)

    def schema_dict(self) -> dict[str, Any]:
        nav_field = FieldDef(
            key="nav_label",
            label="Etiqueta de navegación",
            type="text",
            default=self.nav_label,
            required=True,
            max_length=40,
            help_text="Texto que aparece en el header y en el índice lateral.",
        )
        return {
            "key": self.key,
            "label": self.label,
            "description": self.description,
            "reorderable": self.reorderable,
            "fixed_position": self.fixed_position,
            "fields": [nav_field.to_dict(), *[item.to_dict() for item in self.fields]],
        }

    def default_values(self) -> dict[str, Any]:
        values: dict[str, Any] = {"nav_label": self.nav_label}
        for item in self.fields:
            values[item.key] = item.default
        return values


# ---------------------------------------------------------------------------
# Definiciones de campos
# ---------------------------------------------------------------------------

HERO_VIDEO_URL = "https://www.youtube.com/watch?v=5aEIFxjHEf0"

PORTADA = SectionDef(
    key="portada",
    label="Inicio",
    nav_label="Inicio",
    description="Portada, mensaje principal y video del Gerente General.",
    reorderable=False,
    fixed_position=0,
    fields=(
        FieldDef(
            key="titulo_destacado",
            label="Título destacado",
            type="text",
            default="Enel Distribución",
            required=True,
            max_length=120,
            help_text="Se muestra junto a la palabra fija 'Conoce'.",
        ),
        FieldDef(
            key="descripcion",
            label="Descripción",
            type="textarea",
            default=(
                "Descubre quiénes somos, cómo funciona nuestro negocio y qué nos mueve cada día. "
                "Un espacio para conocer nuestra operación, los principios que nos guían y nuestro "
                "rol en la distribución de energía eléctrica en Chile."
            ),
            required=True,
            max_length=1200,
        ),
        FieldDef(
            key="cta_texto",
            label="Texto del botón",
            type="text",
            default="Explorar el sitio",
            required=True,
            max_length=60,
        ),
        FieldDef(
            key="video_youtube_url",
            label="Video de YouTube",
            type="youtube",
            default=HERO_VIDEO_URL,
            help_text="Enlace del video principal. Se acepta youtube.com o youtu.be.",
        ),
        FieldDef(
            key="video_titulo",
            label="Título del video",
            type="text",
            default="Mensaje del Gerente General Paolo Leidi",
            max_length=160,
        ),
    ),
)

HISTORIA = SectionDef(
    key="historia",
    label="Historia",
    nav_label="Historia",
    description="Presentación del Grupo Enel y cifras de Enel Distribución.",
    fields=(
        FieldDef(
            key="kicker",
            label="Antetítulo",
            type="text",
            default="Memoria Anual 2025",
            max_length=80,
        ),
        FieldDef(
            key="titulo",
            label="Título",
            type="text",
            default="Grupo Enel",
            required=True,
            max_length=120,
        ),
        FieldDef(
            key="cuerpo",
            label="Texto principal",
            type="rich",
            default=rich_doc(
                "Enel es una compañía multinacional de energía y uno de los principales operadores "
                "integrados del sector energético a nivel mundial.",
                "Con presencia en 27 países de los cinco continentes, cuenta con una capacidad "
                "instalada de 91,8 GW y más de 69 millones de consumidores finales.",
                "En Chile, el Grupo está presente a través de Enel Green Power, Enel Generación, "
                "Enel X, Enel Distribución y Enel Colina, impulsando el desarrollo y la transición "
                "energética del país.",
            ),
        ),
        FieldDef(
            key="cta_texto",
            label="Texto del botón",
            type="text",
            default="Conoce más sobre Grupo Enel",
            max_length=80,
        ),
        FieldDef(
            key="cta_url",
            label="Enlace del botón",
            type="url",
            default="https://www.enel.cl/es/conoce-enel/grupo-enel.html",
        ),
        FieldDef(
            key="imagen",
            label="Imagen principal",
            type="image",
            default="",
            help_text="Si queda vacía se usa la imagen actual del sitio.",
        ),
        FieldDef(
            key="imagen_alt",
            label="Texto alternativo de la imagen",
            type="text",
            default="Oficinas de Enel",
            max_length=200,
        ),
        FieldDef(
            key="cifras_titulo",
            label="Título del bloque de cifras",
            type="text",
            default="Enel Distribución Chile en cifras",
            max_length=120,
        ),
        FieldDef(
            key="cifras_intro",
            label="Introducción de las cifras",
            type="textarea",
            default=(
                "Una empresa que impulsa la generación de valor y lidera el camino hacia la "
                "electrificación en Chile."
            ),
            max_length=400,
        ),
        FieldDef(
            key="cifras_nota",
            label="Nota al pie de las cifras",
            type="text",
            default="Cifras al cierre de 2025",
            max_length=120,
        ),
        FieldDef(
            key="cifras",
            label="Cifras",
            type="list",
            default=[
                {
                    "valor": "14,5",
                    "unidad": "TWh",
                    "descripcion": "Energía distribuida al año",
                },
                {
                    "valor": "18.248",
                    "unidad": "km",
                    "descripcion": "Red de distribución eléctrica",
                },
                {
                    "valor": "33",
                    "unidad": "comunas",
                    "descripcion": "Nuestra zona de concesión",
                },
                {
                    "valor": "+2",
                    "unidad": "M",
                    "descripcion": "Clientes en la Región Metropolitana",
                },
            ],
            max_items=8,
            item_fields=(
                FieldDef("valor", "Valor", "text", required=True, max_length=24),
                FieldDef("unidad", "Unidad", "text", max_length=24),
                FieldDef(
                    "descripcion", "Descripción", "text", required=True, max_length=120
                ),
            ),
        ),
    ),
)

CULTURA = SectionDef(
    key="cultura",
    label="Cultura",
    nav_label="Cultura",
    description="Valores organizacionales y sus descripciones.",
    fields=(
        FieldDef(
            key="titulo",
            label="Título",
            type="text",
            default="Nuestros valores",
            required=True,
            max_length=120,
        ),
        FieldDef(
            key="intro",
            label="Introducción",
            type="textarea",
            default=(
                "Los principios que guían nuestra forma de actuar, tomar decisiones y enfrentar los "
                "desafíos del negocio, orientando nuestro compromiso con las personas, los clientes "
                "y el futuro de la energía."
            ),
            required=True,
            max_length=800,
        ),
        FieldDef(
            key="valores",
            label="Valores",
            type="list",
            default=[
                {
                    "icono": "confianza",
                    "palabra": "CONFIANZA",
                    "descripcion": (
                        "Actuamos con responsabilidad, integridad, legalidad y autonomía, construyendo "
                        "relaciones de confianza con nuestros interlocutores y clientes. Fomentamos la "
                        "colaboración, desarrollando capacidades y relaciones sólidas que nos permiten "
                        "enfrentar desafíos y gestionar la complejidad de la mejor manera posible."
                    ),
                },
                {
                    "icono": "innovacion",
                    "palabra": "INNOVACIÓN",
                    "descripcion": (
                        "Trabajamos con curiosidad para abrir la energía a nuevos usos, tecnologías y "
                        "personas, aprendiendo los unos de los otros e identificando nuevos puntos de "
                        "referencia. Transformamos ideas en valor para nosotros y para nuestros "
                        "interlocutores."
                    ),
                },
                {
                    "icono": "respeto",
                    "palabra": "RESPETO",
                    "descripcion": (
                        "Reconocemos y valoramos las diferencias, ideas, opiniones, capacidades y méritos "
                        "de las personas. Actuamos con responsabilidad, respetando las normas que protegen "
                        "la seguridad, la salud, el medio ambiente y los derechos humanos, para asegurar "
                        "la calidad en todo lo que hacemos."
                    ),
                },
                {
                    "icono": "proactividad",
                    "palabra": "PROACTIVIDAD",
                    "descripcion": (
                        "Actuamos con espíritu emprendedor, tomando la iniciativa para alcanzar resultados "
                        "concretos y sostenibles. Nos comprometemos con el futuro de nuestra compañía y la "
                        "transición energética, poniendo las necesidades de nuestros clientes en el centro "
                        "de nuestras decisiones."
                    ),
                },
                {
                    "icono": "flexibilidad",
                    "palabra": "FLEXIBILIDAD",
                    "descripcion": (
                        "Acogemos el cambio como una oportunidad, anticipándonos a nuevos desafíos y "
                        "escenarios. Nos adaptamos con agilidad, solidez y sencillez, redefiniendo "
                        "prioridades, aprendiendo de nuestros errores e impulsando la mejora continua."
                    ),
                },
            ],
            max_items=8,
            item_fields=(
                FieldDef(
                    "icono",
                    "Icono",
                    "select",
                    default="confianza",
                    options=(
                        ("confianza", "Confianza"),
                        ("innovacion", "Innovación"),
                        ("respeto", "Respeto"),
                        ("proactividad", "Proactividad"),
                        ("flexibilidad", "Flexibilidad"),
                    ),
                ),
                FieldDef("palabra", "Palabra", "text", required=True, max_length=40),
                FieldDef(
                    "descripcion",
                    "Descripción",
                    "textarea",
                    required=True,
                    max_length=600,
                ),
            ),
        ),
    ),
)

ORGANIGRAMA = SectionDef(
    key="organigrama",
    label="Equipos",
    nav_label="Equipos",
    description="Título e introducción de la estructura organizacional.",
    fields=(
        FieldDef(
            key="titulo",
            label="Título",
            type="text",
            default="Estructura organizacional",
            required=True,
            max_length=120,
        ),
        FieldDef(
            key="intro",
            label="Introducción",
            type="textarea",
            default=(
                "Descubre cómo se estructura Enel Distribución, sus principales gerencias, líderes y "
                "áreas de apoyo transversal que contribuyen al funcionamiento del negocio."
            ),
            required=True,
            max_length=800,
        ),
    ),
)

CONCESION = SectionDef(
    key="concesion-detalle",
    label="Concesión",
    nav_label="Concesión",
    description="Título e introducción del mapa de concesión.",
    fields=(
        FieldDef(
            key="kicker",
            label="Antetítulo",
            type="text",
            default="Concesión en detalle",
            max_length=80,
        ),
        FieldDef(
            key="titulo",
            label="Título",
            type="text",
            default="Nuestro territorio,",
            required=True,
            max_length=120,
        ),
        FieldDef(
            key="titulo_destacado",
            label="Título destacado",
            type="text",
            default="trazo a trazo",
            max_length=80,
        ),
        FieldDef(
            key="intro",
            label="Introducción",
            type="textarea",
            default=(
                "Organizamos nuestra red en 4 zonas de concesión -Chacabuco, Cordillera, Pacífico y "
                "Florida- que cubren gran parte de la Región Metropolitana. Toca una zona para "
                "explorar sus comunas y activa el Modo Rayos X para ver las cifras clave y las "
                "subestaciones de un vistazo."
            ),
            required=True,
            max_length=1000,
        ),
    ),
)

CADENA = SectionDef(
    key="cadena",
    label="Cadena",
    nav_label="Cadena",
    description="Título e introducción de la cadena de valor.",
    fields=(
        FieldDef(
            key="titulo",
            label="Título",
            type="text",
            default="Cadena de",
            required=True,
            max_length=120,
        ),
        FieldDef(
            key="titulo_destacado",
            label="Título destacado",
            type="text",
            default="Valor",
            max_length=80,
        ),
        FieldDef(
            key="intro",
            label="Introducción",
            type="textarea",
            default=(
                "Conoce cómo se conectan nuestros procesos y áreas clave, desde la planificación hasta "
                "la atención de nuestros clientes, para entregar un servicio eléctrico continuo, seguro "
                "y de calidad."
            ),
            required=True,
            max_length=1000,
        ),
    ),
)

POLITICAS = SectionDef(
    key="politicas",
    label="SIG",
    nav_label="SIG",
    description="Marco ISO, políticas y acceso al Portal SIG.",
    fields=(
        FieldDef(
            key="titulo",
            label="Título",
            type="text",
            default="Nuestro marco de actuacion",
            required=True,
            max_length=120,
        ),
        FieldDef(
            key="intro",
            label="Introducción",
            type="textarea",
            default=(
                "8 normas ISO que guían nuestra forma de trabajar día a día. En Enel Distribución Chile "
                "y Enel Colina, contamos con un Sistema Integrado de Gestión (SIG) que nos permite "
                "fortalecer nuestros procesos, impulsar la mejora continua y trabajar de manera más "
                "segura, eficiente y responsable."
            ),
            required=True,
            max_length=1200,
        ),
        FieldDef(
            key="politicas",
            label="Políticas ISO",
            type="list",
            default=[
                {
                    "clave": "calidad",
                    "nombre": "Calidad",
                    "codigo": "ISO 9001",
                    "resumen": (
                        "Trabajamos para entregar un suministro eléctrico continuo y eficiente, "
                        "respondiendo a las necesidades de nuestros clientes."
                    ),
                    "url": "https://enelcom.sharepoint.com/sites/PortalSIG2/Calidad/SitePages/Home.aspx",
                },
                {
                    "clave": "ambiental",
                    "nombre": "Ambiental",
                    "codigo": "ISO 14001",
                    "resumen": (
                        "Promovemos el cuidado del medio ambiente y la biodiversidad, reduciendo "
                        "nuestros impactos e impulsando prácticas sostenibles y de economía circular."
                    ),
                    "url": "https://enelcom.sharepoint.com/sites/PortalSIG2/ambiental/SitePages/Home.aspx",
                },
                {
                    "clave": "salud",
                    "nombre": "Salud y Seguridad",
                    "codigo": "ISO 45001",
                    "resumen": (
                        "Identificamos y prevenimos riesgos para cuidar la salud y seguridad de quienes "
                        "forman parte de nuestra operación, promoviendo entornos de trabajo seguros."
                    ),
                    "url": "https://enelcom.sharepoint.com/sites/PortalSIG2/sst/",
                },
                {
                    "clave": "energia",
                    "nombre": "Energía",
                    "codigo": "ISO 50001",
                    "resumen": (
                        "Impulsamos el uso eficiente de la energía, optimizando recursos y desarrollando "
                        "soluciones que mejoren nuestro desempeño energético."
                    ),
                    "url": "https://enelcom.sharepoint.com/sites/PortalSIG2/energia/",
                },
                {
                    "clave": "continuidad",
                    "nombre": "Continuidad del Negocio",
                    "codigo": "ISO 22301",
                    "resumen": (
                        "Nos preparamos para enfrentar situaciones críticas, gestionando los riesgos para "
                        "asegurar la continuidad de nuestras operaciones."
                    ),
                    "url": "https://enelcom.sharepoint.com/sites/PortalSIG2/continuidad/",
                },
                {
                    "clave": "antisoborno",
                    "nombre": "Antisoborno",
                    "codigo": "ISO 37001",
                    "resumen": (
                        "Actuamos con integridad y transparencia, promoviendo una cultura de tolerancia "
                        "cero frente a la corrupción."
                    ),
                    "url": "https://enelcom.sharepoint.com/sites/PortalSIG2/antisborno/",
                },
                {
                    "clave": "activos",
                    "nombre": "Gestión de Activos",
                    "codigo": "ISO 55001",
                    "resumen": (
                        "Gestionamos nuestros activos durante todo su ciclo de vida para fortalecer su "
                        "seguridad, eficiencia y desempeño."
                    ),
                    "url": "https://enelcom.sharepoint.com/sites/PortalSIG2/gestiondeactivos/",
                },
                {
                    "clave": "seguridad-info",
                    "nombre": "Seguridad de la Información",
                    "codigo": "ISO 27001",
                    "resumen": (
                        "Protegemos la información y los datos personales, resguardando su "
                        "confidencialidad, integridad y disponibilidad mediante una gestión responsable "
                        "de riesgos."
                    ),
                    "url": "https://enelcom.sharepoint.com/sites/PortalSIG2/SitePages/Text.aspx",
                },
            ],
            max_items=12,
            item_fields=(
                FieldDef(
                    "clave",
                    "Icono y color",
                    "select",
                    default="calidad",
                    options=(
                        ("calidad", "Calidad"),
                        ("ambiental", "Ambiental"),
                        ("salud", "Salud y Seguridad"),
                        ("energia", "Energía"),
                        ("continuidad", "Continuidad"),
                        ("antisoborno", "Antisoborno"),
                        ("activos", "Gestión de Activos"),
                        ("seguridad-info", "Seguridad de la Información"),
                    ),
                ),
                FieldDef("nombre", "Nombre", "text", required=True, max_length=120),
                FieldDef("codigo", "Código", "text", required=True, max_length=40),
                FieldDef(
                    "resumen", "Resumen", "textarea", required=True, max_length=600
                ),
                FieldDef("url", "Enlace", "url", required=True),
            ),
        ),
        FieldDef(
            key="portal_titulo",
            label="Título del Portal SIG",
            type="text",
            default="Conoce nuestro Portal SIG",
            max_length=120,
        ),
        FieldDef(
            key="portal_descripcion",
            label="Descripción del Portal SIG",
            type="textarea",
            default=(
                "Accede a la política completa, documentos asociados, normas ISO, procedimientos y "
                "toda la información del Sistema Integrado de Gestión."
            ),
            max_length=600,
        ),
        FieldDef(
            key="portal_url",
            label="Enlace al Portal SIG",
            type="url",
            default="https://enelcom.sharepoint.com/sites/PortalSIG2/SitePages/Home.aspx",
        ),
        FieldDef(
            key="portal_cta",
            label="Texto del botón del Portal SIG",
            type="text",
            default="Ir al Portal SIG",
            max_length=60,
        ),
    ),
)

GALERIAS = SectionDef(
    key="galerias",
    label="ME",
    nav_label="ME",
    description="Herramientas del ecosistema ME.",
    fields=(
        FieldDef(
            key="titulo",
            label="Título",
            type="text",
            default="Herramientas ME",
            required=True,
            max_length=120,
        ),
        FieldDef(
            key="intro",
            label="Introducción",
            type="textarea",
            default=(
                "Explora las herramientas y plataformas que facilitan tu día a día, accede a "
                "información, servicios y oportunidades para tu desarrollo."
            ),
            required=True,
            max_length=800,
        ),
        FieldDef(
            key="herramientas",
            label="Herramientas",
            type="list",
            default=[
                {
                    "clave": "portal-me",
                    "nombre": "Portal ME",
                    "nota": "",
                    "descripcion": (
                        "Accede a tu información personal y laboral, beneficios, servicios y "
                        "herramientas para gestionar tu día a día en Enel."
                    ),
                    "url": "https://enel.service-now.com/me",
                },
                {
                    "clave": "tell-me",
                    "nombre": "People ME",
                    "nota": "Disponible en Tell ME",
                    "descripcion": (
                        "Tu asistente virtual de P&O para resolver consultas y acceder a información "
                        "sobre procesos, beneficios y servicios internos."
                    ),
                    "url": "https://enelcom.sharepoint.com/sites/globalintranet/SitePages/es/TellMe.aspx",
                },
                {
                    "clave": "me-learning",
                    "nombre": "ME Learning",
                    "nota": "",
                    "descripcion": (
                        "Revisa cursos y rutas de aprendizaje para desarrollar tus conocimientos y "
                        "potenciar tus habilidades."
                    ),
                    "url": "https://mylearninglxp.edcast.com/",
                },
                {
                    "clave": "me-office",
                    "nombre": "ME Office",
                    "nota": "",
                    "descripcion": (
                        "Reserva puestos de trabajo, salas de reuniones y coordina tus jornadas "
                        "presenciales con tu equipo."
                    ),
                    "url": "https://enel.service-now.com/meoffice",
                },
                {
                    "clave": "next-move",
                    "nombre": "Next Move",
                    "nota": "",
                    "descripcion": (
                        "Descubre oportunidades profesionales, proyectos y recursos para impulsar tu "
                        "desarrollo y crecimiento en Enel."
                    ),
                    "url": "https://enelcom.sharepoint.com/sites/globalintranet/SitePages/Next%20Move/es/NextMove.aspx",
                },
            ],
            max_items=12,
            item_fields=(
                FieldDef(
                    "clave",
                    "Icono",
                    "select",
                    default="portal-me",
                    options=(
                        ("portal-me", "Portal ME"),
                        ("tell-me", "People ME"),
                        ("me-learning", "ME Learning"),
                        ("me-office", "ME Office"),
                        ("next-move", "Next Move"),
                    ),
                ),
                FieldDef("nombre", "Nombre", "text", required=True, max_length=80),
                FieldDef("nota", "Nota", "text", max_length=120),
                FieldDef(
                    "descripcion",
                    "Descripción",
                    "textarea",
                    required=True,
                    max_length=600,
                ),
                FieldDef("url", "Enlace", "url", required=True),
            ),
        ),
    ),
)

PERSONAS = SectionDef(
    key="personas",
    label="Novedades",
    nav_label="Novedades",
    description="Bloque de novedades e intranet.",
    fields=(
        FieldDef(
            key="titulo",
            label="Título",
            type="text",
            default="Mantente al día",
            required=True,
            max_length=120,
        ),
        FieldDef(
            key="intro",
            label="Introducción",
            type="textarea",
            default=(
                "La energía que mueve a Chile también vive en nuestra intranet: novedades, personas y "
                "recursos para tu día a día."
            ),
            required=True,
            max_length=800,
        ),
        FieldDef(
            key="cta_texto",
            label="Texto del botón",
            type="text",
            default="Accede a nuestra intranet",
            max_length=80,
        ),
        FieldDef(
            key="cta_url",
            label="Enlace del botón",
            type="url",
            default=(
                "https://enelcom.sharepoint.com/sites/globalintranet/SitePages/es/Home.aspx"
            ),
        ),
        FieldDef(
            key="imagen",
            label="Imagen",
            type="image",
            default="",
            help_text="Si queda vacía se usa la imagen actual del portal ME.",
        ),
        FieldDef(
            key="imagen_alt",
            label="Texto alternativo de la imagen",
            type="text",
            default="Vista del portal ME de Enel",
            max_length=200,
        ),
        FieldDef(
            key="imagen_pie",
            label="Pie de imagen",
            type="text",
            default="Intranet",
            max_length=80,
        ),
    ),
)

ESPACIOS = SectionDef(
    key="espacios",
    label="Espacios",
    nav_label="Espacios",
    description="Instalaciones y sus fichas.",
    fields=(
        FieldDef(
            key="titulo",
            label="Título",
            type="text",
            default="Conoce nuestras instalaciones",
            required=True,
            max_length=120,
        ),
        FieldDef(
            key="intro",
            label="Introducción",
            type="textarea",
            default=(
                "Los espacios donde trabaja la energía que mueve a Chile, desde el centro de formación "
                "hasta las oficinas de operación."
            ),
            required=True,
            max_length=800,
        ),
        FieldDef(
            key="instalaciones",
            label="Instalaciones",
            type="list",
            default=[
                {
                    "titulo": "Centro de Excelencia Operacional",
                    "subtitulo": "Seguridad e innovación en acción",
                    "descripcion": (
                        "Un centro de formación y capacitación donde nuestros equipos perfeccionan sus "
                        "conocimientos técnicos y refuerzan la cultura de seguridad."
                    ),
                    "url": (
                        "https://www.enel.cl/es/conoce-enel/"
                        "ceo-centro-de-excelencia-operacional-enel-distribucion.html"
                    ),
                    "accion": "Centro de Excelencia",
                    "imagen": "",
                    "alt": "Centro de Excelencia Operacional",
                },
                {
                    "titulo": "Edificio Corporativo MUT",
                    "subtitulo": "Nuestro hogar en el Mercado Urbano Tobalaba",
                    "descripcion": (
                        "Nuestro edificio corporativo en el Mercado Urbano Tobalaba, un espacio de "
                        "trabajo colaborativo conectado con el centro de Santiago."
                    ),
                    "url": (
                        "https://www.enel.cl/es/conoce-enel/prensa/press-enel-chile/"
                        "d202404-enel-inicio-traslado-a-edificio-corporativo-en-mut.html"
                    ),
                    "accion": "Conocer el MUT",
                    "imagen": "",
                    "alt": "Edificio corporativo Enel en el MUT",
                },
                {
                    "titulo": "Oficinas Comerciales",
                    "subtitulo": "Atención presencial cerca de ti",
                    "descripcion": (
                        "Puntos de atención presencial donde clientes y vecinos realizan trámites, "
                        "reciben asesoría y conocen nuestros servicios."
                    ),
                    "url": "https://www.enel.cl/es/clientes/empalmes-y-proyectos-electricos/agenda-visita.html",
                    "accion": "Agendar visita",
                    "imagen": "https://picsum.photos/seed/enel-comercial/1200/800",
                    "alt": "Oficinas comerciales Enel",
                },
                {
                    "titulo": "Oficinas Victoria",
                    "subtitulo": "Operación y servicio en la zona sur",
                    "descripcion": (
                        "Oficinas de operación y atención que acompañan a los clientes y equipos de la "
                        "zona sur de la Región Metropolitana."
                    ),
                    "url": "https://www.enel.cl/es/historias/a201803-victoria-612.html",
                    "accion": "Conocer Victoria",
                    "imagen": "https://picsum.photos/seed/enel-victoria/1200/800",
                    "alt": "Oficinas Enel Victoria",
                },
                {
                    "titulo": "Oficinas Marathon",
                    "subtitulo": "Equipos administrativos y operativos",
                    "descripcion": (
                        "Espacios de trabajo para los equipos administrativos y operativos que "
                        "coordinan la gestión diaria de la compañía."
                    ),
                    "url": "https://www.enel.cl/",
                    "accion": "Conocer Marathon",
                    "imagen": "https://picsum.photos/seed/enel-marathon/1200/800",
                    "alt": "Oficinas Enel Marathon",
                },
            ],
            max_items=12,
            item_fields=(
                FieldDef("titulo", "Título", "text", required=True, max_length=120),
                FieldDef("subtitulo", "Subtítulo", "text", max_length=160),
                FieldDef(
                    "descripcion",
                    "Descripción",
                    "textarea",
                    required=True,
                    max_length=600,
                ),
                FieldDef("url", "Enlace", "url", required=True),
                FieldDef("accion", "Texto del botón", "text", max_length=60),
                FieldDef("imagen", "Imagen", "image", default=""),
                FieldDef("alt", "Texto alternativo", "text", max_length=200),
            ),
        ),
        FieldDef(
            key="descripcion_extra",
            label="Descripción extra de la galería",
            type="textarea",
            default=(
                "Espacios pensados para el trabajo seguro y colaborativo de los equipos, con "
                "estándares de eficiencia energética y confort para quienes los visitan a diario."
            ),
            max_length=600,
        ),
    ),
)

CIERRE = SectionDef(
    key="cierre",
    label="Cierre",
    nav_label="Cierre",
    description="Accesos rápidos y cierre del recorrido.",
    reorderable=False,
    fixed_position=-1,
    fields=(
        FieldDef(
            key="kicker",
            label="Antetítulo",
            type="text",
            default="Sigue explorando",
            max_length=80,
        ),
        FieldDef(
            key="titulo",
            label="Título",
            type="text",
            default="Accesos Rápidos",
            required=True,
            max_length=120,
        ),
        FieldDef(
            key="intro",
            label="Introducción",
            type="textarea",
            default=(
                "Accede en un solo lugar a las políticas, contactos y canales que necesitas para tu "
                "trabajo."
            ),
            required=True,
            max_length=800,
        ),
        FieldDef(
            key="recursos",
            label="Accesos rápidos",
            type="list",
            default=[
                {
                    "titulo": "Política Stop Work",
                    "descripcion": (
                        "Detén la tarea ante cualquier condición de riesgo para la seguridad de las "
                        "personas."
                    ),
                    "url": "https://enelchile.sharepoint.com/sites/politica-stop-work",
                },
                {
                    "titulo": "Contacto ICT / Política Incidente ciber",
                    "descripcion": (
                        "Reporta incidentes de ciberseguridad y contacta al equipo ICT."
                    ),
                    "url": "https://enelchile.sharepoint.com/sites/seguridad-informacion",
                },
                {
                    "titulo": "Contactos clave",
                    "descripcion": "Directorio de contactos de cada área y gerencia.",
                    "url": "https://enelchile.sharepoint.com/sites/directorio",
                },
                {
                    "titulo": "Canales de denuncia",
                    "descripcion": (
                        "Reporta conductas contrarias al Código Etico de forma confidencial."
                    ),
                    "url": "https://enelchile.sharepoint.com/sites/canales-denuncia",
                },
                {
                    "titulo": "One Click",
                    "descripcion": (
                        "Accede a la intranet y a las herramientas que usas a diario."
                    ),
                    "url": "https://enelchile.sharepoint.com/sites/one-click",
                },
            ],
            max_items=9,
            item_fields=(
                FieldDef("titulo", "Título", "text", required=True, max_length=120),
                FieldDef(
                    "descripcion",
                    "Descripción",
                    "textarea",
                    required=True,
                    max_length=400,
                ),
                FieldDef("url", "Enlace", "url", required=True),
            ),
        ),
        FieldDef(
            key="cita",
            label="Cita de cierre",
            type="textarea",
            default=(
                '"La energía de un equipo se multiplica cuando todos trabajan con el mismo propósito."'
            ),
            max_length=400,
        ),
    ),
)

SECTIONS: tuple[SectionDef, ...] = (
    PORTADA,
    HISTORIA,
    CULTURA,
    ORGANIGRAMA,
    CONCESION,
    CADENA,
    POLITICAS,
    GALERIAS,
    PERSONAS,
    ESPACIOS,
    CIERRE,
)

SECTION_MAP: dict[str, SectionDef] = {section.key: section for section in SECTIONS}
SECTION_ORDER: tuple[str, ...] = tuple(section.key for section in SECTIONS)


def build_default_payload() -> dict[str, Any]:
    """Payload inicial con el contenido actual del portal."""
    return {
        "order": list(SECTION_ORDER),
        "sections": {section.key: section.default_values() for section in SECTIONS},
    }


def schema() -> dict[str, Any]:
    return {
        "sections": [section.schema_dict() for section in SECTIONS],
        "default_order": list(SECTION_ORDER),
    }
