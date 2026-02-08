import { canvasStyles } from "../styles/canvas-styles.js";


import { LitElement, html, css, nothing, PropertyValueMap } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
import type { VariableType, CanvasCapsule } from "../types/variables.js";
import { createCanvasCapsule } from "../types/variables.js";

@customElement("canvas-form")
export class CanvasForm extends LitElement {
  static readonly styles = canvasStyles

  @property({ type: Boolean }) productionMode = false;
  @property({ type: Array }) capsules: CanvasCapsule[] = [];
  
  // Internal state for dragging
  @state() private _dragging: { id: string; dx: number; dy: number } | null = null;
  // Internal state for production editing (which capsule is currently being typed in)
  @state() private _editingId: string | null = null;

  @query("canvas") private _canvas!: HTMLCanvasElement;
  private _ctx!: CanvasRenderingContext2D;

  /**
   * Lifecycle: Initialize Context and start drawing
   */
  firstUpdated() {
    this._ctx = this._canvas.getContext("2d")!;
    this._resizeCanvas("outside");
  }

  /**
   * Redraw whenever properties change
   */
  updated(_: any) {
    if (this._ctx) {
      this._draw();
    }
  }

  /**
   * Handle High DPI displays and container resizing
   */
  private _resizeCanvas() {
    const container = this.renderRoot.querySelector('.canvas-container');
    if (container && this._canvas) {
        const rect = container.getBoundingClientRect();
        // Scale for Retina/HighDPI
        const dpr = window.devicePixelRatio || 1;
        this._canvas.width = rect.width * dpr;
        this._canvas.height = Math.max(rect.height, 400) * dpr; // Minimum height
        console.log("resizing")
        // CSS size
        this._canvas.style.width = `${rect.width}px`;
        this._canvas.style.height = `${Math.max(rect.height, 400)}px`;
        
        // Normalize coordinate system
        this._ctx.scale(dpr, dpr);
    }
  }

  // --- Events Dispatchers ---

  dispatchCapsuleSelect(capsule: CanvasCapsule) {
    this.dispatchEvent(new CustomEvent("capsule-select", { detail: { capsule }, bubbles: true, composed: true }));
  }

  dispatchCapsulesChange(capsules: CanvasCapsule[]) {
    this.dispatchEvent(new CustomEvent("capsules-change", { detail: { capsules }, bubbles: true, composed: true }));
  }

  dispatchCapsuleValueChange(id: string, value: string) {
    this.dispatchEvent(new CustomEvent("capsule-value-change", { detail: { id, value }, bubbles: true, composed: true }));
  }

  // --- Logic Methods ---

  private _addCapsule(type: VariableType) {
    const newCapsule = createCanvasCapsule({ type });
    // Default position slightly offset so they don't stack perfectly on top
    newCapsule.x = 20;
    newCapsule.y = 20 + (this.capsules.length * 10); 
    const updated = [...this.capsules, newCapsule];
    this.dispatchCapsulesChange(updated);
  }

  private _deleteCapsule(id: string) {
    this.dispatchCapsulesChange(this.capsules.filter((c) => c.id !== id));
  }

  // --- Hit Testing ---
  
  /**
   * Checks if coordinate (x,y) is inside a capsule.
   * Returns the capsule and the "zone" (body or delete-button).
   */
  private _hitTest(x: number, y: number): { cap: CanvasCapsule, zone: 'body' | 'delete' } | null {
    // Iterate in reverse to select top-most elements first
    for (let i = this.capsules.length - 1; i >= 0; i--) {
        const cap = this.capsules[i];
        
        // Check bounds
        if (x >= cap.x && x <= cap.x + cap.width && y >= cap.y && y <= cap.y + cap.height) {
            
            // In Edit mode, check if we hit the 'X' button (top right corner)
            if (!this.productionMode) {
                const deleteSize = 20;
                if (x >= cap.x + cap.width - deleteSize && y <= cap.y + deleteSize) {
                    return { cap, zone: 'delete' };
                }
            }
            return { cap, zone: 'body' };
        }
    }
    return null;
  }

  // --- Interaction Handlers ---

