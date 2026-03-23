import express from "express";
import { readDB, writeDB, INITIAL_STATE, createEmptyPortfolio } from "../services/dbService.js";
import { asyncHandler } from "../utils/apiCoreLLM.js";
import { calculateMatch, getSkillMatchList } from "../utils/matchCandidateToJob.js";
import { dbProfileToFrontendSkills,  } from "../utils/apiCoreDB.js";

const router = express.Router();

// --- APUFUNKTIOT ---

/**
 * Rikastaa työpaikkadatat yhteensopivuusluvuilla.
 */
const enrich = (job, profile) => {
    if (!job) return null;
    const compatibility = calculateMatch(job, profile) || 0;
    const matches = getSkillMatchList(job, profile);

    return {
        ...job,
        compatibility,
        recommended: compatibility >= 75,
        matchedSkills: matches.matchedSkills || [],
        missingSkills: matches.missingSkills || []
    };
};

// --- VALIDONTI ---
// const isValidPortfolio = (p) => p && typeof p === 'object' && typeof p.name === 'string';

const isValidSkillForDB = (p) => 
    p && typeof p === 'object' && 
    ["hardSkillsProficient", "hardSkillsBasics", "softSkillsProficient", "softSkillsBasics"]
    .every(k => Array.isArray(p[k]));


// --- REITIT ---

// DEBUG & TOOLS
router.get("/full", asyncHandler(readDB, "Koko db haku"));

// =========================================================
//  FRONTEND SKILLS DATA /api/database/candidate-profile
// =========================================================
router.get("/available-skills", asyncHandler(async () => {
    const db = await readDB();
    return db.availableSkills;
}, "Taitojen haku"));

// =========================================================
//  HAKIJAN PROFIILI /api/database/candidate-profile
// =========================================================
// HAKIJAN PROFIILI /api/database/candidate-profile
router.get("/candidate-profile", asyncHandler(async () => {
    const db = await readDB();
    return db.candidateProfile;
}, "Profiilin haku"));

router.put("/candidate-profile", asyncHandler(async (req) => {
    const db = await readDB();
    if (!isValidSkillForDB(req.body)) return { success: false, candidateProfile: db.candidateProfile };
    
    db.candidateProfile = req.body;
    await writeDB(db);
    return { success: true, candidateProfile: db.candidateProfile };
}, "Profiilin päivitys"));

// =======================================
//  TYÖPAIKAT /api/database/applied-jobs/
// =======================================
router.get("/applied-jobs", asyncHandler(async () => {
    const db = await readDB();
    return db.appliedJobs.map(job => enrich(job, db.candidateProfile));
}, "Työpaikkojen listaus"));

router.get("/applied-jobs/:id", asyncHandler(async (req) => {
    const db = await readDB();
    const job = db.appliedJobs.find(j => j.id === req.params.id);
    return enrich(job, db.candidateProfile); // Palauttaa null jos ei löydy
}, "Yksittäinen työpaikka"));

router.put("/applied-jobs/:id", asyncHandler(async (req) => {
    if (!req.body) return { success: false };
    const db = await readDB();
    
    // Poistetaan lasketut kentät ennen tallennusta (Keep data pure)
    const { compatibility, recommended, matchedSkills, missingSkills, ...pureJob } = req.body;
    const jobData = { ...pureJob, id: req.params.id };

    const index = db.appliedJobs.findIndex(j => j.id === req.params.id);
    if (index !== -1) db.appliedJobs[index] = { ...db.appliedJobs[index], ...jobData };
    else db.appliedJobs.push(jobData);

    await writeDB(db);
    return { success: true, job: enrich(jobData, db.candidateProfile) };
}, "Työpaikan tallennus"));

router.delete("/applied-jobs/:id", asyncHandler(async (req) => {
    const db = await readDB();
    db.appliedJobs = db.appliedJobs.filter(j => j.id !== req.params.id);
    await writeDB(db);
    return { success: true, deletedId: req.params.id };
}, "Työpaikan poisto"));

// =======================================
//  PORTFOLIO /api/database/portfolio
// =======================================

/**
 * Hakee koko portfolion. Jos sitä ei ole, palauttaa tyhjän pohjan.
 */
router.get("/portfolio", asyncHandler(async () => {
    const db = await readDB();
    
    //Lisätään taidot candidateProfile-kentästä portfolioon fronttia varten
    const categorizedSkills = dbProfileToFrontendSkills(db.candidateProfile, db.availableSkills);
    
    return {
        ...(db.portfolio || {}),
        skills: categorizedSkills 
    };
}, "Portfolion haku"));

/**
 * Päivittää KOKO portfolion kerralla (Over-write).
 */
router.put("/portfolio", asyncHandler(async (req) => {
    const db = await readDB();
    
    // Erotetaan taidot, koska niitä hallitaan hookin kautta candidateProfile-kentässä
    const { skills, ...portfolioData } = req.body;

    // Tallennetaan vain "puhdas" portfolio
    db.portfolio = portfolioData;

    await writeDB(db);
    return { success: true };
}, "Portfolion päivitys"));

/**
 * Tyhjentää portfolion (nollaa tietokannan kentän).
 */

router.delete("/portfolio", asyncHandler(async () => {
    const db = await readDB();
    // Nollataan takaisin alkutilaan nullin sijaan
    db.portfolio = createEmptyPortfolio(); 
    await writeDB(db);
    return { success: true, message: "Portfolio nollattu" };
}, "Portfolion nollaus"));

/**
 * Portfolioprojektien CRUD-reitit
 */

router.get("/portfolio-projects", asyncHandler(async () => {
    const db = await readDB();
    return { projects: db.portfolioProjects ?? [] };
}, "Projektien haku"));

// POST
router.post("/portfolio-projects", asyncHandler(async (req) => {
    const db = await readDB();
    const newProject = {
        ...req.body,
        id: `proj_${Date.now()}`,
        createdAt: new Date().toISOString()
    };
    db.portfolioProjects = [newProject, ...(db.portfolioProjects ?? [])];
    await writeDB(db);
    return { success: true, project: newProject };
}, "Projektin luonti"));

// PUT
router.put("/portfolio-projects/:id", asyncHandler(async (req) => {
    const db = await readDB();
    const idx = db.portfolioProjects.findIndex(p => p.id === req.params.id);
    if (idx === -1) return { success: false };
    db.portfolioProjects[idx] = { ...db.portfolioProjects[idx], ...req.body };
    await writeDB(db);
    return { success: true, project: db.portfolioProjects[idx] };
}, "Projektin päivitys"));

// DELETE
router.delete("/portfolio-projects/:id", asyncHandler(async (req) => {
    const db = await readDB();
    db.portfolioProjects = db.portfolioProjects.filter(p => p.id !== req.params.id);
    await writeDB(db);
    return { success: true, deletedId: req.params.id };
}, "Projektin poisto"));

export default router;