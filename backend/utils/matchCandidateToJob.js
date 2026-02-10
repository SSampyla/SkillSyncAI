/**
 * ==================================================================
 * KÄYTTÖOHJE
 * ==================================================================
 * Tämä lähti vähän keulimaan kun harjoittelin typed array käyttöä.
 * Jospa ohje selkeyttää, myös testit voi auttaa.
 * 
 * 
 * 
 * FUNKTIO: calculateMatch(jobSkills, candidateSkills)
 * 
 * * 1. jobSkills (Objekti):
 * Sisältää työpaikkailmoituksen vaatimukset jaettuna neljään taulukkoon.
 * {
 * hardSkillsRequired: string[], // Pakolliset kovat taidot (esim. "React")
 * hardSkillsOptional: string[], // Toivotut kovat taidot (esim. "Docker")
 * softSkillsRequired: string[], // Pakolliset pehmeät taidot (esim. "Tiimityö")
 * softSkillsOptional: string[]  // Toivotut pehmeät taidot (esim. "Johtaminen")
 * }
 * * 2. candidateSkills (Objekti):
 * Sisältää hakijan osaamisen jaettuna osaamistason mukaan.
 * {
 * hardSkillsProficient: string[], // Vahva osaaminen
 * hardSkillsBasics: string[],     // Perusteet
 * softSkillsProficient: string[], // Vahva osaaminen
 * softSkillsBasics: string[]      // Perusteet
 * }
 * 
 * * ESIMERKKIKUTSU:
 * * const job = {
 * hardSkillsRequired: ["JavaScript", "Node.js"],
 * hardSkillsOptional: ["Azure"],
 * softSkillsRequired: ["Suomi", "Tiimistyöskentely"],
 * softSkillsOptional: ["Englanti"]
 * };
 * * const candidate = {
 * hardSkillsProficient: ["javascript"], 
 * hardSkillsBasics: ["node", "azure", "C#"],
 * softSkillsProficient: ["suomi"],
 * softSkillsBasics: []
 * };
 * 
 * const result = calculateMatch(job, candidate);
 * 
 * 
 * FUNKTIO: getSkillMatchList(jobData, candidateData)
 * - Syötä sama data kuin calculateMatch funktioon, palauttaa kaksi listaa: matched skills ja missing skills.
 * 
 * FUNKTIO prepareSkillsForPrompt(jobData, candidateData)
 * - Sama idea, mutta käsittelee taidot valmiiksi merkkijonoksi
 * - Hyödyllinen esimerkiksi LLM-prompteja varten.
 * 
 * * HUOMIOITAVAA:
 * - Algoritmi normalisoi merkkijonot (poistaa välilyönnit, pisteet ja muuttaa pieniksi kirjaimiksi).
 * - SYNONYMS-vakio hoitaa synonyymit (esim. "nodejs" -> "node").
 * - Jos työpaikalla ei ole määriteltyjä taitoja, funktio palauttaa null.
 */

import { SYNONYMS } from "../config/synonyms.js";

// Skill painokertoimien vakiot. 
// Näitä saa muokata, jotta hard ja soft skillit painottuvat eri tavalla.
// REQ = Vaaiduttu taito (required)
// OPT = Olisi kiva jos hakija osaa (optional)
const W_HARD_REQ = 5;
const W_HARD_OPT = 3;
const W_SOFT_REQ = 3;
const W_SOFT_OPT = 1;

// Proficient = Hakija on hyvä tässä taidossa
// Basics = Osaa perusteet tästä taidosta.
const W_PROFICIENT = 1;
const W_BASICS = 0.4;

// ==========================================
// 1. Laitetaan taidot muistiin, ei haluta normalisoida samaa sanaa kahdesti
// ==========================================

// Välimuisti stringien normalisoinnille, ei tarvi pyörittää regexiä niin paljoa, kun otetaan jo normalisoidut talteen
const normalizeCache = new Map();

function createIdMapState() {
  return {
    skillToIdMap: new Map(),
    idToSkillMap: new Map(),
    nextId: 1
  };
}

// registerSkillId muuntaa tekstin numeroksi, jos teksti on uusi, se saa uuden id:n
function registerSkillId(skillText, state) {
  if (!skillText || typeof skillText !== 'string') return 0;

  // Tarkista onko sana jo normalisoitu aiemmin
  let normalized = normalizeCache.get(skillText);
  if (!normalized) {
    // Jos ei, normalisoi string
    normalized = skillText
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/#/g, "sharp")
      .replace(/\+/g, "p")
      .replace(/[\s\-_.]/g, "");

    normalized = SYNONYMS[normalized] || normalized;
    normalizeCache.set(skillText, normalized);
  }

  // Jos normalized on null (tyhjä string), palauta 0
  if (!normalized || normalized.length === 0) return 0;

  // Lopuksi muuta string ID-numeroksi, juokseva numero jota on kivempi käsitellä
  let id = state.skillToIdMap.get(normalized);
  if (!id) {
    id = state.nextId++;
    state.skillToIdMap.set(normalized, id);
    state.idToSkillMap.set(id, skillText);
  }
  return id;
}

