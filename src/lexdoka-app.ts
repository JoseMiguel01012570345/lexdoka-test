import { LitElement, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import "./components/prosemirror-editor.js";
import "./components/canvas-form.js";
import "./components/capsule-config-offcanvas.js";
import type { VariableCapsule, CanvasCapsule } from "./types/variables.js";
import { loadFromStorage, saveToStorage } from "./lib/storage.js";
import { ContextProvider } from "@lit/context";
import { lexdokaContext } from "./context/context.js";
import { mainStyles } from "./styles/main-styles.js";
import { _showSaveSuccess } from "./lib/utils.js";

/**
 * Aplicación principal LexDoka.
 * - Dos pestañas: Documento (ProseMirror) y Formulario (Canvas).
 * - Modo Edición / Producción global.
 * - Offcanvas Bootstrap para configurar cápsulas.
 * - Persistencia en localStorage.
 */
@customElement("lexdoka-app")
export class LexDokaApp extends LitElement {
  /** Render en light DOM para que Bootstrap encuentre el offcanvas */
  createRenderRoot() {
    return this;
  }

  static readonly styles = mainStyles

  @state() private _productionMode = false;
  @state() private _activeTab: "document" | "form" = "document";
  @state() private _canvasCapsules: CanvasCapsule[] = [];
  @state() private _offcanvasCapsule: VariableCapsule | null = null;
  @state() private _proseDoc: any = null;
  @state() private _offcanvasOpen = false;
  private _provider = new ContextProvider(this, {
    context: lexdokaContext,
    initialValue: {
      saveCapsule: false,
      _offcanvasCapsule: this._offcanvasCapsule,
    },
  });
  // @state() private saveCapsule = false;

  /**
   * Maps canvas capsules to variable definitions for ProseMirror editor.
   * Extracts only the variable metadata (without position data).
   * Used to populate "Insert variable" menu in editor toolbar.
   */
  get availableCapsules(): VariableCapsule[] {
    return this._canvasCapsules.map((c) => ({
      id: c.id,
      type: c.type,
      label: c.label,
      helpText: c.helpText,
      value: c.value,
    }));
  }

  constructor() {
    super();
    const stored = loadFromStorage();
    this._proseDoc = stored.proseMirrorDoc;
    this._canvasCapsules = stored.canvasCapsules ?? [];
  }

  /**
   * Saves current app state to localStorage and shows success toast.
   * Extracts ProseMirror document from editor view (if available).
   * Persists both canvasCapsules and proseMirrorDoc in JSON format.
   */
  private _saveToStorage() {
    const proseDoc = this._proseDoc?.state?.doc;
    saveToStorage({
    proseMirrorDoc: proseDoc,
    canvasCapsules: this._canvasCapsules,
    });
    // show success popup
    _showSaveSuccess("Guardado");
  }

  /**
   * Handles capsule selection from editor or canvas.
   * Opens offcanvas panel for configuration via Bootstrap Offcanvas API.
   * Uses requestAnimationFrame to ensure offcanvas element is in DOM before initialization.
   * @param e CustomEvent with capsule detail from prosemirror-editor or canvas-form
   */
  private _onCapsuleSelect(
    e: CustomEvent<{ capsule: VariableCapsule | CanvasCapsule }>,
  ) {
    this._offcanvasCapsule = e.detail.capsule;
    this._offcanvasOpen = true;
    this.requestUpdate();
    requestAnimationFrame(() => {
      const offcanvasEl = this.querySelector(
        "capsule-config-offcanvas .offcanvas",
      );
      if (
        offcanvasEl &&
        typeof (window as any).bootstrap?.Offcanvas !== "undefined"
      ) {
        new (window as any).bootstrap.Offcanvas(offcanvasEl).show();
      }
    });
  }

  /**
   * Persists capsule configuration changes from offcanvas to state and storage.
   * Updates all matching capsules in _canvasCapsules array immutably.
   * Updates shared context so ProseMirror editor can sync node attributes.
   * Finally saves to localStorage and closes offcanvas.
   */
  private _onCapsuleConfigSave(
    e: CustomEvent<{
      id: string;
      label: string;
      helpText: string;
      type: string;
    }>,
  ) {
    const { id, label, helpText, type } = e.detail;
    // Update capsule in canvas array
    this._canvasCapsules = this._canvasCapsules.map((c) =>
      c.id === id
        ? { ...c, label, helpText, type: type as CanvasCapsule["type"] }
        : c,
    );
    this._offcanvasOpen = false;
    // Publish to context so other components (prosemirror-editor) react
    this._provider.setValue(
      {
        ...this._provider.value,
        saveCapsule: true,
        _offcanvasCapsule: {
          id,
          label,
          helpText,
          type,
        },
      },
      true,
    );

    this._offcanvasCapsule = null;
    this._saveToStorage();
  }

  /**
   * Closes offcanvas and clears selected capsule from state.
   * Called when user clicks "Cancel" or close button on offcanvas.
   */
  private _onCapsuleConfigClose() {
    this._offcanvasCapsule = null;
    this._offcanvasOpen = false;
  }

  /**
   * Handles capsule list changes (add, delete, reorder) from canvas-form.
   * Updates state immutably; storage auto-saved on value-change or explicit save.
   */
  private _onCapsulesChange(e: CustomEvent<{ capsules: CanvasCapsule[] }>) {
    this._canvasCapsules = e.detail.capsules;
  }

  /**
   * Syncs capsule value changes from production mode inputs back to canvas capsules.
   * Triggered by input events in prosemirror-editor (production) or canvas-form (production).
   * Saves to storage immediately for persistence.
   */
  private _onCapsuleValueChange(e: CustomEvent<{ id: string; value: string }>) {
    const { id, value } = e.detail;
    this._canvasCapsules = this._canvasCapsules.map((c) =>
      c.id === id ? { ...c, value } : c,
    );
    this._saveToStorage();
  }

  render() {
    return html`
      <style>
        ${LexDokaApp.styles}
      </style>
      <header class="app-header">
        <div class="container">
          <div
            class="d-flex justify-content-between align-items-center flex-wrap gap-3"
          >
            <h1 class="h4 mb-0">LexDoka Variables en documento y formulario</h1>
            <div class="mode-toggle">
              <span class="small">Modo:</span>
              <div class="btn-group" role="group">
                <input
                  type="radio"
                  class="btn-check"
                  name="mode"
                  id="mode-edit"
                  ?checked=${!this._productionMode}
                  @change=${() => {
                    this._productionMode = false;
                  }}
                />
                <label class="btn btn-outline-light btn-sm" for="mode-edit"
                  >Edición</label
                >
                <input
                  type="radio"
                  class="btn-check"
                  name="mode"
                  id="mode-prod"
                  ?checked=${this._productionMode}
                  @change=${() => {
                    this._productionMode = true;
                  }}
                />
                <label class="btn btn-outline-light btn-sm" for="mode-prod"
                  >Producción</label
                >
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="container py-4">
        <ul class="nav nav-tabs">
          <li>
            <button
              class="nav-link ${this._activeTab === "document" ? "active" : ""}"
              type="button"
              @click=${() => {
                this._activeTab = "document";
              }}
            >
              <i class="bi bi-file-text me-1"></i> Documento
            </button>
          </li>
          <li>
            <button
              class="nav-link ${this._activeTab === "form" ? "active" : ""}"
              type="button"
              @click=${() => {
                this._activeTab = "form";
              }}
            >
              <i class="bi-ui-checks me-1"></i> Formulario (Canvas)
            </button>
          </li>
        </ul>

        <div>
          ${this._activeTab === "document"
            ? html`
                <div class="main-body">
                  <div class="card-body">
                    <h6>Editor de documento (ProseMirror)</h6>
                    <p class="small text-muted">
                      ${this._productionMode
                        ? "Modo producción: el texto es estático; solo puedes rellenar las cápsulas de variables."
                        : "Modo edición: escribe texto, aplica formato e inserta variables desde el botón \"Insert\"."}
                    </p>
                    <prosemirror-editor
                      .productionMode=${this._productionMode}
                      .initialDoc=${this._proseDoc}
                      .availableCapsules=${this.availableCapsules}
                      @capsule-select=${this._onCapsuleSelect}
                      @editor-ready=${(e)=>{
                        if(e.detail && e.detail.view) {
                          this._proseDoc = e.detail.view;
                        }
                      }}
                    ></prosemirror-editor>
                    ${!this._productionMode
                      ? html`
                          <div class="mt-2">
                            <button
                              type="button"
                              class="btn btn-primary btn-sm"
                              @click=${this._saveToStorage}
                            >
                              <i class="bi bi-save"></i> Guardar
                            </button>
                          </div>
                        `
                      : nothing}
                  </div>
                </div>
              `
            : html`
                <div class="main-body">
                  <div class="card-body">
                    <h6>Formulario interactivo (Canvas)</h6>
                    <p class="small text-muted">
                      ${this._productionMode
                        ? "Modo producción: solo puedes escribir en las cápsulas."
                        : "Modo edición: añade variables, arrastra para posicionar y haz clic para configurar. Elimina con la X."}
                    </p>
                    <canvas-form
                      .productionMode=${this._productionMode}
                      .capsules=${this._canvasCapsules}
                      @capsule-select=${this._onCapsuleSelect}
                      @capsules-change=${this._onCapsulesChange}
                      @capsule-value-change=${this._onCapsuleValueChange}
                    ></canvas-form>
                    ${!this._productionMode
                      ? html`
                          <div class="mt-2">
                            <button
                              type="button"
                              class="btn btn-primary btn-sm"
                              @click=${this._saveToStorage}
                            >
                              <i class="bi bi-save"></i> Guardar
                            </button>
                          </div>
                        `
                      : nothing}
                  </div>
                </div>
              `}
        </div>
      </main>

      <capsule-config-offcanvas
        .open=${this._offcanvasOpen}
        .capsule=${this._offcanvasCapsule}
        @capsule-config-save=${this._onCapsuleConfigSave}
        @capsule-config-close=${this._onCapsuleConfigClose}
      ></capsule-config-offcanvas>
    `;
  }
}
