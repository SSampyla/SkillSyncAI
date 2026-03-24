import { useState, useCallback } from "react";

/**
 * Poistaa toistuvan saving/error/try-catch-kuvion mutaatio-operaatioista.
 *
 * @returns {{ saving: boolean, error: string|null, run: function }}
 *
 * @example
 * const { saving, error, run } = useMutation();
 *
 * const saveItem = useCallback((data) =>
 *   run(() => apiFetch("/api/items", { method: "POST", body: JSON.stringify(data) }),
 *       "[MyHook] Tallennus epäonnistui"),
 * [run]);
 */
export function useMutation() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (fn, label = "[useMutation]") => {
    setSaving(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      console.error(label, err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return { saving, error, setError, run };
}