  private _onPointerDown(e: PointerEvent) {
    const rect = this._canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = this._hitTest(x, y);

    // 1. Production Mode Interaction
    if (this.productionMode) {
        if (hit) {
            // Start editing this specific capsule
            this._editingId = hit.cap.id;
        } else {
            // Clicked empty space, stop editing
            this._editingId = null;
        }
        return;
    }

    // 2. Edit Mode Interaction
    if (hit) {
        if (hit.zone === 'delete') {
            this._deleteCapsule(hit.cap.id);
        } else {            
            // Drag logic
            e.preventDefault();
            this._dragging = {
                id: hit.cap.id,
                dx: x - hit.cap.x,
                dy: y - hit.cap.y,
            };
            this._canvas.setPointerCapture(e.pointerId);
        }
    }
  }

  private _onPointerMove(e: PointerEvent) {
    if (!this._dragging || this.productionMode) return;

    const rect = this._canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cap = this.capsules.find(c => c.id === this._dragging!.id);
    if (!cap) return;

    // Calculate new position
    let newX = x - this._dragging.dx;
    let newY = y - this._dragging.dy;

    // Boundaries
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;

    newX = Math.max(0, Math.min(newX, canvasWidth - cap.width));
    newY = Math.max(0, Math.min(newY, canvasHeight - cap.height));

    // Update state
    const updated = this.capsules.map(c => 
        c.id === cap.id ? { ...c, x: newX, y: newY } : c
    );
    
    // We update local state immediately for smooth 60fps drag, 
    // but dispatch event for parent persistence
    this.dispatchCapsulesChange(updated);
  }

  private _onPointerUp(e: PointerEvent) {
    if (this._dragging) {
      this._canvas.releasePointerCapture(e.pointerId);
      let cap: CanvasCapsule = this.capsules.find(c => c.id === this._dragging!.id)!;
      this.dispatchCapsuleSelect(cap);
      this._dragging = null;
    }
  }

  private _onProductionInput(id: string, value: string) {
    this.dispatchCapsuleValueChange(id, value);
  }

  // --- Drawing Logic ---

  private _draw() {
    const ctx = this._ctx;
    const width = this._canvas.width / (window.devicePixelRatio || 1);
    const height = this._canvas.height / (window.devicePixelRatio || 1);

    // Clear Screen
    ctx.clearRect(0, 0, width, height);

    // Draw each capsule
    this.capsules.forEach(cap => {
        // If we are currently editing this capsule in production mode via DOM overlay, 
        // we can skip drawing the text or draw it 'faded' (optional), 
        // but drawing the box background is still good.
        const isEditingThis = this._editingId === cap.id;

        if (this.productionMode) {
            this._drawProductionCapsule(ctx, cap, isEditingThis);
        } else {
            this._drawEditCapsule(ctx, cap);
        }
    });
  }

  /**
   * Mimics the "Edit" visuals: Card look with Label and Delete Button
   */
  private _drawEditCapsule(ctx: CanvasRenderingContext2D, cap: CanvasCapsule) {
    const r = 4; // radius
    
    // Shadow
    ctx.shadowColor = "rgba(0,0,0,0.1)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    // Background
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.roundRect(cap.x, cap.y, cap.width, cap.height, r);
    ctx.fill();
    
    // Border
    ctx.shadowColor = "transparent"; // reset shadow for border
    ctx.strokeStyle = "#0d6efd"; // Primary color border in edit mode
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text Label (Vertically centered)
    ctx.fillStyle = "#333";
    ctx.font = "14px sans-serif";
    ctx.textBaseline = "middle";
    const label = cap.label || cap.type;
    // Simple clipping for text
    ctx.save();
    ctx.beginPath();
    ctx.rect(cap.x, cap.y, cap.width - 25, cap.height); // Reserve space for X button
    ctx.clip();
    ctx.fillText(label, cap.x + 8, cap.y + cap.height / 2);
    ctx.restore();

    // Delete Button (Top Right)
    const delSize = 16;
    const padding = 2;
    const delX = cap.x + cap.width - delSize - padding;
    const delY = cap.y + padding + 2;
    
    ctx.fillStyle = "#dc3545"; // Bootstrap danger red
    ctx.beginPath();
    ctx.arc(delX + delSize/2, delY + delSize/2, delSize/2, 0, Math.PI * 2);
    ctx.fill();

    // The 'X'
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const xPad = 4;
    ctx.moveTo(delX + xPad, delY + xPad);
    ctx.lineTo(delX + delSize - xPad, delY + delSize - xPad);
    ctx.moveTo(delX + delSize - xPad, delY + xPad);
    ctx.lineTo(delX + xPad, delY + delSize - xPad);
    ctx.stroke();
  }

