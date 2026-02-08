import { css } from "lit";

export const editorStyles = css`
    .editor-wrap {
      border-radius: 0.375rem;
      padding: 0.75rem;
      min-height: 120px;
      background: #fff;
      }
    .ProseMirror pre {
        white-space: pre-wrap;
        overflow-wrap: break-word;
        word-break: break-all;
    }

    .ProseMirror code {
        white-space: inherit;
    }
    .editor-wrap.readonly .ProseMirror {
      cursor: text;
    }
    .ProseMirror {
      outline: none;
      min-height: 100px;
      outline: none;
      padding: 10px
    }
    #editor {
      background: white;
      color: black;
      background-clip: padding-box;
      border-radius: 4px;
      border: 1px solid rgba(0, 0, 0, 0.2);
      padding: 5px 0;
      margin-bottom: 23px;
    }
    .ProseMirror-selectednode {
        outline: 2px solid #8cf;
    }
    .ProseMirror-menubar {
        border-top-left-radius: inherit;
        border-top-right-radius: inherit;
        position: relative;
        min-height: 1em;
        color: #666;
        padding: 1px 6px;
        top: 0;
        left: 0;
        right: 0;
        border-bottom: 1px solid silver;
        background: white;
        z-index: 10;
        -moz-box-sizing: border-box;
        box-sizing: border-box;
        overflow: visible;
    }
    
    .ProseMirror-menuitem {
      margin-right: 3px;
      display: inline-block;
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
    .ProseMirror-icon {
        display: inline-block;
        line-height: 2.0;
        vertical-align: -2px;
        padding: 2px 8px;
        cursor: pointer;
    }
    .ProseMirror-icon svg {
        fill: currentColor;
        height: 1em;
    }
    .ProseMirror-menu-dropdown-menu {
        z-index: 15;
        min-width: 6em;
        margin-left: 20px;
        margin-right: 20px;

    }
    .ProseMirror-menu-dropdown-menu, .ProseMirror-menu-submenu {
        position: absolute;
        background: white;
        color: #666;
        border: 1px solid #aaa;
        padding: 2px;
    }
    .ProseMirror-menu-dropdown, .ProseMirror-menu-dropdown-menu {
        font-size: 90%;
        white-space: nowrap;
    }
        
    .variable-capsule[data-type="richText"] {
      display: block;
      width: 100%;
      margin: 0.5em 0;
      min-height: 2em;
    }
    .ProseMirror-menu-submenu-wrap {
      position: relative;
      cursor: pointer;
    }

    .ProseMirror-menu-submenu {
      display: none;
      position: absolute;
      top: 0;
      left: 100%; /* Positions it to the right of the 'Heading' label */
      background: white;
      border: 1px solid #ccc;
      box-shadow: 2px 2px 4px rgba(0,0,0,0.2);
      min-width: 100px;
      z-index: 10;
    }

    .ProseMirror-menu-submenu-wrap:hover .ProseMirror-menu-submenu {
      display: block;
    }

    .ProseMirror-menu-dropdown-item {
      padding: 8px 12px;
      white-space: nowrap;
    }

    .ProseMirror-menu-dropdown-item:hover {
      background-color: #f0f0f0;
    }

    .ProseMirror-menu-submenu-label {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .ProseMirror-menu-submenu-label::after {
      content: "";
      display: inline-block;
      width: 0;
      height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 4px solid #666; /* The color of your arrow */
      vertical-align: middle;
      transition: transform 0.2s ease; /* Optional: smooth rotation */
    }

    .ProseMirror-menu-submenu-wrap:hover .ProseMirror-menu-submenu-label::after {
      transform: rotate(-180deg);
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
    .ProseMirror-menuseparator {
        border-right: 1px solid #ddd;
        margin-right: 3px;
    }
  `;