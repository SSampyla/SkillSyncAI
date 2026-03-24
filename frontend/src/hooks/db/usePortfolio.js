import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "./useFetch";
import { useMutation } from "./useMutation";

/**
 * Hakee, päivittää ja nollaa portfolion.
 *
 * Huomio: skills-kenttä tulee candidateProfilesta (ks. useCandidateSkills),
 * ei tallenneta portfolioon. GET /portfolio yhdistää ne automaattisesti.
 *
 * @returns {{
 *   portfolio: object,
 *   loading: boolean,
 *   saving: boolean,
 *   error: string|null,
 *   updatePortfolio: function,
 *   resetPortfolio: function,
 * }}
 */
export function usePortfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const { saving, error, setError, run } = useMutation();

  useEffect(() => {
    const controller = new AbortController();

    apiFetch("/api/database/portfolio", { signal: controller.signal })
      .then(setPortfolio)
      .catch(err => {
        if (err.name === "AbortError") return;
        console.warn("[usePortfolio]", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const updatePortfolio = useCallback(async (portfolioData) => {
    await run(
      () => apiFetch("/api/database/portfolio", {
        method: "PUT",
        body: JSON.stringify(portfolioData),
      }),
      "[usePortfolio] Tallennus epäonnistui"
    );
    setPortfolio(prev => ({ ...prev, ...portfolioData }));
  }, [run]);

  const resetPortfolio = useCallback(async () => {
    await run(
      async () => {
        await apiFetch("/api/database/portfolio", { method: "DELETE" });
        const fresh = await apiFetch("/api/database/portfolio");
        setPortfolio(fresh);
      },
      "[usePortfolio] Nollaus epäonnistui"
    );
  }, [run]);

  return { portfolio, loading, saving, error, updatePortfolio, resetPortfolio };
}