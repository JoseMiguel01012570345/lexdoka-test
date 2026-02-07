import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { VariableCapsule } from "../types/variables.js";
import type { VariableType } from "../types/variables.js";

/**
 * Offcanvas de Bootstrap para configurar una cápsula:
 * label, texto de ayuda (tooltip en producción), tipo.
 */
@customElement("capsule-config-offcanvas")
export class CapsuleConfigOffcanvas extends LitElement {
  /** Render en light DOM para que Bootstrap pueda controlar el offcanvas */
  createRenderRoot() {
    return this;
  }

  static styles = css`
    :host {
      display: contents;
    }
  `;

  @property({ type: Boolean }) open = false;
  @property({ type: Object }) capsule: VariableCapsule | null = null;
  @state() private _label = "";
  @state() private _helpText = "";
  @state() private _type: VariableType = "text";

  updated(changed: Map<string, unknown>) {
    if (changed.has("capsule") && this.capsule) {
      this._label = this.capsule.label;
      this._helpText = this.capsule.helpText;
      this._type = this.capsule.type;
    }
  }

  private _save() {
    if (!this.capsule) return;
    this.dispatchEvent(
      new CustomEvent("capsule-config-save", {
        detail: {
          id: this.capsule.id,
          label: this._label,
          helpText: this._helpText,
          type: this._type,
        },
        bubbles: true,
        composed: true,
      }),
    );
    this._close();
  }

  private _close() {
    this.dispatchEvent(
      new CustomEvent("capsule-config-close", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    if (!this.capsule) return html`<div></div>`;

    return html`
      <div
        class="offcanvas offcanvas-end"
        tabindex="-1"
        id="capsule-config-offcanvas"
        aria-labelledby="offcanvasCapsuleLabel"
      >
        <div class="offcanvas-header">
          <h5 class="offcanvas-title" id="offcanvasCapsuleLabel">
            Configurar variable
          </h5>
          <button
            type="button"
            class="btn-close"
            aria-label="Cerrar"
            @click=${this._close}
          ></button>
        </div>
        <div class="offcanvas-body">
          <div class="mb-3">
            <label class="form-label">Etiqueta (Label)</label>
            <input
              type="text"
              class="form-control"
              .value=${this._label}
              @input=${(e: Event) => {
                this._label = (e.target as HTMLInputElement).value;
              }}
              placeholder="Nombre de la variable"
            />
          </div>
          <div class="mb-3">
            <label class="form-label"
              >Texto de ayuda (tooltip en producción)</label
            >
            <textarea
              class="form-control"
              rows="2"
              .value=${this._helpText}
              @input=${(e: Event) => {
                this._helpText = (e.target as HTMLTextAreaElement).value;
              }}
              placeholder="Ayuda para el usuario"
            ></textarea>
          </div>
          <div class="mb-3">
            <label class="form-label">Tipo</label>
            <select
              class="form-select"
              .value=${this._type}
              @change=${(e: Event) => {
                this._type = (e.target as HTMLSelectElement)
                  .value as VariableType;
              }}
            >
              <option value="text">Texto</option>
              <option value="date">Fecha</option>
              <option value="richText">
                Texto enriquecido (HTML) - Línea completa
              </option>
            </select>
          </div>
          <div class="d-flex gap-2 justify-content-end">
            <button
              type="button"
              class="btn btn-secondary"
              @click=${this._close}
            >
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" @click=${this._save}>
              Guardar
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
