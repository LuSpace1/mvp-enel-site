"""Limites de envio para la recoleccion de eventos."""

from rest_framework.throttling import SimpleRateThrottle


class ColectaThrottle(SimpleRateThrottle):
    """
    Limita por visitante, no por IP.

    Detras de la VPN corporativa cientos de personas comparten la misma IP
    publica: limitar por IP bloquearia a toda la empresa.
    """

    scope = "analytics"

    def get_cache_key(self, request, view):
        visitante = ""
        if isinstance(request.data, dict):
            visitante = str(request.data.get("anonymous_id") or "")
        if not visitante:
            return None
        return self.cache_format % {"scope": self.scope, "ident": visitante}
