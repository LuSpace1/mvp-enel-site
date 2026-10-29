from django.conf import settings

# Rol administrador técnico
DEFAULT_ADMIN_ROLE = "Portal_Admin"

# Rol para edición y publicación del CMS
PROPOSED_CMS_ADMIN = "CMS_Admin"
PROPOSED_ROLES = (PROPOSED_CMS_ADMIN,)


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
