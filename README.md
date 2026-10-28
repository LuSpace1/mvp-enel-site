# Portal Enel Distribución

Portal interactivo de Enel Distribución Chile. Es una sola página que se recorre con scroll: el contenido se arma mientras bajas, con animaciones, videos de fondo y galerías. Incluye un CMS propio para que P&O actualice el contenido sin desplegar código.

## Secciones

1. Intro animado (fija, fuera del CMS)
2. Inicio
3. Historia
4. Cultura
5. Equipos
6. Concesión
7. Cadena de valor
8. Políticas ISO
9. ME
10. Novedades
11. Espacios
12. Cierre

El orden publicado de las secciones del CMS alimenta a la vez la página, el header y el índice lateral.

## Tecnologías

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Motion, Zustand, shadcn/ui, TipTap
- **Backend:** Django 6, Django REST Framework, PostgreSQL 18
- **Lint y formato:** oxlint, Prettier, ruff

## Base de datos

PostgreSQL debe estar corriendo en `127.0.0.1:5432`. La base y el rol de este proyecto son independientes de otros portales:

```sql
ALTER ROLE postgres WITH PASSWORD '<contraseña>';
CREATE DATABASE portal_enel OWNER postgres ENCODING 'UTF8';
```

La aplicación usa el superusuario `postgres` como única credencial de base, igual que `portal-sig`.

Copia `.env.example` a `.env`, define la contraseña local y ajusta las credenciales si corresponde. El archivo `.env` no se versiona.

## Cómo correrlo

Necesitas Python 3.12+, Node.js, PostgreSQL y [uv](https://docs.astral.sh/uv/).

```bash
# Backend
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py runserver

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

El sitio queda en `http://localhost:5173`. Vite manda las llamadas `/api` al backend, que corre en el puerto 8000.

En `frontend/` también están:

```bash
npm run build    # compilar para producción
npm run lint     # revisar con oxlint
npm run format   # formatear con prettier
```

## CMS

El panel está en `http://localhost:5173/cms` y usa el login local del MVP (el SSO corporativo sigue pendiente de definición).

Las cuentas se crean desde `/django-admin/`:

1. Crea el usuario con `uv run python manage.py createsuperuser` o desde el Admin.
2. Crea el grupo `CMS_Admin` y asígnalo a las personas administradoras del CMS.
3. Asigna el grupo a cada usuario que corresponda. `Portal_Admin` queda reservado para soporte técnico.

El contenido publicado se sirve desde `GET /api/cms/public/`. Si la API no responde, el frontend usa el contenido por defecto del código. El borrador se crea al activar el modo edición y no se publica hasta que una persona administradora lo publica; la publicación es atómica e incluye contenido y orden.

En una base recién migrada, la primera petición al CMS materializa el contenido inicial del portal (incluido el enlace actual del video del hero) como publicación y borrador. No hay comandos de seed ni datos de demostración en el repositorio.

Más detalle en [`docs/CMS_FEATURE.md`](docs/CMS_FEATURE.md) y [`docs/AUTHENTICATION.md`](docs/AUTHENTICATION.md).

---

*Mejora Continua — Quality Assurance, Enel Distribución Chile*
