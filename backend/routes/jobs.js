import express from "express";
import { asyncHandler, getCache, setCache, createCacheKey } from "../utils/apiCoreLLM.js";
import { createValidator, validateJobText, validateCoverLetter, validateApplicantText } from "../utils/routeValidatorsLLM.js";
import { summarizeJob } from "../LLM/jobSummary.js";
import { extractJobSkills, extractCandidateSkills } from "../LLM/jobExtractSkills.js";
import { generateCoverLetter } from "../LLM/jobCoverLetter.js";

/*
# Job & Cover Letter API
Tämä reititin käsittelee työpaikkailmoitusten analysointia ja työhakemusten (Cover Letter) generointia LLM:n avulla.

## Caching
`/letter` -reitissä on sisäänrakennettu versionhallinta:

1. **Uuden luonti:** Kun kutsut reittiä ilman `versionId` -kenttää, backend generoi uuden kirjeen ja palauttaa sen mukana uniikin ID:n (esim. `versionId: "cv_123xyz"`).
2. **Vanhan haku:** Jos käyttäjä haluaa palata tähän tiettyyn versioon (esim. peruuttaa muutoksen tai vaihtaa näkymää), lähetä pyynnön bodyssä saamasi `versionId`. Backend palauttaa välimuistista kyseisen version nopeasti.
3. Jos versio ID on väärä, generoidaan uusi kirje ja uusi ID.

## Reitit

### `POST /summary` | `POST /skills/job` | `POST /skills/applicant`
Perusanalyysireitit. Palauttavat yhteenvedon tai taidot.
* **Välimuisti:** Automaattinen. Sama payload palauttaa aina saman tuloksen (1 tunnin ajan).

### `POST /letter`
Generoi työhakemuksen (Cover letter).
* **Body:** `{ jobText, applicantText, language, matchData, versionId? }`
* **Paluuarvo:** `{ coverLetter: "...", versionId: "cv_1710..." }`
*/

const router = express.Router();

router.post(
  "/summary",
  createValidator(validateJobText),

  asyncHandler(async (req) => {
    console.log("[LLM route: Job summary called]");

    const cacheKey = createCacheKey("job_summary", req.body);
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const summary = await summarizeJob(req.body.jobText);

    const response = { summary };

    setCache(cacheKey, response, 1000 * 60 * 60); // 1h

    return response;

  }, "Ilmoituksen analysointi")
);

router.post(
  "/skills/job",
  createValidator(validateJobText),

  asyncHandler(async (req) => {

    console.log("[Extract job skills called]");

    const cacheKey = createCacheKey("job_skills", req.body);

    const cached = getCache(cacheKey);
    if (cached) return cached;

    const skills = await extractJobSkills(req.body.jobText);

    const response = { skills };

    setCache(cacheKey, response, 1000 * 60 * 60);

    return response;

  }, "Taitojen analysointi")
);

router.post(
  "/skills/applicant",
  createValidator(validateApplicantText),

  asyncHandler(async (req) => {
    console.log("[Extract applicant skills called]");

    const { applicantText } = req.body;

    const cacheKey = createCacheKey("applicant_skills", { applicantText });

    const cached = getCache(cacheKey);
    if (cached) return cached;

    const skills = await extractCandidateSkills(applicantText);

    const response = { skills };

    setCache(cacheKey, response, 1000 * 60 * 60); // 1h

    return response;

  }, "Hakijan taitojen analysointi")
);

router.post(
  "/letter",
  createValidator(validateCoverLetter),

  asyncHandler(async (req) => {
    console.log("[LLM route: Cover letter called]");

    const { jobText, applicantText, language, matchData, versionId } = req.body;

    // 1. Jos versionId on annettu, yritetään hakea se suoraan cachesta
    if (versionId) {
      const cachedVersion = getCache(versionId);
      if (cachedVersion) {
        console.log(`[Cache Hit] Haetaan versio: ${versionId}`);
        return cachedVersion;
      }
      console.log(`[Cache Miss] Versiota ${versionId} ei löytynyt, generoidaan uusi.`);
    }

    // 2. Generoidaan uusi kirje (oletusarvo, jos ID:tä ei ole tai se on vanha)
    const coverLetter = await generateCoverLetter(
      jobText,
      applicantText,
      language,
      matchData
    );

    // 3. Luodaan uniikki ID tälle uudelle versiolle
    // Käytetään yksinkertaista koostetta: cv_ + aikaleima + lyhyt random-pätkä
    const newVersionId = `cv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const response = { 
      coverLetter, 
      versionId: newVersionId 
    };

    // 4. Validointi ja tallennus cacheen uniikilla ID:llä
    if (
      typeof coverLetter === "string" &&
      coverLetter.trim().length > 50 &&
      !coverLetter.includes("LLM did not")
    ) {
      // Tallennetaan ID:llä, jotta frontend voi hakea tämän uudestaan tarvittaessa
      setCache(newVersionId, response, 1000 * 60 * 60); // 1h
      
      // Tallennetaan lisäksi input-perusteisella avaimella
      const inputCacheKey = createCacheKey("cover_letter", { jobText, applicantText, language, matchData });
      setCache(inputCacheKey, response, 1000 * 60 * 60);
    } else {
      console.warn("[Cover Letter] Skipped caching invalid/fallback output.");
    }

    return response;
  }, "Hakemuksen generointi")
);

export default router;