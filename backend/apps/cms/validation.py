"""Validacion y normalizacion del payload editorial del CMS."""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import urlparse
from uuid import UUID

from rest_framework.exceptions import ValidationError

from .registry import SECTION_MAP, SECTION_ORDER, FieldDef, build_default_payload

YOUTUBE_RE = re.compile(
    r"^https?://(?:www\.)?(?:youtube\.com/(?:watch\?v=|embed/|shorts/|live/)|youtu\.be/)"
    r"[A-Za-z0-9_-]{6,20}(?:[?&][^\s]*)?$"
)
MEDIA_PATH_RE = re.compile(r"^/api/cms/media/(?P<pk>[0-9a-fA-F-]{36})/?$")

ALLOWED_NODES = {
    "doc",
    "paragraph",
    "heading",
    "bulletList",
    "orderedList",
    "listItem",
    "blockquote",
    "hardBreak",
    "text",
}
ALLOWED_MARKS = {"bold", "italic", "underline", "link"}
MAX_RICH_NODES = 800
MAX_RICH_CHARS = 20000
MAX_RICH_DEPTH = 12


def _error(path: str, message: str) -> ValidationError:
    return ValidationError({path: [message]})


def _is_blank(value: Any) -> bool:
    return value is None or (isinstance(value, str) and not value.strip())


def validate_rich_text(value: Any, path: str) -> dict[str, Any]:
    """Valida un documento JSON con la lista blanca de nodos y marcas."""
    if not isinstance(value, dict):
        raise _error(path, "El texto enriquecido debe ser un documento JSON.")
    if value.get("type") != "doc":
        raise _error(path, "El documento debe comenzar con un nodo 'doc'.")

    counters = {"nodes": 0, "chars": 0}

    def walk(node: Any, depth: int) -> None:
        if depth > MAX_RICH_DEPTH:
            raise _error(path, "El documento supera la profundidad permitida.")
        if not isinstance(node, dict):
            raise _error(path, "Cada nodo del documento debe ser un objeto.")
        counters["nodes"] += 1
        if counters["nodes"] > MAX_RICH_NODES:
            raise _error(path, "El documento supera la cantidad de nodos permitida.")

        node_type = node.get("type")
        if node_type not in ALLOWED_NODES:
            raise _error(path, f"Tipo de nodo no permitido: {node_type!r}.")

        attrs = node.get("attrs", {})
        if attrs and node_type not in {"heading"}:
            raise _error(path, f"El nodo {node_type!r} no admite atributos.")
        if node_type == "heading":
            level = attrs.get("level") if isinstance(attrs, dict) else None
            if level not in (2, 3):
                raise _error(path, "Solo se permiten titulos de nivel 2 y 3.")
            if set(attrs) - {"level"}:
                raise _error(
                    path, "El nodo 'heading' contiene atributos no permitidos."
                )

        if node_type == "text":
            text = node.get("text")
            if not isinstance(text, str):
                raise _error(path, "El nodo 'text' requiere un string en 'text'.")
            counters["chars"] += len(text)
            if counters["chars"] > MAX_RICH_CHARS:
                raise _error(path, "El documento supera el largo de texto permitido.")
            marks = node.get("marks", [])
            if not isinstance(marks, list):
                raise _error(path, "Las marcas del texto deben ser una lista.")
            for mark in marks:
                if not isinstance(mark, dict) or mark.get("type") not in ALLOWED_MARKS:
                    raise _error(path, "Marca de texto no permitida.")
                mark_type = mark["type"]
                mark_attrs = mark.get("attrs", {})
                if mark_type == "link":
                    href = (
                        mark_attrs.get("href") if isinstance(mark_attrs, dict) else None
                    )
                    if not isinstance(href, str) or not _valid_url(href):
                        raise _error(path, "El enlace debe ser una URL http(s) valida.")
                    if set(mark_attrs) - {"href", "target", "rel"}:
                        raise _error(
                            path, "El enlace contiene atributos no permitidos."
                        )
                elif mark_attrs:
                    raise _error(path, f"La marca {mark_type!r} no admite atributos.")

        content = node.get("content", [])
        if content is None:
            content = []
        if not isinstance(content, list):
            raise _error(path, "El contenido de un nodo debe ser una lista.")
        for child in content:
            walk(child, depth + 1)

    walk(value, 0)
    return value


