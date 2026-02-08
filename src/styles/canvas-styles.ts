import { css } from "lit";

export const canvasStyles = css`
    :host {
      display: block;
      width: 100%;
    }
    .canvas-container {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 400px;
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      overflow: hidden;
      
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
      touch-action: none;
    }
    .btn {
        display: inline-block;
        font-weight: 400;
        line-height: 1.5;
        text-align: center;
        text-decoration: none;
        vertical-align: middle;
        cursor: pointer;
        user-select: none;
        border: 1px solid transparent;
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
        border-radius: 0.2rem;
        transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
      }
    .btn-outline-primary {
      color: #0d6efd;
      border-color: #0d6efd;
      background: white;
    }
    .btn-outline-primary:hover {
      color: #fff;
      background-color: #0d6efd;
    }
    .input-overlay {
      position: absolute;
      box-sizing: border-box;
      z-index: 10;
    }
    .capsule-edit .label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .capsule-production {
      position: absolute;
      box-sizing: border-box;
      border: 1px dashed #dee2e6;
      border-radius: 6px;
      background: #fff;
      padding: 4px 8px;
      min-width: 120px;
    }
    .capsule-production input {
      border: none;
      width: 100%;
      font: inherit;
      padding: 0;
      background: transparent;
      }
    .capsule-production textarea {
      border: none;
      font: inherit;
      padding: 0;
      background: transparent;
    }
    
    .toolbar {
      padding: 10px;
      background: #fff;
      border-bottom: 1px solid #ddd;
      display: flex;
      gap: 10px;
    }
  `;
