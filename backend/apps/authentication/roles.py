from django.conf import settings

DEFAULT_ADMIN_ROLE = "Portal_Admin"

PROPOSED_CMS_ADMIN = "CMS_Admin"
PROPOSED_ROLES = (PROPOSED_CMS_ADMIN,)

ROLE_LABELS = {
    DEFAULT_ADMIN_ROLE: "Administrador Técnico (SCIM)",
    PROPOSED_CMS_ADMIN: "Administrador Editorial (CMS)",
}

ROLE_COLORS = {
    PROPOSED_CMS_ADMIN: "#00A859",  # Verde editorial
    DEFAULT_ADMIN_ROLE: "#1e3a8a",  # Azul corporativo
}

ROLE_CAPABILITIES: dict[str, tuple[str, ...]] = {
    PROPOSED_CMS_ADMIN: (
        "Acceder al panel de administración del CMS (/cms).",
        "Editar textos, enlaces, videos y contenidos de todas las secciones.",
        "Gestionar y subir imágenes a la base de datos (MediaAsset).",
        "Reordenar las secciones del portal y el menú de navegación (/cms/orden).",
        "Guardar y previsualizar borradores en tiempo real (/cms/preview).",
        "Publicar atómicamente nuevas versiones del portal.",
        "Consultar el historial de versiones y restaurar publicaciones anteriores (/cms/revisiones).",
        "Visualizar métricas y analíticas de visitas del portal (/cms/kpis).",
    ),
    DEFAULT_ADMIN_ROLE: (
        "Administrar identidades, altas y bajas lógicas de usuarios vía API.",
        "Acceder al conector SCIM 2.0 corporativo (/api/scim/v2/).",
        "Consultar la bitácora de auditoría de identidades (IdentityAuditLog).",
        "Acceder a la administración técnica de Django.",
    ),
}

DEFAULT_USER_CAPABILITIES: tuple[str, ...] = (
    "Acceso de lectura e interacción al portal corporativo (/), mapas y contenidos.",
    "Sin permisos editoriales en el CMS ni administración de identidades.",
)


def admin_role_name() -> str:
    """Nombre del rol administrador técnico."""
    return getattr(settings, "PORTAL_ADMIN_ROLE", DEFAULT_ADMIN_ROLE)


def cms_admin_role_name() -> str:
    """Nombre del rol de administración del CMS."""
    return getattr(settings, "CMS_ADMIN_ROLE", PROPOSED_CMS_ADMIN)


def cms_role_names() -> tuple[str, ...]:
    return (cms_admin_role_name(),)


def core_technical_roles() -> tuple[str, ...]:
    """Lista de roles técnicos reconocidos por la aplicación."""
    return (admin_role_name(), cms_admin_role_name())


def capability_summary() -> tuple[str, ...]:
    """Resumen de acciones permitidas para el administrador."""
    return (
        "Administrar identidad, roles y aprovisionamiento SCIM.",
        "Administrar el contenido global del portal (videos y metadatos).",
        "Acceder a la administracion tecnica de Django.",
    )
