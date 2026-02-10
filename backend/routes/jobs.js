/**
 * ------------------------------------------------------------------
 * Routes - Jobs API
 * ------------------------------------------------------------------
 *
 * Määrittelee backendin API-endpointit työpaikkailmoituksille ja hakijaprofiilin AI-analyysille.
 * Huom! Nämä endpointit on todella hitaita. Voi hyvinkin kestää 0.5-10s ennenkuin vastaus saapuu.
 * Jos tarvitaan lisää vauhtia, pitää vaihtaa LLM azuren päästä vaikkapa GPT 4 miniin.
 *
 * Endpointit:
 *
 * 1. POST /api/jobs/summary
 * ------------------------------------------------
 * - Odottaa JSON: { jobText: "..." }
 * - Palauttaa: { summary: { ... }, responseTimeMs: number }
 *
 * 2. POST /api/jobs/skills/job
 * ------------------------------------------------
 * - Odottaa JSON: { jobText: "..." }
 * - Palauttaa työpaikan vaaditut ja toivotut taidot:
 *   {
 *     hardSkillsRequired: string[],
 *     hardSkillsOptional: string[],
 *     softSkillsRequired: string[],
 *     softSkillsOptional: string[]
 *   }
 * - Lisäksi vasteaika: responseTimeMs
 *
 * 3. POST /api/jobs/letter
 * ------------------------------------------------
 * - Odottaa JSON:
 *   {
 *     jobText,
 *     applicantText,
 *     language,
 *     matchData
 *   }
 *
 * - matchData voidaan tuottaa funktiolla:
 *   prepareSkillsForPrompt(jobData, candidateData)
 *
 * - language voi olla null → oletus suomi
 * - matchData voi olla null, mutta tod näk output on huonompi
 *
 * - Palauttaa:
 *   { coverLetter: "...", responseTimeMs: number }
 *
 * 4. POST /api/jobs/skills/applicant
 * ------------------------------------------------
 * - Odottaa JSON:
 *   { applicantText: "..." }
 *
 * - Palauttaa hakijan osaamisen luokiteltuna:
 *   {
 *     hardSkillsProficient: string[],
 *     hardSkillsBasics: string[],
 *     softSkillsProficient: string[],
 *     softSkillsBasics: string[]
 *   }
 *
 * - Lisäksi vasteaika: responseTimeMs
 *
 * Tätä dataa käytetään:
 * - calculateMatch()-funktiossa osaamisprosentin laskemiseen
 * - Gap Analysis -näkymässä
 * - Saatekirjeen personoinnissa
 */

import express from "express";
import { summarizeJob } from "../LLM/jobSummary.js";
import { extractJobSkills } from "../LLM/jobExtractSkills.js";
import { extractCandidateSkills } from "../LLM/jobExtractSkills.js";
import { generateCoverLetter } from "../LLM/jobCoverLetter.js";

const router = express.Router();
const MAX_TEXT_LENGTH = 20000; // Body json max 20k merkkiä (~3000-4000 sanaa). Voi muokata, jos ei riitä

// =============================
// ----- Virheen käsittely -----
// =============================

// Tarkista body tekstin pituus.
const validateJobText = (req, res, next) => {
  const { jobText } = req.body;

  if (!jobText?.trim()) {
    return res.status(400).json({ error: "Työpaikkailmoituksen teksti puuttuu." });
  }

  if (jobText.length > MAX_TEXT_LENGTH) {
    return res.status(413).json({ 
      error: `Teksti on liian pitkä. Maksimipituus on ${MAX_TEXT_LENGTH} merkkiä.` 
    });
  }

  next(); // Tarkistus ok, siirrytään varsinaisen reitin suoritukseen
};

