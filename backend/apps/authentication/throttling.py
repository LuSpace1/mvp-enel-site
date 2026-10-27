"""
Limites de peticiones (anti fuerza bruta y anti DoS).

Las tasas se configuran por entorno con formato DRF (`N/minuto`). Con el cache
local por defecto el limite es por proceso; en produccion con varios workers
conviene un cache compartido (Redis/Memcached).
"""

from django.conf import settings
from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    """Limita intentos de login por IP: frena la fuerza bruta de contrasenas."""

    scope = "login"

    def get_rate(self):
        return getattr(settings, "LOGIN_THROTTLE_RATE", "10/min")

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class ScimRateThrottle(SimpleRateThrottle):
    """Limita peticiones SCIM por aplicacion OAuth2 (o usuario/IP como respaldo)."""

    scope = "scim"

    def get_rate(self):
        return getattr(settings, "SCIM_THROTTLE_RATE", "600/min")

    def get_cache_key(self, request, view):
        token = getattr(request, "auth", None)
        application_id = getattr(token, "application_id", None)
        if application_id:
            ident = f"app:{application_id}"
        else:
            user = getattr(request, "user", None)
            if user is not None and getattr(user, "is_authenticated", False):
                ident = f"user:{user.pk}"
            else:
                ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}


class TokenEndpointThrottle(SimpleRateThrottle):
    """Limita peticiones al endpoint OAuth2 de token por cliente o IP."""

    scope = "oauth_token"

    def get_rate(self):
        return getattr(settings, "OAUTH_TOKEN_THROTTLE_RATE", "30/min")

    def get_cache_key(self, request, view=None):
        client_id = ""
        try:
            client_id = (request.POST.get("client_id") or "").strip()
        except AttributeError:  # pragma: no cover - request sin POST
            client_id = ""
        ident = f"client:{client_id}" if client_id else self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}
