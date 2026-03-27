import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "./useFetch";
import { useMutation } from "./useMutation";
import { isDemoMode } from "../../demo/useDemoMode";
import { createDemoPortfolio } from "../../demo/demoData";

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
    const isDemo = isDemoMode();

    const [portfolio, setPortfolio] = useState({});
    const [loading, setLoading] = useState(true);
    const { saving, error, setError, run } = useMutation();

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            try {
                if (isDemo) {
                    setPortfolio(createDemoPortfolio());
                    return;
                }

                const data = await apiFetch("/api/database/portfolio", {
                    signal: controller.signal
                });

                setPortfolio(data);

            } catch (err) {
                if (err.name === "AbortError") return;
                console.warn("[usePortfolio]", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        load();

        return () => controller.abort();

    }, [isDemo, setError]);

const updatePortfolio = useCallback(async (updatedData) => {
        return run(async () => {

            if (isDemo) {
                setPortfolio(prev => ({ ...prev, ...updatedData }));
                return;
            }

            // Lähetetään päivitys
            await apiFetch("/api/database/portfolio", {
                method: "PUT",
                body: JSON.stringify(updatedData),
            });

            // Päivitetään tila lokaalisti
            setPortfolio(prev => ({ ...prev, ...updatedData }));

            return updatedData;

        }, "[usePortfolio] Päivitys epäonnistui");
    }, [run, isDemo]);

    const resetPortfolio = useCallback(async () => {
        return run(async () => {

            if (isDemo) {
                setPortfolio(createDemoPortfolio());
                return;
            }

            // kutsutaan oikeaa DELETE routea
            await apiFetch("/api/database/portfolio", {
                method: "DELETE",
            });

            // backend palauttaa { success: true, message: ... }
            // jotta hookin state vastaa fronttia, haetaan GET uudelleen
            const refreshed = await apiFetch("/api/database/portfolio");
            setPortfolio(refreshed);

            return refreshed;

        }, "[usePortfolio] Reset epäonnistui");
    }, [run, isDemo]);


    return {
        portfolio,
        loading,
        saving,
        error,
        updatePortfolio,
        resetPortfolio
    };
}