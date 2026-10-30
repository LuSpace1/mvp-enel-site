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

El CMS permite que se actualice el contenido del portal sin desplegar código. Se accede en `/cms`, donde se editan las secciones y el orden en que se recorre el portal.

Los cambios se trabajan sobre un borrador único, compartido entre las vistas de Contenido y Orden. El borrador solo se guarda con **Guardar** o **Guardar orden**, y la vista previa permite revisar el resultado antes de publicar. Guardar no crea una versión: solo actualiza el borrador.

Cada publicación crea una **versión numerada** (v1, v2, v3…) que queda en el historial. El borrador se cierra al publicar; la siguiente edición parte de la última publicación. En **Versiones** se consulta el historial, se identifica la versión actual y se puede restaurar una anterior como borrador para publicarla de nuevo. La publicación actualiza contenido y orden en una sola operación.

La interfaz incluye una guía **¿Cómo funciona?**, un estado permanente del borrador en la barra lateral, aviso al salir con cambios sin guardar y confirmación de publicación que distingue contenido y orden. Restaurar advierte si va a reemplazar un borrador con cambios.

---

*Mejora Continua — Quality Assurance, Enel Distribución Chile*
