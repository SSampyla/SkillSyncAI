/**
 * @file hooks/useDatabase.js
 * @description React-hookit backend-tietokannan käsittelyyn.
 *
 * Hookki-jako vastuu-alueittain:
 *
 *   useSynchronizeCandidateSkills  — Kirjoittaa hakijan taidot tietokantaan LLM:n kautta.
 *                                    Kutsutaan automaattisesti kun käyttäjä muuttaa taitojaan.
 *
 *   useAvailableSkills             — Hakee taitovalikoiman (read-only, haetaan kerran mountissa).
 *
 *   useCandidateSkills            — Hakee hakijan profiilin DB:stä ja muuntaa sen
 *                                    frontend-muotoon (frontend/backend/tools/other).
 *
 *   usePortfolio                   — Hakee, päivittää ja nollaa portfolion.
 *
 *   useAppliedJobs                 — Hakee, tallentaa ja poistaa haettuja työpaikkoja.
 *
 * Arkkitehtuurihuomio:
 *   Taidot tallennetaan DB:ssä kandidaatin osaamistason mukaan
 *   (hardSkillsProficient / softSkillsBasics jne.) koska match-algoritmi tarvitsee sen.
 *   Frontend näyttää taidot teknologiakategorioittain (frontend/backend/tools/other).
 *   Muunnos tehdään dbProfileToFrontendSkills-funktiolla (frontend\src\utils\skillUtils.js).
 * 
 * testejä varten: npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
 * 
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { frontendSkillsToApplicantText, dbProfileToFrontendSkills } from "../utils/skillUtils";

const DEBOUNCE_MS = 1750;
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// Apufunktio — yhtenäinen fetch error-käsittelyllä
// ---------------------------------------------------------------------------

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`${options.method ?? "GET"} ${path} → HTTP ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// useSynchronizeCandidateSkills
// ---------------------------------------------------------------------------
/**
 * Synkronoi portfolion taidot automaattisesti tietokantaan LLM:n kautta.
 *
 * Toimintaperiaate:
 *   1. Käyttäjä muuttaa taitoja → debounce käynnistyy (2.5s hiljaisuus)
 *   2. Debounce laukeaa → LLM analysoi taidot ja luokittelee ne
 *      (hardSkillsProficient / softSkillsBasics jne.)0
 *   3. Luokiteltu profiili tallennetaan /api/database/candidate-profile
 *
 * Optimoinnit:
 *   - isLoadingFromDB-lippu estää turhan sync-kierroksen kun data haetaan DB:stä
 *   - isSyncing estää päällekkäiset LLM-kutsut
 *   - Backend cachettaa LLM-vastaukset, joten sama lista ei kutsu LLM:ää uudelleen
 *
 * @param {object} skills           - Taidot frontend-muodossa {frontend, backend, tools, other}
 * @param {function} onStatusChange - Tilamuutos-callback: "idle"|"pending"|"syncing"|"saved"|"error"
 * @param {React.MutableRefObject} isLoadingFromDB - Ref joka on true kun data tuli DB:stä
 *
 * @example
 * const [syncStatus, setSyncStatus] = useState("idle");
 * const isLoadingFromDB = useRef(false);
 * useSynchronizeCandidateSkills(selectedSkills, setSyncStatus, isLoadingFromDB);
 */
export function useSynchronizeCandidateSkills(skills, onStatusChange, isLoadingFromDB) {
  const debounceTimer = useRef(null);
  const isSyncing = useRef(false);
  const abortController = useRef(null);
  const skillsRef = useRef(skills);

  useEffect(() => {
    skillsRef.current = skills;
  }, [skills]);

  const runSync = useCallback(async (currentSkills) => {
    if (isSyncing.current) {
      abortController.current?.abort();
    }

    const applicantText = frontendSkillsToApplicantText(currentSkills);
    if (!applicantText) return;

    abortController.current = new AbortController();
    const { signal } = abortController.current;

    isSyncing.current = true;
    onStatusChange?.("syncing");

    try {
      const llmData = await apiFetch("/api/jobs/skills/applicant", {
        method: "POST",
        body: JSON.stringify({ applicantText }),
        signal,
      });

      await apiFetch("/api/database/candidate-profile", {
        method: "PUT",
        body: JSON.stringify(llmData.skills),
        signal,
      });

      onStatusChange?.("saved");
    } catch (err) {
      if (err.name === "AbortError") return; // isSyncing jää true — seuraava runSync hoitaa nollauksen
      console.error("[useSynchronizeCandidateSkills]", err);
      onStatusChange?.("error");
    } finally {
      // Nollataan vain jos tämä on vielä aktiivinen sync (ei abortattu)
      if (!signal.aborted) isSyncing.current = false;
    }
  }, [onStatusChange]);

  useEffect(() => {

    if (isLoadingFromDB?.current) {
      isLoadingFromDB.current = false;
      return;
    }
    if (!skills) {
      return;
    }

    onStatusChange?.("pending");

    const hasSkills = Object.values(skills).some(arr => arr.length > 0);
    if (!hasSkills) {
      return;
    }

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => runSync(skillsRef.current), DEBOUNCE_MS);

    return () => {
      clearTimeout(debounceTimer.current);
      abortController.current?.abort();
    };
  }, [skills, runSync]);
}

