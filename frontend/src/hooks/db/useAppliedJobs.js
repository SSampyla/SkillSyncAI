import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "./useFetch";
import { useMutation } from "./useMutation";

/**
 * Hakee, tallentaa ja poistaa haettuja työpaikkoja.
 * Jokainen palautettu työpaikka sisältää rikastettuna:
 *   compatibility, recommended, matchedSkills, missingSkills
 *
 * @returns {{
 *   jobs: object[],
 *   loading: boolean,
 *   saving: boolean,
 *   error: string|null,
 *   saveJob: function,
 *   deleteJob: function,
 *   getJob: function,
 * }}
 */
export function useAppliedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { saving, error, setError, run } = useMutation();

  const fetchJobs = useCallback((signal) => {
    return apiFetch("/api/database/applied-jobs", { signal })
      .then(setJobs)
      .catch(err => {
        if (err.name === "AbortError") return;
        console.warn("[useAppliedJobs]", err);
        setError(err.message);
      });
  }, [setError]);

  useEffect(() => {
    const controller = new AbortController();
    fetchJobs(controller.signal).finally(() => setLoading(false));
    return () => controller.abort();
  }, [fetchJobs]);

  const saveJob = useCallback(async (id, jobData) => {
    return run(async () => {
      const result = await apiFetch(`/api/database/applied-jobs/${id}`, {
        method: "PUT",
        body: JSON.stringify(jobData),
      });
      setJobs(prev => {
        const idx = prev.findIndex(j => j.id === id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = result.job;
          return updated;
        }
        return [...prev, result.job];
      });
      return result.job;
    }, "[useAppliedJobs] Tallennus epäonnistui");
  }, [run]);

  const deleteJob = useCallback(async (id) => {
    return run(async () => {
      await apiFetch(`/api/database/applied-jobs/${id}`, { method: "DELETE" });
      setJobs(prev => prev.filter(j => j.id !== id));
    }, "[useAppliedJobs] Poisto epäonnistui");
  }, [run]);

  const getJob = useCallback(async (id) => {
    return apiFetch(`/api/database/applied-jobs/${id}`);
  }, []);

  return { jobs, loading, saving, error, saveJob, deleteJob, getJob };
}