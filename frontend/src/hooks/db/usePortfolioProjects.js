import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "./useFetch";
import { useMutation } from "./useMutation";
import { isDemoMode } from "../../demo/useDemoMode";
import { demoProjects } from "../../demo/demoData";

/**
 * Hakee, luo, päivittää ja poistaa portfolio-projekteja.
 *
 * @returns {{
 *   projects: object[],
 *   loading: boolean,
 *   saving: boolean,
 *   error: string|null,
 *   createProject: function,
 *   updateProject: function,
 *   deleteProject: function,
 * }}
 */


export function usePortfolioProjects() {

    const isDemo = isDemoMode(); // ✅

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const { saving, error, setError, run } = useMutation();

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            try {
                if (isDemo) {
                    setProjects(demoProjects);
                    return;
                }

                const data = await apiFetch("/api/database/portfolio-projects", {
                    signal: controller.signal
                });

                if (Array.isArray(data)) {
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

    const createProject = useCallback(async (projectData) => {

        if (isDemo) return; // ✅

        return run(async () => {
            const result = await apiFetch("/api/database/portfolio-projects", {
                method: "POST",
                body: JSON.stringify(projectData),
            });
            setProjects(prev => [result.project, ...prev]);
            return result.project;
        });

    }, [run, isDemo]);

    const updateProject = useCallback(async (id, projectData) => {

        if (isDemo) return;

        return run(async () => {
            const result = await apiFetch(`/api/database/portfolio-projects/${id}`, {
                method: "PUT",
                body: JSON.stringify(projectData),
            });
            setProjects(prev => prev.map(p => p.id === id ? result.project : p));
            return result.project;
        });

    }, [run, isDemo]);

    const deleteProject = useCallback(async (id) => {

        if (isDemo) return;

        return run(async () => {
            await apiFetch(`/api/database/portfolio-projects/${id}`, { method: "DELETE" });
            setProjects(prev => prev.filter(p => p.id !== id));
        });

    }, [run, isDemo]);

    return { projects, loading, saving, error, createProject, updateProject, deleteProject };
}