// ==========================================
// 2. Muutetaan data objektit numeroiksi ja taulukoidaan ne
// ==========================================

// Rakentaa hakijan "osaamisprofiilin" numeroiksi
// Jos React skillin ID on kymmenen, asetetaan float32 skillProficiencyArray indeksi 10 arvoksi 0.4(W_BASICS) tai 1.0(W_PROFICIENT).
// Muut jäävät arvoksi 0.
function processHakija(hakija, state) {

  const tempMap = new Map();

  const collect = (arr, weight) => {
    if (!arr) return;
    for (let i = 0; i < arr.length; i++) {
      const id = registerSkillId(arr[i], state);
      if (id === 0) continue;
      const current = tempMap.get(id) || 0;
      if (weight > current) tempMap.set(id, weight);
    }
  };

  collect(hakija.hardSkillsProficient, W_PROFICIENT);
  collect(hakija.hardSkillsBasics, W_BASICS);
  collect(hakija.softSkillsProficient, W_PROFICIENT);
  collect(hakija.softSkillsBasics, W_BASICS);

  const skillProficiencyArray = new Float32Array(state.nextId + 1);

  for (const [id, weight] of tempMap) {
    skillProficiencyArray[id] = weight;
  }

  return skillProficiencyArray;
}

// Työpaikka data muutetaan kahdeksi TypedArrayksi. 
// Toinen int taulu, joka viittaa taito ID. Näitä taitoja vaaditaan
// Toinen float taulu, jossa painotuskerroin. Näin tärkeitä kyseiset taidot ovat
// Lopputuloksena on kaksi pientä lookup taulua.

function processJob(job, state) {
  const ids = [];
  const weights = [];

  const add = (arr, weight) => {
    if (!arr) return;
    for (let i = 0; i < arr.length; i++) {
      const id = registerSkillId(arr[i], state);
      if (id !== 0) {
        ids.push(id);
        weights.push(weight);
      }
    }
  };

  add(job.hardSkillsRequired, W_HARD_REQ);
  add(job.hardSkillsOptional, W_HARD_OPT);
  add(job.softSkillsRequired, W_SOFT_REQ);
  add(job.softSkillsOptional, W_SOFT_OPT);

  // Palauta TypedArrayt
  return {
    jobSkillIds: new Int32Array(ids),
    jobWeights: new Float32Array(weights),
    maxPoints: weights.reduce((a, b) => a + b, 0)
  };
}

// ==========================================
// 3. Suorita laskut
// ==========================================

export function calculateMatch(jobData, candidateData) {

  const state = createIdMapState();

  if (!jobData || !candidateData) {
    if (process.env.NODE_ENV !== "test") {
      console.warn('Job and candidate data required');
    }
    return null;
  }

  const job = processJob(jobData, state);
  if (job.maxPoints === 0) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("Job has no skill requirements");
    }
    return null;
  }

  const hakijaSkills = processHakija(candidateData, state);

  const jobSkillslength = job.jobSkillIds.length;
  const ids = job.jobSkillIds;
  const weights = job.jobWeights;

  let score = 0;

  // Tässä paukutetaan sitten se varsinainen laskenta hirveellä kiireellä taulukoista.
  // Hakee valitun taidon tiedot ID:n perusteella taulukoista
  // hakijaSkills[ids[i]] on suora muistiosoite hakijan taitotasoon (float arvo, joko [0, 0.4, 1.0])
  for (let i = 0; i < jobSkillslength; i++) {
    score += weights[i] * hakijaSkills[ids[i]];
  }

  return Math.round((score / job.maxPoints) * 100);
}

export function getSkillMatchList(jobData, candidateData) {

  const state = createIdMapState();

  if (!jobData || !candidateData) {
    return { matchedSkills: [], missingSkills: [] };
  }

  const job = processJob(jobData, state);

  if (job.jobSkillIds.length === 0) {
    return { matchedSkills: [], missingSkills: [] };
  }

  const hakijaSkills = processHakija(candidateData, state);
  const matchedSkills = [];
  const missingSkills = [];
  const ids = job.jobSkillIds;

  for (let i = 0; i < ids.length; i++) {
    const skillId = ids[i];
    const skillName = state.idToSkillMap.get(skillId);

    if (hakijaSkills[skillId] > 0) {
      matchedSkills.push(skillName);
    } else {
      missingSkills.push(skillName);
    }
  }

  return { matchedSkills, missingSkills };
}

export function prepareSkillsForPrompt(jobData, candidateData) {
  const { matchedSkills, missingSkills } = getSkillMatchList(jobData, candidateData);

  const matchedText = matchedSkills.length ? matchedSkills.join(", ") : "ei yhtään taitoa";
  const missingText = missingSkills.length ? missingSkills.join(", ") : "ei yhtään puuttuvaa taitoa";

  return `Hakijan taidot, jotka vastaavat työpaikkaa: ${matchedText}. Puuttuvat taidot: ${missingText}.`;
}