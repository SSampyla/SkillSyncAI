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