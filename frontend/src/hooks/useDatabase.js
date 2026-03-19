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
 *   useCandidateProfile            — Hakee hakijan profiilin DB:stä ja muuntaa sen
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
 *   Muunnos tehdään dbProfileToFrontendSkills-funktiolla (skillTransformer.js).
 * 
 * testejä varten: npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
 * 
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { frontendSkillsToApplicantText, dbProfileToFrontendSkills } from "../utils/skillUtils";

const DEBOUNCE_MS = 2500;
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
 *      (hardSkillsProficient / softSkillsBasics jne.)
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

  const runSync = useCallback(async (currentSkills) => {
    if (isSyncing.current) return;

    const applicantText = frontendSkillsToApplicantText(currentSkills);
    if (!applicantText) return;

    isSyncing.current = true;
    onStatusChange?.("syncing");

    try {
      // 1. LLM luokittelee taidot proficient/basics-muotoon
      const llmData = await apiFetch("/api/jobs/skills/applicant", {
        method: "POST",
        body: JSON.stringify({ applicantText }),
      });

      // 2. Tallennetaan DB:n candidateProfile-kenttään
      await apiFetch("/api/database/candidate-profile", {
        method: "PUT",
        body: JSON.stringify(llmData.skills),
      });

      onStatusChange?.("saved");
    } catch (err) {
      console.error("[useSynchronizeCandidateSkills]", err);
      onStatusChange?.("error");
    } finally {
      isSyncing.current = false;
    }
  }, [onStatusChange]);

  useEffect(() => {
    // Ohitetaan jos data tuli juuri DB:stä — ei lähetetä sitä takaisin
    if (isLoadingFromDB?.current) {
      isLoadingFromDB.current = false;
      return;
    }

    if (!skills) return;

    onStatusChange?.("pending");
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => runSync(skills), DEBOUNCE_MS);
    return () => clearTimeout(debounceTimer.current);
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
    apiFetch("/api/database/available-skills")
      .then(setAvailableSkills)
      .catch(err => {
        console.warn("[useAvailableSkills] Haku epäonnistui:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return { availableSkills, loading, error };
}

// ---------------------------------------------------------------------------
// useCandidateProfile
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
 * const { selectedSkills, setSelectedSkills } = useCandidateProfile(availableSkills, isLoadingFromDB);
 */
export function useCandidateProfile(availableSkills, isLoadingFromDB) {
  const [selectedSkills, setSelectedSkills] = useState({
    frontend: [], backend: [], tools: [], other: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Odotetaan että availableSkills on ladattu — tarvitaan muunnokseen
    if (availableSkills.frontend.length === 0) return;

    setLoading(true);
    apiFetch("/api/database/candidate-profile")
      .then(dbProfile => {
        const hasData = Object.values(dbProfile).some(
          v => Array.isArray(v) && v.length > 0
        );
        if (hasData) {
          if (isLoadingFromDB) isLoadingFromDB.current = true;
          setSelectedSkills(dbProfileToFrontendSkills(dbProfile, availableSkills));
        }
      })
      .catch(err => console.warn("[useCandidateProfile] Haku epäonnistui:", err))
      .finally(() => setLoading(false));
  }, [availableSkills]);

  return { selectedSkills, setSelectedSkills, loading };
}

// ---------------------------------------------------------------------------
// usePortfolio
// ---------------------------------------------------------------------------
/**
 * Hakee, päivittää ja nollaa portfolion.
 *
 * Huomio: skills-kenttä tulee candidateProfilesta (ks. useCandidateProfile),
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

  useEffect(() => {
    apiFetch("/api/database/portfolio")
      .then(setPortfolio)
      .catch(err => console.warn("[usePortfolio] Haku epäonnistui:", err))
      .finally(() => setLoading(false));
  }, []);

  const updatePortfolio = useCallback(async (portfolioData) => {
    setSaving(true);
    try {
      await apiFetch("/api/database/portfolio", {
        method: "PUT",
        body: JSON.stringify(portfolioData),
      });
      setPortfolio(prev => ({ ...prev, ...portfolioData }));
    } catch (err) {
      console.error("[usePortfolio] Tallennus epäonnistui:", err);
      throw err; // annetaan komponentin käsitellä
    } finally {
      setSaving(false);
    }
  }, []);

  const resetPortfolio = useCallback(async () => {
    setSaving(true);
    try {
      await apiFetch("/api/database/portfolio", { method: "DELETE" });
      // Haetaan tyhjä pohja uudelleen
      const fresh = await apiFetch("/api/database/portfolio");
      setPortfolio(fresh);
    } catch (err) {
      console.error("[usePortfolio] Nollaus epäonnistui:", err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return { portfolio, loading, saving, updatePortfolio, resetPortfolio };
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

  const fetchJobs = useCallback(() => {
    return apiFetch("/api/database/applied-jobs")
      .then(setJobs)
      .catch(err => console.warn("[useAppliedJobs] Haku epäonnistui:", err));
  }, []);

  useEffect(() => {
    fetchJobs().finally(() => setLoading(false));
  }, [fetchJobs]);

  const saveJob = useCallback(async (id, jobData) => {
    setSaving(true);
    try {
      const result = await apiFetch(`/api/database/applied-jobs/${id}`, {
        method: "PUT",
        body: JSON.stringify(jobData),
      });
      // Päivitetään paikallinen tila hakematta koko listaa uudelleen
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
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteJob = useCallback(async (id) => {
    setSaving(true);
    try {
      await apiFetch(`/api/database/applied-jobs/${id}`, { method: "DELETE" });
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch (err) {
      console.error("[useAppliedJobs] Poisto epäonnistui:", err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const getJob = useCallback(async (id) => {
    return apiFetch(`/api/database/applied-jobs/${id}`);
  }, []);

  return { jobs, loading, saving, saveJob, deleteJob, getJob };
}