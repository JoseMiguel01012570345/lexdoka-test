import { Schema } from "prosemirror-model";
import {
  nodes as baseNodes,
  marks as baseMarks,
} from "prosemirror-schema-basic";

/**
 * Nodo para cápsula de variable en ProseMirror.
 * Atributos: id, type, label, helpText, value
 */
const variableCapsuleNode = {
  group: "inline",
  inline: true,
  atom: true,
  attrs: {
    id: { default: "" },
    type: { default: "text" },
    label: { default: "" },
    helpText: { default: "" },
    value: { default: "" },
  },
  toDOM(node: { attrs: Record<string, string> }) {
    const span = document.createElement("span");
    span.className = "variable-capsule prosemirror-capsule";
    span.setAttribute("data-capsule-id", node.attrs.id);
    span.setAttribute("data-type", node.attrs.type);
    span.setAttribute("data-label", node.attrs.label);
    span.setAttribute("data-help", node.attrs.helpText);
    span.setAttribute("data-value", node.attrs.value);
    span.textContent = node.attrs.label || `[${node.attrs.type}]`;
    return span;
  },
  parseDOM: [
    {
      tag: "span.variable-capsule",
      getAttrs(dom: Node) {
        const el = dom as HTMLElement;
        return {
          id: el.getAttribute("data-capsule-id") ?? "",
          type: el.getAttribute("data-type") ?? "text",
          label: el.getAttribute("data-label") ?? "",
          helpText: el.getAttribute("data-help") ?? "",
          value: el.getAttribute("data-value") ?? "",
        };
      },
    },
  ],
};

const nodes = { ...baseNodes, variableCapsule: variableCapsuleNode };

const schema = new Schema({ nodes, marks: baseMarks });

export { schema as proseMirrorSchema };
