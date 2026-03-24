import { useState, useEffect, useRef, useCallback } from "react";
import { frontendSkillsToApplicantText, dbProfileToFrontendSkills } from "../../utils/skillUtils";
import { apiFetch } from "./useFetch";

const DEBOUNCE_MS = 1750;

// ---------------------------------------------------------------------------
// useSynchronizeCandidateSkills
// ---------------------------------------------------------------------------
/**
 * Synkronoi portfolion taidot automaattisesti tietokantaan LLM:n kautta.
 *
 * Toimintaperiaate:
 *   1. Käyttäjä muuttaa taitoja → debounce käynnistyy (1.75s hiljaisuus)
 *   2. Debounce laukeaa → LLM analysoi ja luokittelee taidot
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
      if (!signal.aborted) isSyncing.current = false;
    }
  }, [onStatusChange]);

  useEffect(() => {
    if (isLoadingFromDB?.current) {
      isLoadingFromDB.current = false;
      return;
    }
    if (!skills) return;

    onStatusChange?.("pending");

    const hasSkills = Object.values(skills).some(arr => arr.length > 0);
    if (!hasSkills) return;

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
 *   selectedSkills: object,
 *   setSelectedSkills: function,
 *   loading: boolean,
 *   error: string|null,
 *   refetch: function,
 * }}
 */
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
// Yksittäiset apufunktiot (ei hookki)
// ---------------------------------------------------------------------------

/**
 * Nollaa hakijan taitoprofiilin DB:ssä.
 */
export async function clearCandidateSkills() {
  await apiFetch("/api/database/candidate-profile", {
    method: "PUT",
    body: JSON.stringify({
      hardSkillsProficient: [],
      hardSkillsBasics: [],
      softSkillsProficient: [],
      softSkillsBasics: [],
    }),
  });
}

/**
 * Synkronoi taidot kerran LLM:n kautta (ei hookki, kutsutaan manuaalisesti).
 */
export async function syncSkillsOnce(skills) {
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