const validateLetterInput = (req, res, next) => {
  const { applicantText, jobText } = req.body;

  if (!applicantText?.trim()) {
    return res.status(400).json({ error: "Hakijan yhteenveto puuttuu." });
  }

  if (!jobText?.trim()) {
    return res.status(400).json({ error: "Työpaikkailmoituksen teksti puuttuu." });
  }

  if (jobText.length > MAX_TEXT_LENGTH) {
    return res.status(413).json({ 
      error: `Työpaikkailmoitus on liian pitkä. Maksimipituus on ${MAX_TEXT_LENGTH} merkkiä.` 
    });
  }

  next();
};

const validateApplicantText = (req, res, next) => {
  const { applicantText } = req.body;

  if (!applicantText?.trim()) {
    return res.status(400).json({ error: "Hakijan teksti puuttuu." });
  }

  if (applicantText.length > MAX_TEXT_LENGTH) {
    return res.status(413).json({ 
      error: `Hakijan teksti on liian pitkä. Maksimi ${MAX_TEXT_LENGTH} merkkiä.` 
    });
  }

  next();
};

const handleRouteError = (res, err, startTime, context) => {
  const duration = Date.now() - startTime;
  console.error(`${context} failed (${duration} ms)`);

  if (err.status) {
    console.error("Azure OpenAI error:", {
      status: err.status,
      message: err.message,
      code: err.code
    });
    return res.status(502).json({ error: "Tekoälypalvelu ei vastannut oikein." });
  }

  console.error("Backend error:", err);
  res.status(500).json({ error: `Palvelinvirhe ${context.toLowerCase()}.` });
};


// =============================
// ----- /api/jobs/summary -----
// =============================

router.post("/summary", validateJobText, async (req, res) => {
  console.log("POST /api/jobs/summary called");
  const startTime = Date.now();

  try {
    const summary = await summarizeJob(req.body.jobText);
    const duration = Date.now() - startTime;
    
    console.log(`POST /api/jobs/summary success (${duration} ms)`);
    res.json({ summary, responseTimeMs: duration });

  } catch (err) {
    handleRouteError(res, err, startTime, "Ilmoituksen analysoinnissa");
  }
});

// ============================
// ----- /api/jobs/skills/job -----
// ============================

router.post("/skills/job", validateJobText, async (req, res) => {
  console.log("POST /api/jobs/skills/job called");
  const startTime = Date.now();

  try {
    const skills = await extractJobSkills(req.body.jobText);
    const duration = Date.now() - startTime;

    console.log(`POST /api/jobs/skills/job success (${duration} ms)`);
    res.json({ skills, responseTimeMs: duration });

  } catch (err) {
    handleRouteError(res, err, startTime, "Taitojen analysoinnissa");
  }
});

// ============================
// ----- /api/jobs/letter -----
// ============================

router.post("/letter", validateLetterInput, async (req, res) => {
  console.log("POST /api/jobs/letter called");
  const startTime = Date.now();

  try {

    const { applicantText, jobText, language, matchData } = req.body;
    const letterData = await generateCoverLetter(applicantText, jobText, language, matchData);

    const duration = Date.now() - startTime;
    console.log(`POST /api/jobs/letter success (${duration} ms)`);

    res.json({ coverLetter: letterData, responseTimeMs: duration });

  } catch (err) {
    handleRouteError(res, err, startTime, "Saatekirjeen generoinnissa");
  }
});

// ======================================
// ----- /api/jobs/skills/applicant -----
// ======================================

router.post("/skills/applicant", validateApplicantText, async (req, res) => {
  console.log("POST /api/jobs/skills/applicant called");
  const startTime = Date.now();

  try {

    const skills = await extractCandidateSkills(req.body.applicantText);
    const duration = Date.now() - startTime;

    console.log(`POST /api/jobs/skills/applicant success (${duration} ms)`);

    res.json({ 
      skills,
      responseTimeMs: duration 
    });

  } catch (err) {
    handleRouteError(res, err, startTime, "Hakijan taitojen analysoinnissa");
  }
});

export default router;