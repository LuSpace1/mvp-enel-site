import re

# Formato de identificador Enel: A seguido de 6 a 8 dígitos (ej: A123456)
# o identificador regional (ej: CL12345678).
CORPORATE_ID_REGEX = r"^(A\d{6,8}|CL\d{7,9})$"
_CORPORATE_ID_PATTERN = re.compile(CORPORATE_ID_REGEX, re.IGNORECASE)


def is_valid_corporate_id(value: str | None) -> bool:
    """Valida si el texto cumple con el formato de ID corporativo de Enel."""
    return bool(_CORPORATE_ID_PATTERN.match((value or "").strip()))
