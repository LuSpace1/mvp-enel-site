# Portal Interactivo Enel Distribución

Portal interactivo scroll-driven para que cualquier trabajador —interno o externo— de Enel Distribución Chile se familiarice con la empresa. Recorrido narrativo por historia, cultura, organizacional, zona de concesión, cadena de valor y políticas ISO.

Trabajo realizado por el área de **Mejora Continua en Quality Assurance**.

## Stack

- **Backend:** Python 3.12+ / Django 5 / Django REST Framework / JWT / SQLite
- **Frontend:** React 19 / TypeScript / Vite / Tailwind CSS / Motion / Zustand
- **Herramientas:** uv / oxlint / Prettier

## Arquitectura

SPA single-page con experiencia scroll-driven narrativa de 10 capítulos. El frontend carga bajo demanda cada sección via `React.lazy()` y consume una API REST que gestiona autenticación anónima (UUID + JWT) y contenido de videos.

En desarrollo, Vite proxea las llamadas a `/api` hacia el backend Django en `localhost:8000`.

## Getting Started

**Prerrequisitos:** Python 3.12+, Node.js, [uv](https://docs.astral.sh/uv/)

```bash
# Backend
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

El portal queda disponible en `http://localhost:5173`.

---

*Prototipo MVP — Enel Distribución Chile | Mejora Continua en Quality Assurance*