def _valid_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def _valid_media_path(value: str) -> bool:
    match = MEDIA_PATH_RE.match(value)
    if not match:
        return False
    try:
        media_id = UUID(match.group("pk"))
    except ValueError:
        return False
    from .models import MediaAsset

    return MediaAsset.objects.filter(pk=media_id).exists()


def _validate_image(value: Any, path: str, required: bool) -> str:
    if _is_blank(value):
        if required:
            raise _error(path, "Este campo es obligatorio.")
        return ""
    if not isinstance(value, str):
        raise _error(path, "La imagen debe ser una URL o una imagen subida al CMS.")
    value = value.strip()
    if MEDIA_PATH_RE.match(value):
        if not _valid_media_path(value):
            raise _error(path, "La imagen referenciada no existe.")
        return value
    if not _valid_url(value):
        raise _error(path, "La imagen debe ser una URL http(s) o una imagen del CMS.")
    return value


def _validate_scalar(field: FieldDef, value: Any, path: str) -> Any:
    if field.type in {"text", "textarea"}:
        if value is None:
            value = ""
        if not isinstance(value, str):
            raise _error(path, "Debe ser texto.")
        value = value.strip()
        limit = field.max_length or (5000 if field.type == "textarea" else 500)
        if len(value) > limit:
            raise _error(path, f"Supera el maximo de {limit} caracteres.")
        if field.required and not value:
            raise _error(path, "Este campo es obligatorio.")
        return value

    if field.type == "rich":
        if value in (None, ""):
            if field.required:
                raise _error(path, "Este campo es obligatorio.")
            return {"type": "doc", "content": []}
        return validate_rich_text(value, path)

    if field.type == "url":
        if _is_blank(value):
            if field.required:
                raise _error(path, "Este campo es obligatorio.")
            return ""
        if not isinstance(value, str) or not _valid_url(value.strip()):
            raise _error(path, "Debe ser una URL http(s) valida.")
        value = value.strip()
        if len(value) > 2000:
            raise _error(path, "La URL supera el maximo de 2000 caracteres.")
        return value

    if field.type == "youtube":
        if _is_blank(value):
            return ""
        if not isinstance(value, str) or not YOUTUBE_RE.match(value.strip()):
            raise _error(path, "Debe ser un enlace valido de YouTube.")
        return value.strip()

    if field.type == "image":
        return _validate_image(value, path, field.required)

    if field.type == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise _error(path, "Debe ser un numero.")
        return value

    if field.type == "select":
        if _is_blank(value):
            value = field.default
        allowed = {option_value for option_value, _ in field.options}
        if value not in allowed:
            raise _error(path, "La opcion seleccionada no es valida.")
        return value

    raise _error(path, f"Tipo de campo desconocido: {field.type!r}.")


def _validate_item(
    item_fields: tuple[FieldDef, ...], raw: Any, path: str
) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise _error(path, "Cada elemento de la lista debe ser un objeto.")
    known = {field.key for field in item_fields}
    unknown = set(raw) - known
    if unknown:
        raise _error(path, f"Campos no permitidos: {', '.join(sorted(unknown))}.")
    item: dict[str, Any] = {}
    for field in item_fields:
        value = raw.get(field.key, field.default)
        if field.type == "list":
            item[field.key] = _validate_list(field, value, f"{path}.{field.key}")
        else:
            item[field.key] = _validate_scalar(field, value, f"{path}.{field.key}")
    return item


