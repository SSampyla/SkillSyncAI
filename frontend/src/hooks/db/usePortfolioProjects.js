import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "./useFetch";
import { useMutation } from "./useMutation";
import { isDemoMode } from "../../demo/useDemoMode";
import { MOCK_PROJECTS } from "../../demo/mockProjects";
/**
 * Portfolio project hook
 * - Demo: käyttää local statea
 * - Prod: käyttää backend APIa
 */
export function usePortfolioProjects() {
    const isDemo = isDemoMode();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const { saving, error, setError, run } = useMutation();

    // 🔹 FETCH
    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            try {
                if (isDemo) {
                    setProjects(MOCK_PROJECTS);
                    setLoading(false);
                    return;
                }

                
                if (!isDemo && projects.length === 0) {
                    setProjects([]);
                }

                const data = await apiFetch("/api/database/portfolio-projects", {
                    signal: controller.signal
                });

                if (!data || (Array.isArray(data) && data.length === 0)) {
                    setProjects([]);
                } else if (Array.isArray(data)) {
                    setProjects(data);
                } else if (Array.isArray(data.projects)) {
                    setProjects(data.projects);
                } else {
                    setProjects([]);
                }

            } catch (err) {
                if (err.name === "AbortError") return;
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        load();

        return () => controller.abort();

    }, [isDemo, setError]);

    // 🔹 CREATE
    const createProject = useCallback(async (projectData) => {

        // ✅ DEMO MODE
        if (isDemo) {
            const newProject = {
                ...projectData,
                id: Date.now()
            };

            setProjects(prev => [newProject, ...prev]);
            return newProject;
        }

        // ✅ PROD MODE
        return run(async () => {
            const result = await apiFetch("/api/database/portfolio-projects", {
                method: "POST",
                body: JSON.stringify(projectData),
            });

            setProjects(prev => [result.project, ...prev]);
            return result.project;
        });

    }, [run, isDemo]);

    // 🔹 UPDATE
    const updateProject = useCallback(async (id, projectData) => {

        // ✅ DEMO MODE
        if (isDemo) {
            setProjects(prev =>
                prev.map(p => p.id === id ? { ...p, ...projectData } : p)
            );
            return;
        }

        // ✅ PROD MODE
        return run(async () => {
            const result = await apiFetch(`/api/database/portfolio-projects/${id}`, {
                method: "PUT",
                body: JSON.stringify(projectData),
            });

            setProjects(prev =>
                prev.map(p => p.id === id ? result.project : p)
            );

            return result.project;
        });

    }, [run, isDemo]);

    // 🔹 DELETE
    const deleteProject = useCallback(async (id) => {

        // ✅ DEMO MODE
        if (isDemo) {
            setProjects(prev => prev.filter(p => p.id !== id));
            return;
        }

        // ✅ PROD MODE
        return run(async () => {
            await apiFetch(`/api/database/portfolio-projects/${id}`, {
                method: "DELETE"
            });

            setProjects(prev => prev.filter(p => p.id !== id));
        });

    }, [run, isDemo]);

    /*

    * POISTETTU: toissijainen useEffect joka kutsui GET /api/database/portfolio
    * tarkistaakseen onko käyttäjä olemassa projektilatauksen jälkeen.
    *
    * Syyt poistoon:
    *
    * 1. Päällekkäinen - Portfolio.jsx tekee saman tarkistuksen omassa logiikassaan n rivi 70-80,
    *    const hasProfile = portfolio && portfolio.name && portfolio.email;
    *    Jos portfolio on tyhjä tai poistettu, Portfolio.jsx renderöi "Ei profiilia"
    *    -näkymän eikä projektilistaa näytetä lainkaan.
    *
    * 2. Väärä vastuunjako — usePortfolioProjects-hookin ei pidä tietää portfolion
    *    olemassaolosta. Hookki vastaa projekteista, ei käyttäjän tilasta.
    *    Single Responsibility -periaate.
    *
    * 3. Bugit — Efekti triggeröityi jokaisen projects-tilan muutoksen yhteydessä
    *    (create/update/delete), tehden ylimääräisen API-kutsun aina. Catch-haara
    *    tyhjentyi projektilistaan myös pelkän verkkovirheen takia, vaikka käyttäjä
    *    olisi edelleen olemassa.
    *
    * 4. Rikkoi testejä — Efekti "söi" mock-vastauksia väärässä järjestyksessä,
    *    koska testit eivät mockanneet /api/database/portfolio -kutsua.
    *
    * Käyttäjän poisto hoidetaan Portfolio.jsx:ssä handleResetProfile-funktiossa,
    * joka kutsuu deletePortfolio() + clearCandidateSkills() ja ohjaa pois sivulta.


    useEffect(() => {
        if (!isDemo && !loading && projects.length > 0) {
            // tarkistaa onko käyttäjä poistettu
            apiFetch("/api/database/portfolio")
                .then(profile => {
                    if (!profile || !profile.name) {
                        setProjects([]); //  RESET
                    }
                })
                .catch(() => {
                    setProjects([]); //  fallback reset
                });

        }
    }, [projects, isDemo, loading]);
    */

    return {
        projects,
        loading,
        saving,
        error,
        createProject,
        updateProject,
        deleteProject
    };
}