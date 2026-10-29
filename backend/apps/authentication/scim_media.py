from rest_framework.parsers import JSONParser
from rest_framework.renderers import JSONRenderer

# Media type estándar de SCIM 2.0
SCIM_MEDIA_TYPE = "application/scim+json"


class ScimJSONParser(JSONParser):
    """Parsea contenido enviado con Content-Type application/scim+json."""

    media_type = SCIM_MEDIA_TYPE


class ScimJSONRenderer(JSONRenderer):
    """Renderiza respuestas con Content-Type application/scim+json."""

    media_type = SCIM_MEDIA_TYPE
