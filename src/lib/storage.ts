import type { CanvasCapsule } from "../types/variables.js";

const STORAGE_KEY = "lexdoka_app_data";

export interface StoredData {
  /** Contenido del documento ProseMirror (JSON) */
  proseMirrorDoc: unknown;
  /** Cápsulas en el Canvas con posición */
  canvasCapsules: CanvasCapsule[];
  /** Última actualización */
  updatedAt: string;
}

const defaultData: StoredData = {
  proseMirrorDoc: null,
  canvasCapsules: [],
  updatedAt: new Date().toISOString(),
};

/**
 * Guarda la configuración y contenido en localStorage.
 */
export function saveToStorage(data: Partial<StoredData>): void {
  const existing = loadFromStorage();
  const merged: StoredData = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

/**
 * Carga la configuración desde localStorage.
 */
export function loadFromStorage(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    const parsed = JSON.parse(raw) as StoredData;
    return {
      proseMirrorDoc: parsed.proseMirrorDoc ?? defaultData.proseMirrorDoc,
      canvasCapsules: Array.isArray(parsed.canvasCapsules)
        ? parsed.canvasCapsules
        : defaultData.canvasCapsules,
      updatedAt: parsed.updatedAt ?? defaultData.updatedAt,
    };
  } catch {
    return { ...defaultData };
  }
}
