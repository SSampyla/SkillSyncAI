import express from "express";
import { asyncHandler, getCache, setCache, createCacheKey } from "../utils/apiCoreLLM.js";
import { createValidator, validatePortfolio } from "../utils/routeValidatorsLLM.js";
import { analyzeGithubPortfolio } from "../LLM/portfolioAnalysis.js";

const router = express.Router();

router.post(
  "/analysis",
  createValidator(validatePortfolio),

  asyncHandler(async (req) => {
    console.log("[LLM route: GitHub portfolio analysis called]");

    const cacheKey = createCacheKey("portfolio_analysis", req.body);

    const cached = getCache(cacheKey);
    if (cached) return cached;

    const analysis = await analyzeGithubPortfolio(req.body.portfolioText);

    const response = { analysis };

    setCache(cacheKey, response, 1000 * 60 * 60); // säilytä 1h cache

    return response;
  }, "GitHub-portfolion analysointi")
);

export default router;