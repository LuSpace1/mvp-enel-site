"""Validaciones de identidad corporativa compartidas por el conector SCIM."""

import re

# Enel ID: A + seis digitos (A123456), segun el contrato de integracion.
# Si Enel confirma excepciones (p. ej. siete digitos), ajustar este patron.
CORPORATE_ID_REGEX = r"^A\d{6}$"
_CORPORATE_ID_PATTERN = re.compile(CORPORATE_ID_REGEX)


def is_valid_corporate_id(value: str | None) -> bool:
    """Valida que el Enel ID cumpla el formato corporativo acordado."""
    return bool(_CORPORATE_ID_PATTERN.match((value or "").strip()))
