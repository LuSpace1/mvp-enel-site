"""
Roles tecnicos del portal.

El sitio usa tres roles tecnicos: administracion del portal, edicion del CMS y
publicacion del CMS. Los nombres de los roles del CMS son **propuestos** y
quedan pendientes de confirmacion con Enel/CompAC; no se importan roles,
jerarquias ni flujos de otros productos. Cualquier rol nuevo debe acordarse
antes de implementarse.

Los permisos se otorgan exclusivamente por pertenencia a grupos (`Group`), no
por flags ni permisos directos en el usuario.
"""

from django.conf import settings

# Nombre propuesto del rol tecnico de bootstrap que administra el contenido actual.
# Es temporal: cuando se implemente el CMS, el mapeo definitivo deberia usar los
# roles propuestos alli (CMS_Editor / CMS_Publisher) una vez aprobados.
DEFAULT_ADMIN_ROLE = "Portal_Admin"

# Roles del CMS definidos en docs/CMS_FEATURE.md. Los nombres siguen siendo
# provisionales hasta que CompAC confirme su provision, pero ya estan
# cableados al CMS para poder operar el MVP.
PROPOSED_CMS_EDITOR = "CMS_Editor"
PROPOSED_CMS_PUBLISHER = "CMS_Publisher"
PROPOSED_ROLES = (PROPOSED_CMS_EDITOR, PROPOSED_CMS_PUBLISHER)


def admin_role_name() -> str:
    """Nombre del rol administrador, configurable por entorno para la conciliacion con CompAC."""
    return getattr(settings, "PORTAL_ADMIN_ROLE", DEFAULT_ADMIN_ROLE)


def cms_editor_role_name() -> str:
    return getattr(settings, "CMS_EDITOR_ROLE", PROPOSED_CMS_EDITOR)


def cms_publisher_role_name() -> str:
    return getattr(settings, "CMS_PUBLISHER_ROLE", PROPOSED_CMS_PUBLISHER)


def cms_role_names() -> tuple[str, str]:
    return cms_editor_role_name(), cms_publisher_role_name()


def core_technical_roles() -> tuple[str, ...]:
    """Roles tecnicos que la aplicacion reconoce hoy."""
    return (admin_role_name(), cms_editor_role_name(), cms_publisher_role_name())


def capability_summary() -> tuple[str, ...]:
    """Capacidades que otorga el rol administrador en este sitio."""
    return (
        "Administrar el contenido del portal (videos, CMS y sus metadatos).",
        "Editar borradores del CMS y previsualizarlos sin publicar.",
        "Publicar revisiones y cambiar el orden global de secciones.",
        "Listar usuarios y consultar la auditoria de identidad.",
        "Acceder al conector SCIM con un token de scope `scim` o como administrador autenticado.",
    )
