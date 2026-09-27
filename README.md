# Portal Enel Distribución

Portal interactivo de Enel Distribución Chile. Es una sola página que se recorre con scroll: el contenido se arma mientras bajas, con animaciones, videos de fondo y galerías.

## Secciones

1. Intro animado
2. Inicio (portada)
3. Historia
4. Cultura
5. Equipos
6. Concesión
7. Cadena de valor
8. Políticas ISO
9. Me Office
10. Rostros
11. Preguntas frecuentes
12. Cierre

## Tecnologías

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Motion, Zustand
- **Backend:** Django 5, Django REST Framework, SQLite
- **Lint y formato:** oxlint, Prettier

## Cómo correrlo

Necesitas Python 3.12+, Node.js y [uv](https://docs.astral.sh/uv/).

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

---

*Mejora Continua — Quality Assurance, Enel Distribución Chile*
