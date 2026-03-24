import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "./useFetch";
import { useMutation } from "./useMutation";

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
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { saving, error, setError, run } = useMutation();

  useEffect(() => {
    const controller = new AbortController();

    apiFetch("/api/database/portfolio-projects", { signal: controller.signal })
      .then(data => {
        // Tukee sekä suoraa arrayta että { projects: [...] } -rakennetta
        if (Array.isArray(data)) {
          setProjects(data);
        } else if (Array.isArray(data.projects)) {
          setProjects(data.projects);
        } else {
          console.warn("[usePortfolioProjects] Odottamaton rakenne:", data);
          setProjects([]);
        }
      })
      .catch(err => {
        if (err.name === "AbortError") return;
        console.warn("[usePortfolioProjects]", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [setError]);

  const createProject = useCallback(async (projectData) => {
    return run(async () => {
      const result = await apiFetch("/api/database/portfolio-projects", {
        method: "POST",
        body: JSON.stringify(projectData),
      });
      setProjects(prev => [result.project, ...prev]);
      return result.project;
    }, "[usePortfolioProjects] Luonti epäonnistui");
  }, [run]);

  const updateProject = useCallback(async (id, projectData) => {
    return run(async () => {
      const result = await apiFetch(`/api/database/portfolio-projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(projectData),
      });
      setProjects(prev => prev.map(p => p.id === id ? result.project : p));
      return result.project;
    }, "[usePortfolioProjects] Päivitys epäonnistui");
  }, [run]);

  const deleteProject = useCallback(async (id) => {
    return run(async () => {
      await apiFetch(`/api/database/portfolio-projects/${id}`, { method: "DELETE" });
      setProjects(prev => prev.filter(p => p.id !== id));
    }, "[usePortfolioProjects] Poisto epäonnistui");
  }, [run]);

  return { projects, loading, saving, error, createProject, updateProject, deleteProject };
}