// ---------------------------------------------------------------------------
// useAvailableSkills
// ---------------------------------------------------------------------------
/**
 * Hakee taitovalikoiman tietokannasta. Haetaan kerran mountissa, ei muutu ajon aikana.
 *
 * @returns {{ availableSkills: object, loading: boolean, error: string|null }}
 *
 * @example
 * const { availableSkills, loading } = useAvailableSkills();
 */
export function useAvailableSkills() {
  const [availableSkills, setAvailableSkills] = useState({
    frontend: [], backend: [], tools: [], other: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    apiFetch("/api/database/available-skills", { signal: controller.signal })
      .then(data => {
        const keys = ["frontend", "backend", "tools", "other"];
        if (data && keys.every(k => Array.isArray(data[k]))) {
          setAvailableSkills(data);
        } else {
          console.warn("[useAvailableSkills] Odottamaton rakenne:", data);
        }
      })
      .catch(err => {
        if (err.name === "AbortError") return;
        console.warn("[useAvailableSkills]", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return { availableSkills, loading, error };
}

// ---------------------------------------------------------------------------
// useCandidateSkills
// ---------------------------------------------------------------------------
/**
 * Hakee hakijan profiilin DB:stä ja muuntaa sen frontend-kategoriamutoon.
 * Odottaa että availableSkills on ladattu ennen hakua.
 *
 * @param {object} availableSkills  - Taitovalikoima (tarvitaan muunnokseen)
 * @param {React.MutableRefObject} isLoadingFromDB - Asetetaan true kun data haettu
 *
 * @returns {{
 *   selectedSkills: object,       - Taidot frontend-muodossa
 *   setSelectedSkills: function,  - State-settteri
 *   loading: boolean
 * }}
 *
 * @example
 * const { availableSkills } = useAvailableSkills();
 * const { selectedSkills, setSelectedSkills } = useCandidateSkills(availableSkills, isLoadingFromDB);
 */
export async function clearCandidateSkills() {
  await apiFetch("/api/database/candidate-profile", {
    method: "PUT",
    body: JSON.stringify({
      hardSkillsProficient: [],
      hardSkillsBasics: [],
      softSkillsProficient: [],
      softSkillsBasics: []
    }),
  });
}
export async function syncSkillsOnce(skills) {
  const { frontendSkillsToApplicantText } = await import("../utils/skillUtils");
  const applicantText = frontendSkillsToApplicantText(skills);
  if (!applicantText) return;

  const llmData = await apiFetch("/api/jobs/skills/applicant", {
    method: "POST",
    body: JSON.stringify({ applicantText }),
  });

  await apiFetch("/api/database/candidate-profile", {
    method: "PUT",
    body: JSON.stringify(llmData.skills),
  });
}
export function useCandidateSkills(availableSkills, isLoadingFromDB) {
  const [selectedSkills, setSelectedSkills] = useState({
    frontend: [], backend: [], tools: [], other: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSkills = useCallback((signal, isManualRefetch = false) => {
    if (availableSkills.frontend.length === 0) return;
    setLoading(true);
    setError(null);

    apiFetch("/api/database/candidate-profile", { signal })
      .then(dbProfile => {
        const hasData = Object.values(dbProfile).some(v => Array.isArray(v) && v.length > 0);
        if (hasData) {
          if (!isManualRefetch && isLoadingFromDB) isLoadingFromDB.current = true;
          setSelectedSkills(dbProfileToFrontendSkills(dbProfile, availableSkills));
        }
      })
      .catch(err => {
        if (err.name === "AbortError") return;
        console.warn("[useCandidateSkills]", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [availableSkills, isLoadingFromDB]);

  useEffect(() => {
    const controller = new AbortController();
    fetchSkills(controller.signal);
    return () => controller.abort();
  }, [fetchSkills]);

  return { selectedSkills, setSelectedSkills, loading, error, refetch: fetchSkills };
}

// ---------------------------------------------------------------------------
// usePortfolio
// ---------------------------------------------------------------------------
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
 *   updatePortfolio: function,   - Tallentaa koko portfolion (PUT)
 *   resetPortfolio: function,    - Nollaa portfolion tyhjään pohjaan (DELETE)
 * }}
 *
 * @example
 * const { portfolio, updatePortfolio } = usePortfolio();
 * await updatePortfolio({ name: "Matti", title: "Dev" });
 */

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null); // ← uusi

  useEffect(() => {
    const controller = new AbortController(); // ← uusi
    setError(null);

    apiFetch("/api/database/portfolio", { signal: controller.signal }) // ← signal mukaan
      .then(setPortfolio)
      .catch(err => {
        if (err.name === "AbortError") return; // ← abort ei ole virhe
        console.warn("[usePortfolio]", err);
        setError(err.message); // ← virhe näkyviin
      })
      .finally(() => setLoading(false));

    return () => controller.abort(); // ← cleanup
  }, []);

  const updatePortfolio = useCallback(async (portfolioData) => {
    setSaving(true);
    setError(null); // ← nollataan edellinen virhe ennen yritystä
    try {
      await apiFetch("/api/database/portfolio", {
        method: "PUT",
        body: JSON.stringify(portfolioData),
      });
      setPortfolio(prev => ({ ...prev, ...portfolioData }));
    } catch (err) {
      console.error("[usePortfolio] Tallennus epäonnistui:", err);
      setError(err.message); // ← virhe tilaan ennen heittoa
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const resetPortfolio = useCallback(async () => {
    setSaving(true);
    setError(null); // ← nollataan edellinen virhe ennen yritystä
    try {
      await apiFetch("/api/database/portfolio", { method: "DELETE" });
      const fresh = await apiFetch("/api/database/portfolio");
      setPortfolio(fresh);
    } catch (err) {
      console.error("[usePortfolio] Nollaus epäonnistui:", err);
      setError(err.message); // ← virhe tilaan ennen heittoa
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return { portfolio, loading, saving, error, updatePortfolio, resetPortfolio }; // ← error mukaan
}

// ---------------------------------------------------------------------------
// useAppliedJobs
// ---------------------------------------------------------------------------
/**
 * Hakee, tallentaa ja poistaa haettuja työpaikkoja.
 * Jokainen palautettu työpaikka sisältää rikastettuna:
 *   compatibility, recommended, matchedSkills, missingSkills
 *
 * @returns {{
 *   jobs: object[],
 *   loading: boolean,
 *   saving: boolean,
 *   saveJob: function,    - Lisää tai päivittää työpaikan (PUT /applied-jobs/:id)
 *   deleteJob: function,  - Poistaa työpaikan (DELETE /applied-jobs/:id)
 *   getJob: function,     - Hakee yksittäisen työpaikan ID:llä
 * }}
 *
 * @example
 * const { jobs, saveJob, deleteJob } = useAppliedJobs();
 * await saveJob("job-123", { title: "Frontend Dev", company: "Acme" });
 * await deleteJob("job-123");
 */
export function useAppliedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null); // ← uusi

  const fetchJobs = useCallback((signal) => { // ← signal parametrina
    setError(null);
    return apiFetch("/api/database/applied-jobs", { signal })
      .then(setJobs)
      .catch(err => {
        if (err.name === "AbortError") return; // ← abort ei ole virhe
        console.warn("[useAppliedJobs]", err);
        setError(err.message); // ← virhe näkyviin
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController(); // ← uusi
    fetchJobs(controller.signal).finally(() => setLoading(false));
    return () => controller.abort(); // ← cleanup
  }, [fetchJobs]);

  const saveJob = useCallback(async (id, jobData) => {
    setSaving(true);
    setError(null); // ← nollataan edellinen virhe ennen yritystä
    try {
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
    } catch (err) {
      console.error("[useAppliedJobs] Tallennus epäonnistui:", err);
      setError(err.message); // ← virhe tilaan ennen heittoa
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteJob = useCallback(async (id) => {
    setSaving(true);
    setError(null); // ← nollataan edellinen virhe ennen yritystä
    try {
      await apiFetch(`/api/database/applied-jobs/${id}`, { method: "DELETE" });
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch (err) {
      console.error("[useAppliedJobs] Poisto epäonnistui:", err);
      setError(err.message); // ← virhe tilaan ennen heittoa
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const getJob = useCallback(async (id) => {
    return apiFetch(`/api/database/applied-jobs/${id}`);
  }, []);

  return { jobs, loading, saving, error, saveJob, deleteJob, getJob }; // ← error mukaan
}