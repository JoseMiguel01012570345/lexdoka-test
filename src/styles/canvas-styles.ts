import { css } from "lit";

export const canvasStyles = css`
    .canvas-container {
      position: relative;
      border: 1px solid var(--bs-border-color);
      border-radius: 0.375rem;
      background: #fafafa;
      min-height: 280px;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
    .capsule-edit {
      position: absolute;
      box-sizing: border-box;
      border: 2px solid #0d6efd;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.95);
      cursor: move;
      padding: 4px 8px;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      min-width: 120px;
      min-height: 28px;
    }
    .capsule-edit .label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .capsule-edit .delete {
      margin-left: 4px;
      padding: 0 4px;
      color: #dc3545;
      cursor: pointer;
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
    .capsule-production input,
    .capsule-production textarea {
      border: none;
      width: 100%;
      font: inherit;
      padding: 0;
      background: transparent;
    }
    .capsule-production textarea {
      resize: vertical;
      min-height: 60px;
    }
    .toolbar {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }
  `;