  /**
   * Mimics the "Production" visuals: Bootstrap Form Control look
   */
  private _drawProductionCapsule(ctx: CanvasRenderingContext2D, cap: CanvasCapsule, isEditing: boolean) {
    if (isEditing) return; // Don't draw if the DOM input is covering it

    const r = 4;
    
    // Background
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.roundRect(cap.x, cap.y, cap.width, cap.height, r);
    ctx.fill();

    // Border (Bootstrap gray)
    ctx.strokeStyle = "#ced4da";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text Value
    ctx.fillStyle = cap.value ? "#212529" : "#6c757d"; // Dark text or muted placeholder
    ctx.font = "1rem system-ui, -apple-system, 'Segoe UI', Roboto";
    ctx.textBaseline = "top";
    
    const text = cap.value || cap.label; // Show value or placeholder
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(cap.x + 2, cap.y + 2, cap.width - 4, cap.height - 4);
    ctx.clip();
    
    // Wrap text handling (simple version)
    const lineHeight = 20;
    const padding = 8;
    if (cap.type === 'richText') {
        this._wrapText(ctx, text, cap.x + padding, cap.y + padding, cap.width - (padding*2), lineHeight);
    } else {
        // Single line for text/date
        ctx.fillText(text, cap.x + padding, cap.y + 6);
    }
    ctx.restore();
  }

  /**
   * Helper to wrap text inside canvas
   */
  private _wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  // --- Main Render ---

  render() {
    return html`
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">

      <div class="canvas-container">
        ${!this.productionMode
          ? html`
              <div class="toolbar">
                <button class="btn btn-outline-primary" @click=${() => this._addCapsule("text")}>
                  <i class="bi bi-plus"></i> Texto
                </button>
                <button class="btn btn-outline-primary" @click=${() => this._addCapsule("date")}>
                  <i class="bi bi-calendar"></i> Fecha
                </button>
                <button class="btn btn-outline-primary" @click=${() => this._addCapsule("richText")}>
                  <i class="bi bi-card-text"></i> Texto enriquecido
                </button>
              </div>
            `
          : nothing}

        <canvas
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointerleave=${this._onPointerUp}
        ></canvas>

        ${this.productionMode && this._editingId
            ? this._renderInputOverlay()
            : nothing
        }
      </div>
    `;
  }

  /**
   * Renders a real DOM input strictly for the currently focused capsule.
   */
  private _renderInputOverlay() {
    const cap = this.capsules.find(c => c.id === this._editingId);
    if (!cap) return nothing;

    // Match styles to the canvas drawing coordinates
    const style = `
        left: ${cap.x}px; 
        top: ${cap.y}px; 
        width: ${cap.width * 2}px; 
        height: ${cap.height}px;
    `;

    const commonClasses = "form-control input-overlay capsule-production";

    return html`
        ${cap.type === "richText"
            ? html`
            <textarea
            class="${commonClasses}" 
                style="${style}"
                .value=${cap.value}
                placeholder="${cap.label}"
                autoFocus
                @blur=${() => this._editingId = null}
                @input=${(e: Event) => this._onProductionInput(cap.id, (e.target as HTMLTextAreaElement).value)}
              ></textarea>
            `
            : html`
                <input
                    type="${cap.type === "date" ? "date" : "text"}"
                    class="${commonClasses}"
                    style="${style}"
                    .value=${cap.value}
                    placeholder="${cap.label}"
                    autoFocus
                    @blur=${() => this._editingId = null}
                    @input=${(e: Event) => this._onProductionInput(cap.id, (e.target as HTMLInputElement).value)}
                />
            `
        }
    `;
  }
}