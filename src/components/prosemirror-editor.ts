import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { EditorState, Plugin, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { proseMirrorSchema } from "../lib/prosemirror-schema.js";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import type { VariableCapsule } from "../types/variables.js";

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
    }
    .ProseMirror p {
      margin: 0 0 0.5em;
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
      history(),
      keymap(baseKeymap),
      keymap({
        "Mod-z": undo,
        "Mod-y": redo,
        "Mod-Shift-z": redo,
      }),
      // Plugin para hacer clic en cápsula y abrir config (solo en edición)
      new Plugin({
        props: {
          handleClick(_view, _pos, event) {
            console.log("Click");
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
    if (docSource) {
      try {
        const doc = proseMirrorSchema.nodeFromJSON(docSource);
        return EditorState.create({ doc, plugins });
      } catch (_) {
        // fallback empty doc
      }
    }
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
        console.log({ node });
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
            console.log({ pos });
            const tr = view.state.tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              value: textarea.value,
            });
            // TODO: When the transition occurs, the component unselects
            view.dispatch(tr);
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
    console.log({ ret });
    return ret;
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
                <div class="dropdown">
                  <span> Elegir variable: </span>
                  <ul class="dropdown-menu">
                    ${this.availableCapsules.map(
                      (c) => html`
                        <li>
                          <a
                            class="dropdown-item"
                            href="#"
                            @click=${(e: Event) => {
                              e.preventDefault();
                              this._insertCapsule(c);
                            }}
                            >${c.label} (${c.type})</a
                          >
                        </li>
                      `,
                    )}
                  </ul>
                </div>
              </div>
            `
          : nothing}
        <hr
          style="margin: 0 0.5em 0.5em; border: none; border-top: 2px solid #ddd; height: 1px;"
        />
        <div class="pm-content"></div>
      </div>
    `;
  }

  private _insertCapsule(capsule: VariableCapsule) {
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
    console.log({ from, state });
    const tr = state.tr.insert(from, node);
    tr.setSelection(TextSelection.near(tr.doc.resolve(from + node.nodeSize)));
    dispatch(tr);
  }
}
