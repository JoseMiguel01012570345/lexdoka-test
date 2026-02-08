import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { EditorState, Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { proseMirrorSchema } from "../lib/prosemirror-schema.js";
import type { VariableCapsule } from "../types/variables.js";
import { ContextConsumer, ContextProvider } from "@lit/context";
import { lexdokaContext } from "../context/context.js";
import { exampleSetup, buildMenuItems } from "prosemirror-example-setup";
import {MenuItem} from "prosemirror-menu"
import {DOMParser, NodeSpec} from "prosemirror-model"
import { editorStyles } from "../styles/editor-styles.js";

@customElement("prosemirror-editor")
export class ProseMirrorEditor extends LitElement {
  static readonly styles = editorStyles

  @property({ type: Boolean }) productionMode = false;
  @property({ type: Object }) initialDoc: unknown = null;
  @property({ type: Array }) availableCapsules: VariableCapsule[] = [];
  @state() private _view: EditorView | null = null;
  @state()
  private lexDokaConsumer = new ContextConsumer(this, {
    context: lexdokaContext,
    subscribe: true,
  });
  @state()
  private lexDokaProvider = new ContextProvider(this, {
    context: lexdokaContext,
  });
  @property() capsule = proseMirrorSchema.nodes.variableCapsule

  /** Doc a usar en la próxima creación del editor (tras cambio de modo) */
  private _nextDoc: unknown = null;

  /**
   * Dispatches capsule-select event to parent components.
   * Bubbles and composes so event crosses light/shadow DOM boundary.
   * Parent (lexdoka-app) listens and opens offcanvas config panel.
   */
  dispatchCapsuleSelect(capsule: VariableCapsule) {
    this.dispatchEvent(
      new CustomEvent("capsule-select", {
        detail: { capsule },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Updates the editor view with a new document from JSON.
   * Parses JSON using current schema and creates new EditorState.
   * Handles schema mismatches gracefully by logging error without crashing.
   * @param json JSON representation of ProseMirror document (from storage or parent)
   */
  setDocFromJSON(json: unknown) {
    if (!this._view || json == null) return;
    try {
      const doc = this._view.state.schema.nodeFromJSON(json);
      const state = EditorState.create({
        doc,
        plugins: this._buildPlugins(),
      });
      this._view.updateState(state);
    } catch (e) {
      console.error("Schema Mismatch Error on setting doc from JSON:", e.message);
    }
  }

  /**
   * Constructs ProseMirror plugins including example setup and custom click handler.
   * Handles capsule selection in edit mode by dispatching capsule-select event.
   * Merges exampleSetup menu with custom insert capsule menu items.
   */
  private _buildPlugins(menu?: any): Plugin[] {
    if(!menu)
      menu = this.buildMenuItems()

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

  /**
   * Locks or unlocks page scrolling by adding/removing modal-open class to body.
   * Compensates scrollbar width to prevent layout shift when modal appears.
   * @param isLocked If true, locks scroll; if false, unlocks scroll
   */
  toggleBodyScroll(isLocked: boolean) {
    if (isLocked) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.classList.add('modal-open');
      console.log({body: document.body})
    } else {
      document.body.style.paddingRight = '0px';
      document.body.classList.remove('modal-open');
    }
  }

  /**
   * Wraps a ProseMirror command to toggle body scroll lock when image dialog opens/closes.
   * Prevents scrolling while user is composing an image URL.
   * @param originalCommand The original command function to wrap
   * @returns Wrapped command that manages body scroll state
   */
  wrapImageCommand(originalCommand) {
    return (state, dispatch, view) => {
      const result = originalCommand(state, dispatch, view);
      if(document.querySelector('.ProseMirror-prompt')){
        this.toggleBodyScroll(true);
      }
      else{
        this.toggleBodyScroll(false);
      }
      return result;
    };
  }

  /**
   * Builds custom menu items with all available capsules as insert options.
   * Wraps image command to handle body scroll locking when image dialog opens.
   * Dynamically creates a MenuItem for each capsule (text, date, richtext).
   * @returns Menu object with insertMenu.content containing all custom capsule items
   */
  buildMenuItems() {
    let menu = buildMenuItems(proseMirrorSchema)

    const imageItem = menu.insertMenu.content.find(item => item.spec.title === "Insert image");

    if (imageItem) {
      const originalRun = imageItem.spec.run;
      imageItem.spec.run = this.wrapImageCommand(originalRun);
    }
    
    this.availableCapsules.forEach(cap =>{
    let insertCapsule = this._insertCapsule.bind(this)
  
    return menu.insertMenu.content.push(new MenuItem({
      title: "Insert " + cap.label + `(${cap.type})`,
      label: cap.label,
      enable: (state) => insertCapsule(cap.id)(state),
      run: (state, dispatch) => insertCapsule(cap.id)(state, dispatch)
    }))})
    return menu;
  }

  /**
   * Creates editor state from various document sources with fallback chain.
   * Priority: _nextDoc (from mode switch) > initialDoc (parent prop) > DOM content > empty doc
   * Handles schema mismatches by catching errors and logging them.
   * @returns New EditorState with configured plugins and document
   */
  private _createState(): EditorState {
    const docSource = this._nextDoc ?? this.initialDoc;
    
    this._nextDoc = null;
    const plugins = this._buildPlugins();
    // Try to restore from EditorView state (mode switch scenario)
    if (docSource instanceof EditorView) {
        try {
            const doc = proseMirrorSchema.nodeFromJSON(docSource.state.doc.toJSON());
            return EditorState.create({ doc, plugins });
      } catch (e) {
          console.error("Schema Mismatch Error on create state:", e.message);
        }
      }
    // Try to restore from JSON doc (from storage/props)
    if (docSource) {
      try {
          const doc = proseMirrorSchema.nodeFromJSON(docSource);
          return EditorState.create({ doc, plugins });
      } catch (e) {
          console.error("Schema Mismatch Error on create state:", e.message);
        }
      }

    // Fallback: parse existing DOM content if available
    let content = this.renderRoot.querySelector("#content") as HTMLElement | null
    if (!content) {
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

  /**
   * Mounts (or remounts) the ProseMirror editor view into the DOM.
   * Clears #editor element, creates editor state, and instantiates EditorView.
   * In production mode, uses custom node views for variableCapsule inputs.
   * In edit mode, capsule is read-only and clickable for config.
   */
  private _mountView() {
    const content = this.renderRoot.querySelector(
      "#editor",
    ) as HTMLDivElement;
    if (!content) return;
    content.innerHTML = "";
    let state = null
    state = this._createState();
    this._view = new EditorView(content, {
      state,
      editable: () => !this.productionMode,
      nodeViews: (this.productionMode
        ? this._productionNodeViews()
        : {}) as Record<string, import("prosemirror-view").NodeViewConstructor>,
    });
  }

  /**
   * Creates custom node views for production mode.
   * Renders each variableCapsule as an editable input/textarea instead of static text.
   * Handles three input types: text (input), date (input type=date), richText (textarea).
   * Updates node attributes when user inputs, triggering transaction dispatch.
   */
  private _productionNodeViews() {
    const ret = {
      /**
       * Node view for variableCapsule in production mode.
       * Creates an input element (text/date/textarea) that syncs changes to the node.
       * @param node The variableCapsule node with id, type, label, helpText, value
       * @param view EditorView instance for dispatching transactions
       * @param getPos Function to get current node position in document
       * @returns Object with DOM element and update/ignoreMutation handlers
       */
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
        let tag = null
        if (type === "richText") {
          const textarea = document.createElement("textarea");
          tag = textarea
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
            view.dispatch(tr);
          });
          span.appendChild(textarea);
        } else {
          const input = document.createElement("input");
          tag = input
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
          span.appendChild(input);
        }
        return {
           dom: span,
          /**
           * Handles updates to the node view when the underlying node changes.
           * Prevents cursor jumping by only updating input value if it differs.
           * Returns true to tell ProseMirror: don't redraw, just update this handler.
           */
          update: (newNode: NodeSpec) => {
            if (newNode.type !== node.type) return false;
            // Update local reference to node so getPos() stays current
            node = newNode; 
            
            // Update the input value only if it's different from the current one
            // (This prevents the cursor from jumping to the end)
            if (tag && tag.value !== newNode.attrs.value) {
              tag.value = newNode.attrs.value || "";
            }
            return true; // Tells ProseMirror NOT to re-draw the whole node
          },
          // Ensure ProseMirror ignores typing inside the input
          ignoreMutation: () => true

         };
      },
    };
    return ret;
  }

  /**
   * Updates attributes of a variableCapsule node throughout the document.
   * Searches all nodes for matching capsule id and updates label, helpText, type.
   * Used when user saves capsule configuration from offcanvas.
   * @param id Capsule id to search for
   * @param label New label text
   * @param helpText New help text
   * @param type New variable type (text/date/richText)
   */
  editCapsule(id: string, label: string, helpText: string, type: string) {
  if (!this._view) return;

  const { state, dispatch } = this._view;
  const tr = state.tr;
  let found = false;

  // Iterate through all nodes in the document
  state.doc.descendants((node, pos) => {
    if (node.type.name === "variableCapsule" && node.attrs.id === id) {
      // Update only the attributes, keeping the node structure intact
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        label,
        helpText,
        type
      });
      found = true;
    }
  });

  if (found) {
    dispatch(tr);
  }
}

  /**
   * Rebuilds editor plugins and state when available capsules change.
   * Regenerates menu items for all capsules and reconfigures editor state.
   * Called after capsule configuration changes to reflect new capsule options.
   */
  updateSchema(){
    const menu = buildMenuItems(proseMirrorSchema);
    this.availableCapsules.forEach(cap => {
      menu.insertMenu.content.push(new MenuItem({
        title: "Insert " + cap.label,
        label: cap.label,
        enable: (state) => this._insertCapsule(cap.id, "enable")(state),
        run: (state, dispatch) => this._insertCapsule(cap.id, "run")(state, dispatch)
      }));
    });

    const newPlugins = this._buildPlugins(menu);
    const newState = this._view!.state.reconfigure({ plugins: newPlugins });
    this._view!.updateState(newState);
  }

  /**
   * Handles property changes and triggers necessary lifecycle updates.
   * - Mode toggle: preserves document JSON, destroys view, remounts in new mode
   * - InitialDoc change: reloads document from parent prop
   * - Capsule config save (via context): updates node attributes and rebuilds menu
   */
  updated(changed: Map<string, unknown>) {
    // Handle mode switch: save doc JSON, destroy, and remount view
    if (changed.has("productionMode") && this._view) {
      this._nextDoc = this._view.state.doc.toJSON();
      this._view.destroy();
      this._view = null;
      this._mountView();
    }
    // Reload document if initialDoc prop changed
    if (
      changed.has("initialDoc") &&
      !this.initialDoc &&
      !changed.has("productionMode")
    ) {
      this.setDocFromJSON(this.initialDoc);
    }
    // React to capsule config save from context (via offcanvas)
    if (this.lexDokaConsumer.value.saveCapsule) {
      let id = this.lexDokaConsumer.value._offcanvasCapsule!.id;
      let label = this.lexDokaConsumer.value._offcanvasCapsule!.label;
      let helpText = this.lexDokaConsumer.value._offcanvasCapsule!.helpText;
      let type = this.lexDokaConsumer.value._offcanvasCapsule!.type;
      this.editCapsule(id, label, helpText, type);
      this.dispatchEvent(new CustomEvent("modified-capsule"));
      this.updateSchema();
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
  
  /**
   * Creates a command function to insert a variableCapsule at cursor position.
   * Emits editor-ready event so parent can track view instance.
   * Returns (state, dispatch) => boolean to match ProseMirror command signature.
   * @param id Capsule id to insert
   * @returns Command function that inserts the capsule node
   */
  private _insertCapsule(id: string) {
    this.dispatchEvent(new CustomEvent("editor-ready", {
      detail: { view: this._view },
      bubbles: true,
      composed: true,
    }));

    return (state, dispatch) => {
    let capsule = this.availableCapsules.find((cap) => cap.id == id);
    if (!this._view || !capsule || this.productionMode) return false;
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
