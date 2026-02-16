import express from "express";
import { analyzeGithubPortfolio } from "../LLM/portfolioAnalysis.js";
import { generateLearningRecommendations } from "../LLM/portfolioRecommendations.js";

const router = express.Router();
const MAX_TEXT_LENGTH = 30000; // Maks prompti koko, voi kasvattaa jos ei riitä

// =============================
// ----- Validointi -----
// =============================

const validatePortfolioText = (req, res, next) => {
  const { portfolioText } = req.body;

  if (!portfolioText?.trim()) {
    return res.status(400).json({ error: "portfolioText data puuttuu." });
  }

  if (portfolioText.length > MAX_TEXT_LENGTH) {
    return res.status(413).json({
      error: `portfolioText on liian pitkä. Maksimi ${MAX_TEXT_LENGTH} merkkiä.`
    });
  }

  next();
};

const validateLearningRecom = (req, res, next) => {
  const { jobSkillsRequiredAll, candidateSkills } = req.body;

  if (!Array.isArray(jobSkillsRequiredAll)) {
    return res.status(400).json({ error: "jobSkillsRequiredAll pitää olla taulukko." });
  }

  if (!candidateSkills || typeof candidateSkills !== 'object') {
    return res.status(400).json({ error: "candidateSkills puuttuu tai on viallinen." });
  }

  // Tarkista myös tekstin kokonaispituus, ettei prompti paisu yli rajojen
  const payloadSize = JSON.stringify(req.body).length;
  if (payloadSize > MAX_TEXT_LENGTH) {
    return res.status(413).json({ error: "Syöte on liian suuri analysoitavaksi." });
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

// =====================================
// ----- /api/portfolio/analysis -----
// =====================================

router.post("/analysis", validatePortfolioText, async (req, res) => {
  console.log("POST /api/portfolio/analysis called");
  const startTime = Date.now();

  try {
    const analysis = await analyzeGithubPortfolio(req.body.portfolioText);
    const duration = Date.now() - startTime;

    console.log(`POST /api/portfolio/analysis success (${duration} ms)`);

    res.json({
      analysis,
      responseTimeMs: duration
    });

  } catch (err) {
    handleRouteError(res, err, startTime, "GitHub-portfolion analysoinnissa");
  }
});

// =============================================
// ----- /api/portfolio/learningrecom -----
// =============================================

router.post("/learningrecom", validateLearningRecom, async (req, res) => {
  console.log("POST /api/portfolio/learningrecom called");
  const startTime = Date.now();

  try {
    const { jobSkillsRequiredAll, candidateSkills } = req.body;

    if (jobSkillsRequiredAll.length === 0) {
      console.log("jobSkillsRequiredAll oli tyhjä.");
      return res.json({
        recommendations: {
          prioritySkills: [],
          supportingSkills: [],
          alreadyStrong: [],
          summary: "Ei tarpeeksi dataa analyysiin."
        },
        responseTimeMs: 0
      });
    }

    const recommendations = await generateLearningRecommendations(
      jobSkillsRequiredAll,
      candidateSkills
    );

    const duration = Date.now() - startTime;
    console.log(`POST /api/portfolio/learningrecom success (${duration} ms)`);

    res.json({
      recommendations,
      responseTimeMs: duration
    });

  } catch (err) {
    handleRouteError(
      res,
      err,
      startTime,
      "Oppimissuositusten analysoinnissa"
    );
  }
});

export default router;
