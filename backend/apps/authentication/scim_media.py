"""Parser y renderer del media type SCIM 2.0 (`application/scim+json`)."""

from rest_framework.parsers import JSONParser
from rest_framework.renderers import JSONRenderer

SCIM_MEDIA_TYPE = "application/scim+json"


class ScimJSONParser(JSONParser):
    """Parsea payloads `application/scim+json`."""

    media_type = SCIM_MEDIA_TYPE


class ScimJSONRenderer(JSONRenderer):
    """Renderiza respuestas `application/scim+json`."""

    media_type = SCIM_MEDIA_TYPE
