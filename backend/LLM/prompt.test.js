// Nämä testit on tuskallisen hitaita suorittaa. 
// laita .env tiedostoon RUN_AI_TESTS=true jos haluat ajaa nämä. Muuten skipataan koko test suite ja 5 testiä.

import { jest } from "@jest/globals";
import { analyzeGithubPortfolio } from "./portfolioAnalysis.js";
import { generateCoverLetter } from "./jobCoverLetter.js";
import { extractJobSkills, extractCandidateSkills } from "./jobExtractSkills.js";
import { summarizeJob } from "./jobSummary.js";
import { githubDataText, jobText, applicantText } from "./promptTestData.js";


const runAiTests = process.env.RUN_AI_TESTS === "true" && !!process.env.AZURE_OPENAI_KEY;

jest.setTimeout(30000);

(runAiTests ? describe : describe.skip)("analyzeGithubPortfolio – regression tests", () => {

    test("Realistic fullstack GitHub portfolio produces stable analysis", async () => {

        const result = await analyzeGithubPortfolio(githubDataText);

        // --- Rakenne ---
        expect(result).toHaveProperty("githubSkills");
        expect(result).toHaveProperty("projects");
        expect(result).toHaveProperty("activity");

        // --- Skills ---
        expect(Array.isArray(result.githubSkills)).toBe(true);
        expect(result.githubSkills.length).toBeGreaterThan(0);
        result.githubSkills.forEach(skill => {
            expect(skill).toHaveProperty("name");
            expect(skill).toHaveProperty("level");
            expect(skill).toHaveProperty("category");
            expect(skill).toHaveProperty("confidence");
            expect(skill).toHaveProperty("evidence");
            expect(typeof skill.name).toBe("string");
            expect(skill.level).toBeGreaterThanOrEqual(1);
            expect(skill.level).toBeLessThanOrEqual(5);
            expect(skill.confidence).toBeGreaterThanOrEqual(0);
            expect(skill.confidence).toBeLessThanOrEqual(1);
        });

        // --- Projektit ---
        expect(Array.isArray(result.projects)).toBe(true);
        expect(result.projects.length).toBeGreaterThan(0);
        result.projects.forEach(project => {
            expect(project).toHaveProperty("name");
            expect(project).toHaveProperty("description");
            expect(Array.isArray(project.technologies)).toBe(true);
            expect(Array.isArray(project.quality)).toBe(true);
            expect(project).toHaveProperty("type");
            expect(project).toHaveProperty("orderingPriority");
        });

        // --- Aktiviteetti ---
        expect(result.activity).toHaveProperty("consistency");
        expect(result.activity).toHaveProperty("recency");
        expect(result.activity).toHaveProperty("score");
        expect(Array.isArray(result.activity.bestPractices)).toBe(true);
    });

    test("generateCoverLetter does not crash", async () => {
        const matchData = { matchedKeywords: [] }; // tarvittaessa voit lisätä avainsanat
        const language = "Finnish";
    
        const coverLetter = await generateCoverLetter(jobText, applicantText, language, matchData);
    
        expect(typeof coverLetter).toBe("string");
        expect(coverLetter.length).toBeGreaterThan(0);
      });
    
      test("extractJobSkills does not crash", async () => {
        const skills = await extractJobSkills(jobText);
    
        expect(skills).toHaveProperty("hardSkillsRequired");
        expect(skills).toHaveProperty("hardSkillsOptional");
        expect(skills).toHaveProperty("softSkillsRequired");
        expect(skills).toHaveProperty("softSkillsOptional");
    
        expect(Array.isArray(skills.hardSkillsRequired)).toBe(true);
        expect(Array.isArray(skills.hardSkillsOptional)).toBe(true);
        expect(Array.isArray(skills.softSkillsRequired)).toBe(true);
        expect(Array.isArray(skills.softSkillsOptional)).toBe(true);
      });
    
      test("extractCandidateSkills does not crash", async () => {
        const skills = await extractCandidateSkills(applicantText);
    
        expect(skills).toHaveProperty("hardSkillsProficient");
        expect(skills).toHaveProperty("hardSkillsBasics");
        expect(skills).toHaveProperty("softSkillsProficient");
        expect(skills).toHaveProperty("softSkillsBasics");
    
        expect(Array.isArray(skills.hardSkillsProficient)).toBe(true);
        expect(Array.isArray(skills.hardSkillsBasics)).toBe(true);
        expect(Array.isArray(skills.softSkillsProficient)).toBe(true);
        expect(Array.isArray(skills.softSkillsBasics)).toBe(true);
      });
    
      test("summarizeJob does not crash", async () => {
        const summary = await summarizeJob(jobText);
    
        expect(summary).toHaveProperty("summary");
        expect(summary).toHaveProperty("technologies");
        expect(summary).toHaveProperty("hardSkills");
        expect(summary).toHaveProperty("softSkills");
        expect(summary).toHaveProperty("otherRelevantInfo");
    
        expect(typeof summary.summary).toBe("string");
        expect(Array.isArray(summary.technologies)).toBe(true);
        expect(Array.isArray(summary.hardSkills)).toBe(true);
        expect(Array.isArray(summary.softSkills)).toBe(true);
    
        const info = summary.otherRelevantInfo;
        expect(info).toHaveProperty("salary");
        expect(info).toHaveProperty("location");
        expect(info).toHaveProperty("remote");
        expect(info).toHaveProperty("employmentType");
      });

});