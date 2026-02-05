# LexDoka – Prueba técnica Desarrollador Senior Frontend

Aplicación que implementa **variables** en dos visualizaciones: un **documento editable (ProseMirror)** y un **formulario interactivo (Canvas)**, usando **Lit**, **ProseMirror**, **Bootstrap** y persistencia en **localStorage**.

## Requisitos funcionales cubiertos

- **Variables en Lit**: tipos Texto, Fecha y Texto enriquecido (HTML, línea completa), con **label** y **texto de ayuda** (tooltip en producción).
- **ProseMirror**: editor con texto normal, formato e **inserción de cápsulas**. Modos **Edición** (editar texto y cápsulas) y **Producción** (solo rellenar cápsulas).
- **Canvas**: formulario con cápsulas como campos. Modo **Edición**: CRUD y **arrastrar** para posicionar. Modo **Producción**: solo rellenar cápsulas.
- **Offcanvas Bootstrap**: al seleccionar una cápsula en edición (documento o formulario) se abre el panel para configurar **label**, **texto de ayuda** y **tipo**.
- **Persistencia**: configuración y contenido de ambas vistas en **localStorage**.
- **UI**: Bootstrap para estilos; tooltips en producción con el texto de ayuda.

## Cómo ejecutar

### Requisitos

- Node.js 18+
- npm

### Instalación y desarrollo

```bash
npm install
npm run dev
```

Abre en el navegador la URL que indique Vite (por ejemplo `http://localhost:5173`).

### Build de producción

```bash
npm run build
npm run preview
```

## Cómo probar

1. **Modo Edición**

   - **Pestaña Formulario (Canvas)**: pulsa "Texto", "Fecha" o "Texto enriquecido" para añadir cápsulas. Arrastra para mover. Clic en una cápsula → se abre el offcanvas para editar etiqueta, ayuda y tipo. Icono X para eliminar.
   - **Pestaña Documento**: escribe en el editor. Usa "Insertar variable" o el desplegable "Elegir variable" (las variables son las definidas en el formulario). Clic en una cápsula en el texto → offcanvas para configurarla.
   - "Guardar" persiste en localStorage.

2. **Modo Producción**
   - Cambia el toggle a "Producción".
   - En **Documento**: el texto no se edita; solo puedes rellenar las cápsulas (inputs/textarea/date). El texto de ayuda se muestra como tooltip.
   - En **Formulario**: solo se pueden rellenar las cápsulas; no se puede mover ni borrar.
   - Los valores se guardan al cambiar (y con "Guardar" si se muestra).

## Decisiones de diseño

- **Variables únicas en el formulario**: las cápsulas del **Canvas** son la fuente de verdad. En el **Documento** solo se pueden insertar variables que existan en el formulario (mismo `id`). Así se evita inconsistencia entre vistas.
- **Esquema ProseMirror**: se extiende el esquema básico con un nodo `variableCapsule` (inline, atom) con atributos `id`, `type`, `label`, `helpText`, `value`.
- **Canvas sin &lt;canvas&gt;**: el “formulario Canvas” usa **posicionamiento absoluto** en un contenedor (no el API Canvas 2D), para simplificar CRUD y arrastre manteniendo HTML accesible.
- **App en light DOM**: el componente raíz (`lexdoka-app`) usa `createRenderRoot()` devolviendo `this` para que el **offcanvas de Bootstrap** esté en el DOM principal y el JS de Bootstrap pueda controlarlo.
- **Persistencia**: clave `lexdoka_app_data` en localStorage con `proseMirrorDoc` (JSON del documento) y `canvasCapsules` (array de cápsulas con posición).

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