def _validate_list(field: FieldDef, value: Any, path: str) -> list[dict[str, Any]]:
    if value is None:
        return []
    if not isinstance(value, list):
        raise _error(path, "Debe ser una lista.")
    if len(value) > field.max_items:
        raise _error(path, f"Supera el maximo de {field.max_items} elementos.")
    return [
        _validate_item(field.item_fields, item, f"{path}[{index}]")
        for index, item in enumerate(value)
    ]


def _validate_section(section, raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise _error(
            f"sections.{section.key}", "La seccion debe ser un objeto de campos."
        )
    known = {field.key for field in section.fields} | {"nav_label"}
    unknown = set(raw) - known
    if unknown:
        raise _error(
            f"sections.{section.key}",
            f"Campos no permitidos: {', '.join(sorted(unknown))}.",
        )

    values = section.default_values()
    nav_label = raw.get("nav_label", section.nav_label)
    if not isinstance(nav_label, str) or not nav_label.strip():
        raise _error(f"sections.{section.key}.nav_label", "Este campo es obligatorio.")
    nav_label = nav_label.strip()
    if len(nav_label) > 40:
        raise _error(
            f"sections.{section.key}.nav_label", "Supera el maximo de 40 caracteres."
        )
    values["nav_label"] = nav_label

    for field in section.fields:
        value = raw.get(field.key, field.default)
        path = f"sections.{section.key}.{field.key}"
        if field.type == "list":
            values[field.key] = _validate_list(field, value, path)
        else:
            values[field.key] = _validate_scalar(field, value, path)
    return values


def _validate_order(raw_order: Any) -> list[str]:
    if raw_order is None:
        return list(SECTION_ORDER)
    if not isinstance(raw_order, list) or not all(
        isinstance(item, str) for item in raw_order
    ):
        raise _error("order", "El orden debe ser una lista de claves de seccion.")
    if len(raw_order) != len(set(raw_order)):
        raise _error("order", "El orden no puede repetir secciones.")
    if set(raw_order) != set(SECTION_ORDER):
        missing = set(SECTION_ORDER) - set(raw_order)
        extra = set(raw_order) - set(SECTION_ORDER)
        detail = []
        if missing:
            detail.append(f"faltan: {', '.join(sorted(missing))}")
        if extra:
            detail.append(f"sobran: {', '.join(sorted(extra))}")
        raise _error(
            "order", f"El orden debe incluir todas las secciones ({'; '.join(detail)})."
        )

    for section in SECTION_MAP.values():
        if section.fixed_position is None:
            continue
        expected = 0 if section.fixed_position == 0 else len(raw_order) - 1
        if raw_order.index(section.key) != expected:
            position = "primera" if expected == 0 else "ultima"
            raise _error(
                "order",
                f"La seccion '{section.label}' debe permanecer en la {position} posicion.",
            )
    return list(raw_order)


def normalize_payload(payload: Any) -> dict[str, Any]:
    """Devuelve un payload completo, validado y con defaults aplicados."""
    if not isinstance(payload, dict):
        raise _error("payload", "El contenido debe ser un objeto JSON.")

    known = {"order", "sections"}
    unknown = set(payload) - known
    if unknown:
        raise _error("payload", f"Campos no permitidos: {', '.join(sorted(unknown))}.")

    order = _validate_order(payload.get("order"))
    raw_sections = payload.get("sections", {})
    if not isinstance(raw_sections, dict):
        raise _error("sections", "Las secciones deben ser un objeto.")
    unknown_sections = set(raw_sections) - set(SECTION_ORDER)
    if unknown_sections:
        raise _error(
            "sections",
            f"Secciones no permitidas: {', '.join(sorted(unknown_sections))}.",
        )

    sections = {
        key: _validate_section(SECTION_MAP[key], raw_sections.get(key, {}))
        for key in SECTION_ORDER
    }

    return {"order": order, "sections": sections}


def default_payload() -> dict[str, Any]:
    return normalize_payload(build_default_payload())
