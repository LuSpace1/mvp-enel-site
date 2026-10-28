"""
Roles tecnicos del portal.

El CMS usa un unico rol de negocio: `CMS_Admin`. Quien lo tiene puede editar,
previsualizar, publicar, reordenar y restaurar contenido. `Portal_Admin` queda
reservado para la administracion tecnica del portal (identidad/SCIM y contenido
global); no otorga acceso al CMS.

Los permisos se otorgan exclusivamente por pertenencia a grupos (`Group`), no
por flags ni permisos directos en el usuario.
"""

from django.conf import settings

# Rol tecnico de bootstrap para administrar identidad y configuracion global.
# No se asigna al equipo de contenido.
DEFAULT_ADMIN_ROLE = "Portal_Admin"

# Unico rol del CMS. Su nombre es configurable para adaptarlo a CompAC.
PROPOSED_CMS_ADMIN = "CMS_Admin"
PROPOSED_ROLES = (PROPOSED_CMS_ADMIN,)


def admin_role_name() -> str:
    """Nombre del rol administrador tecnico, configurable por entorno."""
    return getattr(settings, "PORTAL_ADMIN_ROLE", DEFAULT_ADMIN_ROLE)


def cms_admin_role_name() -> str:
    """Nombre del unico rol que administra el CMS."""
    return getattr(settings, "CMS_ADMIN_ROLE", PROPOSED_CMS_ADMIN)


def cms_role_names() -> tuple[str, ...]:
    return (cms_admin_role_name(),)


def core_technical_roles() -> tuple[str, ...]:
    """Roles tecnicos que la aplicacion reconoce hoy."""
    return (admin_role_name(), cms_admin_role_name())


def capability_summary() -> tuple[str, ...]:
    """Capacidades que otorga el rol administrador tecnico del portal."""
    return (
        "Administrar identidad, roles y aprovisionamiento SCIM.",
        "Administrar el contenido global del portal (videos y metadatos).",
        "Acceder a la administracion tecnica de Django.",
    )
