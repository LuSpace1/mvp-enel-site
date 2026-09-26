# Conventional Commits

Guía de estilo para mensajes de commit del equipo. Sigue este estándar para mantener un historial de Git limpio, legible y útil.

Los cambios siempre deben ser subidos en español.

---

## Formato Base

```bash
<tipo>(<scope opcional>): <descripción corta>
[cuerpo opcional]
[footer opcional]
```

El scope es opcional pero recomendado. Indica qué parte del código fue modificada.

---

## Buenas Prácticas: Commits Atómicos y Lógicos

### Separación de Cambios
Cuando trabajes en múltiples tareas simultáneamente, no agrupes todas las modificaciones en un único commit masivo. Divide el trabajo en commits lógicos, independientes y enfocados en resolver una sola cosa a la vez.

### Distinción a Nivel de Línea (Commits Parciales)
Evita el error de añadir un archivo completo (`git add <archivo>`) bajo un único mensaje si este contiene modificaciones que corresponden a diferentes propósitos o líneas de trabajo. 

Si un mismo archivo incluye cambios de distinta naturaleza (por ejemplo, una corrección de un bug y una mejora de estilos), sepáralos en commits diferentes utilizando el empaquetado interactivo de Git:

```bash
# Permite seleccionar y confirmar líneas o bloques específicos dentro de un mismo archivo
git add -p <nombre_del_archivo>
```

---

## Tipos de Commit

### feat — Nueva Funcionalidad

Introduce una nueva feature o funcionalidad al proyecto.

```bash
git commit -m "feat(hero): implementar sección principal con animación"
git commit -m "feat(api): crear endpoint de autenticación"
git commit -m "feat(contact): agregar formulario de contacto"
```

### fix — Corrección de Bugs

Corrige un bug o comportamiento inesperado.

```bash
git commit -m "fix(navbar): corregir menú desplegable en móvil"
git commit -m "fix(api): manejar error 404 en endpoint de usuarios"
```

### style — Cambios de Estilo

Cambios de formato, espaciado, CSS. No afecta la lógica.

```bash
git commit -m "style(hero): centrar contenido en pantallas grandes"
git commit -m "style(global): actualizar paleta de colores"
```

### refactor — Refactorización

Reorganización del código sin cambiar su comportamiento externo.

```bash
git commit -m "refactor(components): optimizar estructura de carpetas"
git commit -m "refactor(api): simplificar lógica de autenticación"
```

### docs — Documentación

Cambios solo en documentación (README, comentarios, etc.).

```bash
git commit -m "docs: actualizar README con ejemplos de commits"
git commit -m "docs(api): documentar endpoints disponibles"
```

### test — Tests

Agregar o modificar tests.

```bash
git commit -m "test(api): agregar tests para endpoint de usuarios"
```

### chore — Tareas de Mantenimiento

Cambios de configuración, dependencias, scripts. No afecta la funcionalidad.

```bash
git commit -m "chore: actualizar dependencias de npm"
git commit -m "chore(fixtures): agregar datos de prueba iniciales"
```
