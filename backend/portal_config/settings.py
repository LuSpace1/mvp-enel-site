"""
Configuraciones de Django del portal.

Las credenciales y secretos se leen del entorno. Los valores por defecto son
solo para desarrollo local; no deben usarse en produccion.
"""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# Ruta base del proyecto.
BASE_DIR = Path(__file__).resolve().parent.parent

# Carga variables locales desde .env (ignorado por git); en produccion las
# variables se inyectan por el entorno.
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-dev-only-change-me")
DEBUG = os.getenv("DEBUG", "True") == "True"
ALLOWED_HOSTS = [
    host.strip() for host in os.getenv("ALLOWED_HOSTS", "*").split(",") if host.strip()
]


# Aplicaciones del proyecto.
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Aplicaciones de terceros
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "oauth2_provider",
    # Aplicaciones propias
    "apps.authentication",
    "apps.cms",
    "content",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "portal_config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "portal_config.wsgi.application"


# Base de datos: PostgreSQL en desarrollo, tests y produccion.
# Los valores locales viven en .env (ignorado por git). Django crea y elimina
# su propia base de test a partir de estos parametros.
DATABASES = {
    "default": {
        "ENGINE": os.getenv("DB_ENGINE", "django.db.backends.postgresql"),
        "NAME": os.getenv("DB_NAME", "portal_enel"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", "postgres"),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}


# Modelo de usuario personalizado.
AUTH_USER_MODEL = "authentication.User"


# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
}


# Tokens de sesion del portal (login humano local, puente del MVP).
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    # Un usuario dado de baja (active=false) pierde acceso en la siguiente peticion.
    "CHECK_USER_IS_ACTIVE": True,
}


# OAuth2 maquina a maquina para el conector SCIM (CompAC).
# CompAC no autentica personas: este flujo es solo para la integracion.
OAUTH2_PROVIDER = {
    "OIDC_ENABLED": False,
    "SCOPES": {
        "scim": "Acceso SCIM para aprovisionamiento de identidades y grupos",
    },
    "COMPLIANT_BCP_RFC9700_IMPLICIT_GRANT": True,
    "COMPLIANT_BCP_RFC9700_PASSWORD_GRANT": True,
    "COMPLIANT_BCP_RFC9700_PKCE_METHOD": True,
    "COMPLIANT_BCP_RFC9700_ACCESS_TOKEN_TRANSPORT": True,
    "COMPLIANT_BCP_RFC9700_AUTHZ_RESPONSE_ISS": True,
    "COMPLIANT_BCP_RFC9700_TOKEN_STORAGE": True,
    "COMPLIANT_BCP_RFC9700_REDIRECT_URI_SCHEME": True,
    "ALLOWED_REDIRECT_URI_SCHEMES": ["https"],
    "REFRESH_TOKEN_REUSE_PROTECTION": True,
    "ACCESS_TOKEN_EXPIRE_SECONDS": 3600,
    "REFRESH_TOKEN_EXPIRE_SECONDS": 86400,
}


# Rol tecnico que administra el contenido de este sitio.
# Nombre propuesto: debe confirmarse con Enel/CompAC antes de produccion.
PORTAL_ADMIN_ROLE = os.getenv("PORTAL_ADMIN_ROLE", "Portal_Admin")

# Roles del CMS. Nombres propuestos en docs/CMS_FEATURE.md, pendientes de
# confirmacion con Enel/CompAC; configurables por entorno.
CMS_ADMIN_ROLE = os.getenv("CMS_ADMIN_ROLE", "CMS_Admin")

# Limites de imagenes del CMS (MVP: binarios en la base de datos).
CMS_IMAGE_MAX_BYTES = int(os.getenv("CMS_IMAGE_MAX_BYTES", str(5 * 1024 * 1024)))
CMS_IMAGE_MAX_DIMENSION = int(os.getenv("CMS_IMAGE_MAX_DIMENSION", "2560"))
CMS_IMAGE_ALLOWED_TYPES = ("image/jpeg", "image/png", "image/webp")

# Lista opcional de grupos que SCIM puede crear. Vacia = catalogo dinamico.
# El rol de administracion del portal siempre esta permitido.
SCIM_ALLOWED_GROUPS = [
    name.strip()
    for name in os.getenv("SCIM_ALLOWED_GROUPS", "").split(",")
    if name.strip()
]

# Limites de peticiones (anti fuerza bruta y anti DoS). Formato DRF: "N/minuto".
LOGIN_THROTTLE_RATE = os.getenv("LOGIN_THROTTLE_RATE", "10/min")
SCIM_THROTTLE_RATE = os.getenv("SCIM_THROTTLE_RATE", "600/min")
OAUTH_TOKEN_THROTTLE_RATE = os.getenv("OAUTH_TOKEN_THROTTLE_RATE", "30/min")


# CORS (el frontend local usa el proxy de Vite).
CORS_ALLOW_ALL_ORIGINS = True


# Validacion de contrasenas (solo aplica al Admin local; CompAC no envia contrasenas).
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internacionalizacion
LANGUAGE_CODE = "es-cl"

TIME_ZONE = "America/Santiago"

USE_I18N = True

USE_TZ = True


# Archivos estaticos (CSS, JavaScript, imagenes)
STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}
