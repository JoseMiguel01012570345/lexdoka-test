# LexDoka – Prueba técnica Desarrollador Senior Frontend

Aplicación que implementa **variables** en dos visualizaciones: un **documento editable (ProseMirror)** y un **formulario interactivo (Canvas)**, usando **Lit**, **ProseMirror**, **Bootstrap** y persistencia en **localStorage**.

## Resumen rápido

- **Modo Edición**: crear/editar variables en el formulario (Canvas) y editar el documento (ProseMirror). Las cápsulas se pueden posicionar, configurar y eliminar.
- **Modo Producción**: rellenar las cápsulas (inputs/textarea/date) sin poder mover ni borrar; el editor de texto no es editable.
- **Fuente de verdad**: las cápsulas definidas en el Canvas son la única fuente de variables que pueden insertarse en el documento.

## Requisitos

- Node.js 18+
- npm

## Instalación y uso

Instala dependencias y levanta el servidor de desarrollo:

```bash
npm install
npm run dev
```

Abre en el navegador la URL que indique Vite (por ejemplo http://localhost:5173).

Build y previsualización de producción:

```bash
npm run build
npm run preview
```

Los scripts disponibles están definidos en `package.json`:

- `dev`: arranca Vite en modo desarrollo
- `build`: transpila TypeScript y genera el build de Vite
- `preview`: sirve el build para previsualización

## Cómo probar (flujo básico)

1. **Modo Edición**

   - Pestaña Formulario (Canvas): pulsa "Texto", "Fecha" o "Texto enriquecido" para añadir cápsulas. Arrastra para mover. Clic en una cápsula → se abre el offcanvas para editar etiqueta, ayuda y tipo. Icono X para eliminar.
   - Pestaña Documento: escribe en el editor. Usa "Insertar" para desplegar la lista de variables (las variables son las definidas en el formulario). Clic en una cápsula en el texto → offcanvas para configurarla.
   - "Guardar" persiste la configuración y el contenido en `localStorage`.

2. **Modo Producción**

   - Cambia el toggle a "Producción".
   - Documento: el texto no es editable; sólo se pueden rellenar las cápsulas (inputs/textarea/date). El texto de ayuda se muestra como tooltip.
   - Formulario: sólo se pueden rellenar las cápsulas; no se puede mover ni borrar.
   - Los valores se guardan al cambiar.

## Decisiones de diseño (resumen)

- **Variables únicas en el formulario**: las cápsulas del Canvas son la fuente de verdad. En el Documento sólo se pueden insertar variables que existan en el formulario (mismo `id`).
- **Esquema ProseMirror**: se extiende el esquema básico con un nodo `variableCapsule` (inline, atom) con atributos `id`, `type`, `label`, `helpText`, `value`.
- **Canvas sin <canvas>**: el formulario Canvas usa posicionamiento absoluto en un contenedor (no la API Canvas 2D), para simplificar CRUD y arrastre manteniendo HTML accesible.
- **App en light DOM**: el componente raíz (`lexdoka-app`) usa `createRenderRoot()` devolviendo `this` para que el offcanvas de Bootstrap esté en el DOM principal y el JS de Bootstrap pueda controlarlo.
- **Persistencia**: clave `lexdoka_app_data` en `localStorage` con `proseMirrorDoc` (JSON del documento) y `canvasCapsules` (array de cápsulas con posición y configuración).

## Archivos clave

- **Entrada / App**: [src/main.ts](src/main.ts#L1) · [src/lexdoka-app.ts](src/lexdoka-app.ts#L1)
- **Componentes**: [src/components/prosemirror-editor.ts](src/components/prosemirror-editor.ts#L1) · [src/components/canvas-form.ts](src/components/canvas-form.ts#L1) · [src/components/capsule-config-offcanvas.ts](src/components/capsule-config-offcanvas.ts#L1)
- **Tipos y utilidades**: [src/types/variables.ts](src/types/variables.ts#L1) · [src/lib/storage.ts](src/lib/storage.ts#L1) · [src/lib/prosemirror-schema.ts](src/lib/prosemirror-schema.ts#L1)

## Estructura del proyecto

```
src/
  main.ts                 # Entrada; registra la app
  lexdoka-app.ts          # App principal (pestañas, modo, offcanvas, guardar)
  types/
    variables.ts          # VariableType, VariableCapsule, CanvasCapsule, createCapsule
  lib/
    storage.ts            # loadFromStorage / saveToStorage
    prosemirror-schema.ts # Esquema con nodo variableCapsule
  components/
    prosemirror-editor.ts # Editor ProseMirror (edición/producción, cápsulas)
    canvas-form.ts        # Formulario con cápsulas (CRUD, arrastre, producción)
    capsule-config-offcanvas.ts  # Panel Bootstrap para configurar cápsula
```

## Tecnologías

- **Lit** (lit) – componentes web
- **ProseMirror** (model, state, view, schema-basic, history, keymap, commands, inputrules)
- **Bootstrap 5** – estilos y offcanvas
- **Vite** – build y dev
- **TypeScript**
