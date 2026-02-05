/**
 * Tipos de variable soportados según la prueba técnica.
 * - text: campo de texto simple
 * - date: selector de fecha
 * - richText: texto enriquecido (HTML), ocupa línea completa
 */
export type VariableType = "text" | "date" | "richText";

/**
 * Definición de una cápsula de variable.
 * id: identificador único
 * type: tipo de variable
 * label: etiqueta visible
 * helpText: texto de ayuda (tooltip en modo producción)
 * value: valor actual (para persistencia)
 */
export interface VariableCapsule {
  id: string;
  type: VariableType;
  label: string;
  helpText: string;
  value: string;
}

/**
 * Cápsula con posición para el Canvas (edición).
 */
export interface CanvasCapsule extends VariableCapsule {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Crea una cápsula con valores por defecto.
 */
export function createCapsule(
  overrides: Partial<VariableCapsule> & { type: VariableType },
): VariableCapsule {
  const id =
    overrides.id ??
    `capsule_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return {
    ...overrides,
    id,
    type: overrides.type,
    label: overrides.label ?? "Nueva variable",
    helpText: overrides.helpText ?? "",
    value: overrides.value ?? "",
  };
}

/**
 * Crea una cápsula para Canvas con posición.
 */
export function createCanvasCapsule(
  overrides: Partial<CanvasCapsule> & { type: VariableType },
): CanvasCapsule {
  const base = createCapsule(overrides);
  return {
    ...base,
    x: overrides.x ?? 20,
    y: overrides.y ?? 20,
    width: overrides.width ?? 200,
    height: overrides.height ?? 32,
  };
}
