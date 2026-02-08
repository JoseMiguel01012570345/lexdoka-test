import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { VariableType } from "../types/variables.js";
import type { CanvasCapsule } from "../types/variables.js";
import { createCanvasCapsule } from "../types/variables.js";
import { canvasStyles } from "../styles/canvas-styles.js";

/**
 * Formulario Canvas: en edición permite CRUD y mover cápsulas;
 * en producción solo rellenar valores. Al hacer clic en una cápsula
 * en edición se abre el offcanvas de configuración.
 */
@customElement("canvas-form")
export class CanvasForm extends LitElement {

  static readonly styles = canvasStyles

  @property({ type: Boolean }) productionMode = false;
  @property({ type: Array }) capsules: CanvasCapsule[] = [];
  @state() private _dragging: { id: string; dx: number; dy: number } | null =
    null;

  /**
   * Dispatches capsule-select event to request opening config offcanvas.
   * Event bubbles so lexdoka-app parent can respond.
   */
  dispatchCapsuleSelect(capsule: CanvasCapsule) {
    this.dispatchEvent(
      new CustomEvent("capsule-select", {
        detail: { capsule },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Dispatches capsules-change event when list or positions change.
   * Triggers state update and storage save in parent.
   */
  dispatchCapsulesChange(capsules: CanvasCapsule[]) {
    this.dispatchEvent(
      new CustomEvent("capsules-change", {
        detail: { capsules },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Dispatches capsule-value-change event when production input changes.
   * Parent saves value to storage and syncs to other components.
   */
  dispatchCapsuleValueChange(id: string, value: string) {
    this.dispatchEvent(
      new CustomEvent("capsule-value-change", {
        detail: { id, value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Queries the .canvas-area container for absolute positioning reference.
   * All capsule positions are relative to this element's bounding rect.
   * @returns HTMLElement if found, null if not yet rendered
   */
  private _getCanvasArea(): HTMLElement | null {
    return this.renderRoot.querySelector(".canvas-area");
  }

  /**
   * Creates and adds a new capsule of specified type to the canvas.
   * Randomly positions within bounds. Dispatches capsules-change to parent.
   */
  private _addCapsule(type: VariableType) {
    const newCapsule = createCanvasCapsule({ type });
    const updated = [...this.capsules, newCapsule];
    this.dispatchCapsulesChange(updated);
  }

  /**
   * Removes a capsule by id from the canvas and dispatches update.
   * Stops event propagation to prevent triggering parent click handlers.
   */
  private _deleteCapsule(id: string, e: Event) {
    e.stopPropagation();
    this.dispatchCapsulesChange(this.capsules.filter((c) => c.id !== id));
  }

  /**
   * Handles pointer down event to initiate capsule drag.
   * Records starting offset (dx, dy) relative to element bounds.
   * Only activates in edit mode. Sets pointer capture for smooth dragging.
   * @param e PointerEvent from mouse/touch
   * @param cap Capsule being dragged
   */
  private _onCapsulePointerDown(e: PointerEvent, cap: CanvasCapsule) {
    if (this.productionMode) return;
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    this._dragging = {
      id: cap.id,
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  /**
   * Handles continuous pointer move during drag.
   * Validates movement stays within canvas bounds (respects width when checking right edge).
   * Updates capsule position immutably by creating new capsule with dx, dy offset.
   * Only active when _dragging is set; returns early if dragging hasn't started.
   */
  private _onPointerMove(e: PointerEvent) {
    if (!this._dragging) return;
    const cap = this.capsules.find((c) => c.id === this._dragging!.id);
    if (!cap) return;
    const area = this._getCanvasArea();
    if (!area) return;
    const cr = area.getBoundingClientRect();

    // Calculate new position with drag offset
    const x = e.clientX - cr.left - this._dragging.dx;
    const y = e.clientY - cr.top - this._dragging.dy;
    
    // Boundary check: ensure capsule doesn't escape canvas edges
    let diff = cap.width - this._dragging.dx 
    if (!(cr.left <= e.clientX && e.clientX + diff <= cr.right)) return;
    if (!(cr.top <= e.clientY && e.clientY <= cr.bottom)) return;
    
    const updated = this.capsules.map((c) =>
      c.id === cap.id ? { ...c, x: Math.max(0, x), y: Math.max(0, y) } : c,
    );
    this.dispatchCapsulesChange(updated);
  }

  /**
   * Ends drag operation by releasing pointer capture and clearing _dragging state.
   * Called on pointerup or pointerleave to stop position updates.
   */
  private _onPointerUp(e: PointerEvent) {
    if (this._dragging) {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      this._dragging = null;
    }
  }

  /**
   * Dispatches capsule-value-change when user types in production input.
   * Storage is saved by parent on this event.
   */
  private _onProductionInput(id: string, value: string) {
    this.dispatchCapsuleValueChange(id, value);
  }

  render() {
    return html`
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">

      <div class="canvas-container" style="position: relative;">
        ${!this.productionMode
          ? html`
              <div class="toolbar">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  @click=${() => this._addCapsule("text")}
                >
                  <i class="bi bi-plus"></i> Texto
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  @click=${() => this._addCapsule("date")}
                >
                  <i class="bi bi-calendar"></i> Fecha
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  @click=${() => this._addCapsule("richText")}
                >
                  <i class="bi bi-card-text"></i> Texto enriquecido
                </button>
              </div>
            `
          : nothing}
        <div
          class="canvas-area"
          style="position:relative; min-height: 220px;"
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointerleave=${this._onPointerUp}
        >
          ${this.capsules.map((cap) =>
            this.productionMode
              ? this._renderProductionCapsule(cap)
              : this._renderEditCapsule(cap),
          )}
        </div>
      </div>
    `;
  }

  /**
   * Renders an edit-mode capsule with drag handle, label, and delete button.
   * Positioned absolutely within canvas-area using left/top CSS properties.
   * Click opens config offcanvas; drag to move; X button to delete.
   * Accessible with role=button and tabindex for keyboard users.
   */
  private _renderEditCapsule(cap: CanvasCapsule) {
    return html`
      <div
        class="capsule-edit"
        style="left: ${cap.x}px; top: ${cap.y}px; width: ${cap.width}px; min-height: ${cap.height}px;"
        @click=${() => this.dispatchCapsuleSelect(cap)}
        @pointerdown=${(e: PointerEvent) => this._onCapsulePointerDown(e, cap)}
        role="button"
        tabindex="0"
      >
        <span class="label" title="${cap.helpText || cap.label}"
          >${cap.label || cap.type}</span
        >
        <span
          class="delete"
          @click=${(e: Event) => this._deleteCapsule(cap.id, e)}
          aria-label="Eliminar"
        >
          <i class="bi bi-x-circle"></i>
        </span>
      </div>
    `;
  }

  /**
   * Renders a production-mode capsule as editable input/textarea.
   * For richText: textarea with 3 rows; for text/date: standard input.
   * Shows helpText as title tooltip. Dispatches capsule-value-change on input.
   * Positioned absolutely like edit capsule but no drag or delete.
   */
  private _renderProductionCapsule(cap: CanvasCapsule) {
    const isRich = cap.type === "richText";
    return html`
      <div
        class="capsule-production"
        style="left: ${cap.x}px; top: ${cap.y}px; width: ${cap.width}px; min-height: ${cap.height}px;"
        title="${cap.helpText || ""}"
      >
        ${isRich
          ? html`
            <div class="input-group">
              <textarea
                class="form-control"
                .value=${cap.value}
                placeholder="${cap.label}"
                @input=${(e: Event) =>
                  this._onProductionInput(
                    cap.id,
                    (e.target as HTMLTextAreaElement).value,
                  )}
              ></textarea>
            </div>

            `
          : html`
              <input
                type="${cap.type === "date" ? "date" : "text"}"
                .value=${cap.value}
                placeholder="${cap.label}"
                @input=${(e: Event) =>
                  this._onProductionInput(
                    cap.id,
                    (e.target as HTMLInputElement).value,
                  )}
              />
            `}
      </div>
    `;
  }
}
