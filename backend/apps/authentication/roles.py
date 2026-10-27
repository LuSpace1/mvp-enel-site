"""
Roles tecnicos del portal.

Este sitio solo necesita un rol tecnico para administrar su contenido. El
nombre es una **propuesta** pendiente de confirmacion con Enel/CompAC; no se
importan roles, jerarquias ni flujos de otros productos. Cualquier rol nuevo
debe acordarse antes de implementarse.

Los permisos se otorgan exclusivamente por pertenencia a grupos (`Group`), no
por flags ni permisos directos en el usuario.
"""

from django.conf import settings

# Nombre propuesto del rol tecnico de bootstrap que administra el contenido actual.
# Es temporal: cuando se implemente el CMS, el mapeo definitivo deberia usar los
# roles propuestos alli (CMS_Editor / CMS_Publisher) una vez aprobados.
DEFAULT_ADMIN_ROLE = "Portal_Admin"

# Roles propuestos en la definicion del CMS (docs/CMS_FEATURE.md).
# NO estan aprobados ni tienen permisos cableados en este backend todavia.
PROPOSED_CMS_EDITOR = "CMS_Editor"
PROPOSED_CMS_PUBLISHER = "CMS_Publisher"
PROPOSED_ROLES = (PROPOSED_CMS_EDITOR, PROPOSED_CMS_PUBLISHER)


def admin_role_name() -> str:
    """Nombre del rol administrador, configurable por entorno para la conciliacion con CompAC."""
    return getattr(settings, "PORTAL_ADMIN_ROLE", DEFAULT_ADMIN_ROLE)


def core_technical_roles() -> tuple[str, ...]:
    """Roles tecnicos que la aplicacion reconoce hoy."""
    return (admin_role_name(),)


def capability_summary() -> tuple[str, ...]:
    """Capacidades que otorga el rol administrador en este sitio."""
    return (
        "Administrar el contenido del portal (videos y sus metadatos).",
        "Listar usuarios y consultar la auditoria de identidad.",
        "Acceder al conector SCIM con un token de scope `scim` o como administrador autenticado.",
    )
