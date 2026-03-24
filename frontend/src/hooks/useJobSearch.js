/**
 * @file hooks/useJobSearch.js
 * @description Työpaikkahaku ja haettujen työpaikkojen hallinta.
 *
 * @example
 * const {
 *   searchCriteria, setSearchCriteria,
 *   keywordInput, setKeywordInput,
 *   availableJobs, loading, error, searched, searchMeta,
 *   handleSearch,
 *   appliedJobs, applyForJob, isApplied,
 * } = useJobSearch();
 */

import { useState, useEffect, useCallback } from "react";
import { searchJobs } from "../services/api";

// ---------------------------------------------------------------------------
// Vakiot
// ---------------------------------------------------------------------------

const APPLIED_JOBS_KEY = "appliedJobs";

const DEFAULT_CRITERIA = {
  jobTitle: "Frontend Developer",
  location: "Helsinki",
  keywords: ["React", "JavaScript"],
};

// ---------------------------------------------------------------------------
// Apufunktiot
// ---------------------------------------------------------------------------

export const parseKeywords = (raw) =>
  raw.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);

const readAppliedJobs = () => {
  try {
    return JSON.parse(localStorage.getItem(APPLIED_JOBS_KEY) ?? "[]");
  } catch {
    return [];
  }
};

const writeAppliedJobs = (jobs) => {
  localStorage.setItem(APPLIED_JOBS_KEY, JSON.stringify(jobs));
  window.dispatchEvent(new Event("storage"));
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useJobSearch() {
  const [searchCriteria, setSearchCriteria] = useState(DEFAULT_CRITERIA);
  const [keywordInput, setKeywordInput] = useState(
    DEFAULT_CRITERIA.keywords.join(", ")
  );

  const [availableJobs, setAvailableJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [searchMeta, setSearchMeta] = useState({ responseTime: null, sources: [] });

  const [appliedJobs, setAppliedJobs] = useState(readAppliedJobs);

  // Kuuntele localStorage-muutoksia muista välilehdistä
  useEffect(() => {
    const sync = () => setAppliedJobs(readAppliedJobs());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();

    const criteria = {
      jobTitle: searchCriteria.jobTitle.trim(),
      location: searchCriteria.location.trim(),
      keywords: parseKeywords(keywordInput),
    };

    setLoading(true);
    setError(null);
    setSearched(false);

    try {
      const data = await searchJobs(criteria);
      setAvailableJobs(data.jobs ?? []);
      setSearchMeta({
        responseTime: data.responseTimeMs ?? null,
        sources: data.sources ?? [],
      });
    } catch (err) {
      setError(err.message ?? "Haku epäonnistui. Yritä uudelleen.");
      setAvailableJobs([]);
      setSearchMeta({ responseTime: null, sources: [] });
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [searchCriteria, keywordInput]);

  const applyForJob = useCallback((job) => {
    setAppliedJobs((prev) => {
      if (prev.some((j) => j.id === job.id)) return prev;
      const updated = [...prev, job];
      writeAppliedJobs(updated);
      return updated;
    });
  }, []);

  const isApplied = useCallback(
    (jobId) => appliedJobs.some((j) => j.id === jobId),
    [appliedJobs]
  );

  // Pidä keywords-array synkronoituna keywordInputin kanssa
  const handleKeywordInputChange = useCallback((raw) => {
    setKeywordInput(raw);
    setSearchCriteria((prev) => ({ ...prev, keywords: parseKeywords(raw) }));
  }, []);

  return {
    searchCriteria,
    setSearchCriteria,
    keywordInput,
    setKeywordInput: handleKeywordInputChange,
    availableJobs,
    loading,
    error,
    searched,
    searchMeta,
    handleSearch,
    appliedJobs,
    applyForJob,
    isApplied,
  };
}