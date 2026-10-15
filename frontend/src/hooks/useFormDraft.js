import { useCallback, useEffect, useRef } from "react";

const DEBOUNCE_MS = 600;

/**
 * Hook reutilizable de borrador de formulario.
 * Encapsula toda la lógica de localStorage con debounce en escritura
 * y lectura síncrona inmediata para que el componente decida en su montaje.
 */
export default function useFormDraft(key = "sembria:integrante-draft") {
  const timerRef = useRef(null);

  // Cleanup del debounce al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /**
   * Lee el borrador de localStorage de forma síncrona.
   * Retorna el objeto parseado o null.
   */
  const loadDraft = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [key]);

  const clearDraft = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    try {
      window.localStorage.removeItem(key);
    } catch {
      // La funcionalidad de borrador continúa aunque el almacenamiento no esté disponible.
    }
  }, [key]);

  /**
   * Guarda el borrador en localStorage con debounce.
   * Si data es falsy o null, llama clearDraft() inmediatamente.
   */
  const saveDraft = useCallback((data) => {
    if (!data) {
      clearDraft();
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(data));
      } catch {
        // La funcionalidad de borrador continúa aunque el almacenamiento no esté disponible.
      }
    }, DEBOUNCE_MS);
  }, [clearDraft, key]);

  return { loadDraft, saveDraft, clearDraft };
}
