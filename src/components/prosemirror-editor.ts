import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { EditorState, Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { proseMirrorSchema } from "../lib/prosemirror-schema.js";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import type { VariableCapsule } from "../types/variables.js";
import { ContextConsumer, ContextProvider } from "@lit/context";
import { lexdokaContext } from "../context/context.js";
import { exampleSetup } from "prosemirror-example-setup";

/**
 * Editor ProseMirror con dos modos:
 * - Edición: modificar texto e insertar/configurar cápsulas
 * - Producción: texto estático, solo rellenar cápsulas
 */
@customElement("prosemirror-editor")
export class ProseMirrorEditor extends LitElement {
  static styles = css`
    .editor-wrap {
      border: 1px solid var(--bs-border-color);
      border-radius: 0.375rem;
      padding: 0.75rem;
      min-height: 120px;
      background: #fff;
    }
    .editor-wrap.readonly .ProseMirror {
      cursor: text;
    }
    .ProseMirror {
      outline: none;
      min-height: 100px;
      border: 1px solid #f0f0f0;
      outline: none;
    }
    .pm-content {
      background: white;
    }
    .ProseMirror-menubar {
      background: #f0f0f0;
      display: flex;
      align-items: start;
      height: 30px;
    }
    .ProseMirror-menubar use {
      width: 10px;
      heigth: 10px;
    }

    .ProseMirror-menuitem {
      margin-right: 4px;
      display: inline-block;
    }
    .ProseMirror p {
      margin-bottom: 1em;
      min-height: 1em; /* Crucial for empty paragraphs */
    }
    .ProseMirror-trailingBreak {
      display: inline;
    }
    .variable-capsule {
      display: inline-flex;
      align-items: center;
      padding: 0.15em 0.5em;
      margin: 0 2px;
      border-radius: 4px;
      background: #e7f1ff;
      border: 1px solid #0d6efd;
      color: #0d6efd;
      font-size: 0.9em;
      cursor: pointer;
    }
    .variable-capsule[data-type="date"] {
      background: #fff3cd;
      border-color: #ffc107;
      color: #856404;
    }
    .variable-capsule[data-type="richText"] {
      display: block;
      width: 100%;
      margin: 0.5em 0;
      min-height: 2em;
    }
    .variable-capsule.production-input {
      background: #f8f9fa;
      border-style: dashed;
      cursor: text;
    }
    .variable-capsule.production-input input,
    .variable-capsule.production-input textarea {
      border: none;
      background: transparent;
      width: 100%;
      font: inherit;
      padding: 0;
    }
    .toolbar {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }
  `;

  @property({ type: Boolean }) productionMode = false;
  @property({ type: Object }) initialDoc: unknown = null;
  @property({ type: Array }) availableCapsules: VariableCapsule[] = [];
  @state() private _view: EditorView | null = null;
  @property()
  private lexDokaConsumer = new ContextConsumer(this, {
    context: lexdokaContext,
    subscribe: true,
  });
  private lexDokaProvider = new ContextProvider(this, {
    context: lexdokaContext,
  });

  /** Doc a usar en la próxima creación del editor (tras cambio de modo) */
  private _nextDoc: unknown = null;

  /** Emite cuando se selecciona una cápsula para abrir offcanvas */
  dispatchCapsuleSelect(capsule: VariableCapsule) {
    this.dispatchEvent(
      new CustomEvent("capsule-select", {
        detail: { capsule },
        bubbles: true,
        composed: true,
      }),
    );
  }

  setDocFromJSON(json: unknown) {
    if (!this._view || json == null) return;
    try {
      const doc = this._view.state.schema.nodeFromJSON(json);
      const state = EditorState.create({
        doc,
        plugins: this._buildPlugins(),
      });
      this._view.updateState(state);
    } catch (_) {
      // ignore invalid json
    }
  }

  private _buildPlugins() {
    const component = this;
    return [
      // history(),
      // keymap(baseKeymap),
      // keymap({
      //   "Mod-z": undo,
      //   "Mod-y": redo,
      //   "Mod-Shift-z": redo,
      // }),
      ...exampleSetup({ schema: proseMirrorSchema }),
      // Plugin para hacer clic en cápsula y abrir config (solo en edición)
      new Plugin({
        props: {
          handleClick(_view, _pos, event) {
            if (component.productionMode) return false;
            const target = (event.target as HTMLElement).closest(
              ".variable-capsule",
            );
            if (!target) return false;
            const id = target.getAttribute("data-capsule-id");
            const capsule = component.availableCapsules.find(
              (c) => c.id === id,
            );
            if (capsule) {
              component.dispatchCapsuleSelect(capsule);
              return true;
            }
            return false;
          },
        },
      }),
    ];
  }

  private _createState(): EditorState {
    const plugins = this._buildPlugins();
    const docSource = this._nextDoc ?? this.initialDoc;
    this._nextDoc = null;
    // if (docSource) {
    //   console.log("loading former schema");
    //   try {
    //     const doc = proseMirrorSchema.nodeFromJSON(docSource);
    //     return EditorState.create({ doc, plugins });
    //   } catch (e) {
    //     console.error("Schema Mismatch Error:", e.message);
    //   }
    // }
    return EditorState.create({
      doc: proseMirrorSchema.topNodeType.createAndFill(
        null,
        undefined,
        undefined,
      )!,
      plugins,
    });
  }

  firstUpdated() {
    this._mountView();
  }

  private _mountView() {
    const content = this.renderRoot.querySelector(
      ".pm-content",
    ) as HTMLDivElement;
    if (!content) return;
    content.innerHTML = "";
    const state = this._createState();
    this._view = new EditorView(content, {
      state,
      editable: () => !this.productionMode,
      nodeViews: (this.productionMode
        ? this._productionNodeViews()
        : {}) as Record<string, import("prosemirror-view").NodeViewConstructor>,
    });
  }

  private _productionNodeViews() {
    const ret = {
      variableCapsule(
        node: { attrs: Record<string, string> },
        view: EditorView,
        getPos: () => number | undefined,
      ) {
        const span = document.createElement("span");
        span.className = "variable-capsule production-input";
        span.setAttribute("data-capsule-id", node.attrs.id);
        span.title = node.attrs.helpText || node.attrs.label;
        const type = node.attrs.type;
        if (type === "richText") {
          const textarea = document.createElement("textarea");
          textarea.placeholder = node.attrs.label;
          textarea.value = node.attrs.value || "";
          textarea.rows = 3;
          textarea.addEventListener("input", () => {
            const pos = getPos();
            if (pos == null) return;
            const tr = view.state.tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              value: textarea.value,
            });
            // TODO: When the transition occurs, the component unselects
            // view.dispatch(tr);
          });
          span.appendChild(textarea);
        } else {
          const input = document.createElement("input");
          input.type = type === "date" ? "date" : "text";
          input.placeholder = node.attrs.label;
          input.value = node.attrs.value || "";
          input.addEventListener("input", () => {
            const pos = getPos();
            if (pos == null) return;
            const tr = view.state.tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              value: input.value,
            });
            view.dispatch(tr);
          });
          // TODO: When the transition occurs, the component unselects
          span.appendChild(input);
        }
        return { dom: span };
      },
    };
    return ret;
  }

  editCapsule(label: string, helpText: string, type: string) {
    const nodes = this._view!.state.doc.content.content[0].content.content;
    let index = 0;
    nodes.forEach((node) => {
      if (
        node &&
        node.type.name === "variableCapsule" &&
        node.attrs.type === type
      ) {
        const updatedNode = node.type.create(
          {
            ...node.attrs,
            label,
            helpText,
            type,
          },
          node.content,
          node.marks,
        );
        const { state, dispatch } = this._view!;
        const tr = state.tr.replaceWith(index + 1, index + 2, updatedNode);
        dispatch(tr);
      }
      if (node.type.name !== "variableCapsule") {
        index += node.text!.length;
      } else index += 1;
    });
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("productionMode") && this._view) {
      this._nextDoc = this._view.state.doc.toJSON();
      this._view.destroy();
      this._view = null;
      this._mountView();
    }
    if (
      changed.has("initialDoc") &&
      this._view &&
      this.initialDoc &&
      !changed.has("productionMode")
    ) {
      this.setDocFromJSON(this.initialDoc);
    }

    if (this.lexDokaConsumer.value.saveCapsule) {
      let label = this.lexDokaConsumer.value._offcanvasCapsule!.label;
      let helpText = this.lexDokaConsumer.value._offcanvasCapsule!.helpText;
      let type = this.lexDokaConsumer.value._offcanvasCapsule!.type;
      this.editCapsule(label, helpText, type);
      this.dispatchEvent(new CustomEvent("modified-capsule"));
      this.lexDokaProvider.setValue({
        saveCapsule: false,
        _offcanvasCapsule: null,
      });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._view?.destroy();
    this._view = null;
  }

  render() {
    return html`
      <div class="editor-wrap ${this.productionMode ? "readonly" : ""}">
        ${!this.productionMode
          ? html`
              <div class="toolbar">
                ${this.availableCapsules.length != 0
                  ? html`<div class="mb-3">
                      <label class="form-label">Elegir variable:</label>
                      <select
                        class="form-select"
                        @change=${(e: Event) => {
                          e.preventDefault();
                          const target = e.target as HTMLSelectElement;
                          const selectedValue = target.value;
                          this._insertCapsule(selectedValue);
                        }}
                      >
                        ${this.availableCapsules.map(
                          (c) => html`
                          <option value=${c.id}>
                            ${c.label} (${c.type})</a
                          </option>
                        `,
                        )}
                      </select>
                    </div>`
                  : ""}
              </div>
            `
          : nothing}

        <div class="pm-content"></div>
      </div>
    `;
  }

  private _insertCapsule(id: string) {
    let capsule = this.availableCapsules.find((cap) => cap.id == id);
    if (!this._view || !capsule) return;
    const node = proseMirrorSchema.nodes.variableCapsule.create({
      id: capsule.id,
      type: capsule.type,
      label: capsule.label,
      helpText: capsule.helpText,
      value: capsule.value,
    });
    const { state, dispatch } = this._view;
    const { from } = state.selection;
    const tr = state.tr.insert(from, node);
    dispatch(tr);
  }
}
