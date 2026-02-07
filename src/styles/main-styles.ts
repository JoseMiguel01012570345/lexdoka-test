import { css } from "lit";

export const mainStyles = css`
  :host {
    display: block;
    min-height: 100vh;
    background: #f5f5f5;
  }
  .app-header {
    background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
    color: white;
    padding: 1rem 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  .mode-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .nav-tabs .nav-link {
    font-weight: 500;
  }
  .tab-pane {
    padding: 1rem 0;
  }
  .section-card {
    margin-bottom: 1.5rem;
  }
  .section-card h6 {
    margin-bottom: 0.5rem;
    color: #495057;
  }
  .ProseMirror-prompt {
    background: white;
    border: 1px solid #ced4da !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 1.5rem !important;
    border-radius: 8px !important; /* Use px for predictable corners */
    position: absolute;
    z-index: 1000;
    width: 300px; /* 15% might be too small on mobile */
    font-family: sans-serif;
  }

  .ProseMirror-prompt h5 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    color: #333;
  }

  .ProseMirror-prompt input {
    width: 100%;
    padding: 8px;
    margin-bottom: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box; /* Crucial for width: 100% */
  }

  .ProseMirror-prompt-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 10px;
  }

  /* Style the buttons to look modern */
  .ProseMirror-prompt-submit {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
  }

  .ProseMirror-prompt-cancel {
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
  }
  .main-body {
    border: 1px solid #dee2e6;
    border-top: none;
    padding: 1rem;
  }
  `;