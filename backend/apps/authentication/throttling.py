from django.conf import settings
from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    """Limita intentos de inicio de sesión por dirección IP para evitar fuerza bruta."""

    scope = "login"

    def get_rate(self):
        return getattr(settings, "LOGIN_THROTTLE_RATE", "10/min")

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class ScimRateThrottle(SimpleRateThrottle):
    """Limita el ritmo de peticiones SCIM por aplicación o usuario."""

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
    """Limita solicitudes al endpoint de emisión de tokens OAuth2."""

    scope = "oauth_token"

    def get_rate(self):
        return getattr(settings, "OAUTH_TOKEN_THROTTLE_RATE", "30/min")

    def get_cache_key(self, request, view=None):
        client_id = ""
        try:
            client_id = (request.POST.get("client_id") or "").strip()
        except AttributeError:
            client_id = ""
        ident = f"client:{client_id}" if client_id else self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}
