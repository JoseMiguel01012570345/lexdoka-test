import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { EditorState, Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { proseMirrorSchema } from "../lib/prosemirror-schema.js";
import type { VariableCapsule } from "../types/variables.js";
import { ContextConsumer, ContextProvider } from "@lit/context";
import { lexdokaContext } from "../context/context.js";
import { exampleSetup, buildMenuItems } from "prosemirror-example-setup";
import {MenuItem} from "prosemirror-menu"
import {DOMParser} from "prosemirror-model"
import { editorStyles } from "../styles/editor-styles.js";


/**
 * Editor ProseMirror con dos modos:
 * - Edición: modificar texto e insertar/configurar cápsulas
 * - Producción: texto estático, solo rellenar cápsulas
 */
@customElement("prosemirror-editor")
export class ProseMirrorEditor extends LitElement {
  static readonly styles = editorStyles

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
  @property() capsule = proseMirrorSchema.nodes.variableCapsule

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

  private _buildPlugins(menu) {
    const component = this;
    return [
      ...exampleSetup({
         schema: proseMirrorSchema,
          menuContent: menu.fullMenu
        }
      ),
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
    const docSource = this._nextDoc ?? this.initialDoc;
    
    this._nextDoc = null;
    if (docSource) {
        console.log("loading former schema");
        try {
            const doc = proseMirrorSchema.nodeFromJSON(docSource);
            return EditorState.create({ doc, plugins });
      } catch (e) {
          console.error("Schema Mismatch Error:", e.message);
        }
      }
      
      let menu = buildMenuItems(proseMirrorSchema)
      
      this.availableCapsules.forEach(cap =>{
      let insertCapsule = this._insertCapsule.bind(this)

      return menu.insertMenu.content.push(new MenuItem({
        title: "Insert " + cap.label + `(${cap.type})`,
        label: cap.label,
        enable: (state) => insertCapsule(cap.id, "enable")(state),
        run: (state, dispatch) => insertCapsule(cap.id, "run")(state, dispatch)
      }))})
      const plugins = this._buildPlugins(menu);
      let content = this.renderRoot.querySelector("#content") as HTMLElement | null
      if (!content) {
        console.warn('#content not found in renderRoot; using empty fallback')
        content = document.createElement('div')
      }
      let startDoc = DOMParser.fromSchema(proseMirrorSchema).parse(content)


    return EditorState.create({
      doc:startDoc,
      plugins,
    });
  }

  firstUpdated() {
    this._mountView();
  }

  private _mountView() {
    const content = this.renderRoot.querySelector(
      "#editor",
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
        <div id="editor">
        </div>
      </div>
    `;
  }


  
  private _insertCapsule(id: string, funName) {
    return (state, dispatch) => {
    let capsule = this.availableCapsules.find((cap) => cap.id == id);
    if (!this._view || !capsule) return false;
    const node = proseMirrorSchema.nodes.variableCapsule.create({
      id: capsule.id,
      type: capsule.type,
      label: capsule.label,
      helpText: capsule.helpText,
      value: capsule.value,
    });
    
    if(dispatch){
      const { from } = state.selection;
      const tr = state.tr.insert(from, node);
      dispatch(tr);
    }

    return true}
  }
}
