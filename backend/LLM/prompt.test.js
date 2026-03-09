// Nämä testit on tuskallisen hitaita suorittaa. 
// laita .env tiedostoon RUN_AI_TESTS=true jos haluat ajaa nämä. Muuten skipataan koko test suite ja 5 testiä.

import { jest } from "@jest/globals";
import { analyzeGithubPortfolio } from "./portfolioAnalysis.js";
import { generateCoverLetter } from "./jobCoverLetter.js";
import { generateLearningRecommendations } from "./portfolioRecommendations.js";
import { extractJobSkills, extractCandidateSkills } from "./jobExtractSkills.js";
import { summarizeJob } from "./jobSummary.js";
import { githubDataText, jobText, applicantText, learningJobSkills, learningCandidateSkills } from "../../data/promptTestData.js";
import { generateEditedCV } from "./cvEdit.js";
import { generateInterviewReply } from "./interviewPractice.js";

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

(runAiTests ? describe : describe.skip)(
  "generateLearningRecommendations – regression tests",
  () => {

    test("returns valid recommendation structure", async () => {

      const result = await generateLearningRecommendations(
        learningJobSkills,
        learningCandidateSkills,
        "Finnish"
      );

      expect(result).toHaveProperty("prioritySkills");
      expect(result).toHaveProperty("supportingSkills");
      expect(result).toHaveProperty("alreadyStrong");
      expect(result).toHaveProperty("summary");

      expect(Array.isArray(result.prioritySkills)).toBe(true);
      expect(Array.isArray(result.supportingSkills)).toBe(true);
      expect(Array.isArray(result.alreadyStrong)).toBe(true);
      expect(typeof result.summary).toBe("string");

      result.prioritySkills.forEach(skill => {
        expect(skill).toHaveProperty("skill");
        expect(skill).toHaveProperty("demandFrequency");
        expect(skill).toHaveProperty("candidateLevel");
        expect(skill).toHaveProperty("priorityScore");
        expect(skill).toHaveProperty("reason");

        expect(typeof skill.skill).toBe("string");
        expect(typeof skill.reason).toBe("string");

        expect(skill.priorityScore).toBeGreaterThanOrEqual(0);
        expect(skill.priorityScore).toBeLessThanOrEqual(1);

        expect(["none", "basics", "proficient"])
          .toContain(skill.candidateLevel);
      });
    });


    test("handles empty job market data safely", async () => {

      const result = await generateLearningRecommendations(
        [],
        learningCandidateSkills,
        "Finnish"
      );

      expect(result.prioritySkills).toEqual([]);
      expect(result.supportingSkills).toEqual([]);
      expect(result.alreadyStrong).toEqual([]);
      expect(typeof result.summary).toBe("string");
    });

    (runAiTests ? describe : describe.skip)("editCVForJob – regression tests", () => {

      let rawResult;

      beforeAll(async () => {
        rawResult = await generateEditedCV(jobText, applicantText, "Finnish");

        expect(typeof rawResult).toBe("object");
        expect(rawResult).toHaveProperty("editedCV");
        expect(typeof rawResult.editedCV).toBe("string");
      });

      test("returns non-empty editedCV text", () => {
        expect(rawResult.editedCV.length).toBeGreaterThan(0);
      });

      test("edited CV differs from original CV", () => {
        expect(rawResult.editedCV.trim()).not.toEqual(applicantText.trim());
      });

      test("editedCV is valid string", () => {
        expect(typeof rawResult.editedCV).toBe("string");
      });

    });

  });

(runAiTests ? describe : describe.skip)("generateInterviewReply – regression tests", () => {

  let chatHistory;

  beforeAll(() => {
    // Aloitetaan tyhjällä chat historyllä
    chatHistory = [];
  });

  test("AI interview reply returns valid JSON structure", async () => {
    const phase = "intro";
    const language = "Finnish";

    const result = await generateInterviewReply(chatHistory, jobText, phase, language);

    // --- STRUCTURE ---
    expect(result).toHaveProperty("nextQuestion");
    expect(result).toHaveProperty("followUp");
    expect(result).toHaveProperty("answerEvaluation");

    const evalObj = result.answerEvaluation;

    expect(evalObj).toHaveProperty("clarity");
    expect(evalObj).toHaveProperty("technicalDepth");
    expect(evalObj).toHaveProperty("communication");

    // --- TYPES ---
    expect(result.nextQuestion === null || typeof result.nextQuestion === "string").toBe(true);
    expect(typeof result.followUp).toBe("boolean");

    expect(typeof evalObj.clarity).toBe("number");
    expect(typeof evalObj.technicalDepth).toBe("number");
    expect(typeof evalObj.communication).toBe("number");

    // --- VALUE RANGES ---
    expect(evalObj.clarity).toBeGreaterThanOrEqual(0);
    expect(evalObj.clarity).toBeLessThanOrEqual(1);
    expect(evalObj.technicalDepth).toBeGreaterThanOrEqual(0);
    expect(evalObj.technicalDepth).toBeLessThanOrEqual(1);
    expect(evalObj.communication).toBeGreaterThanOrEqual(0);
    expect(evalObj.communication).toBeLessThanOrEqual(1);
  });

  test("AI can handle multiple chat turns without crashing", async () => {
    const phase = "technical";
    const language = "Finnish";

    // Simuloi ensimmäinen AI kysymys
    chatHistory.push({
      role: "assistant",
      content: "Kerro kokemuksestasi React-projekteissa."
    });

    // Simuloi käyttäjän vastaus
    chatHistory.push({
      role: "user",
      content: "Olen rakentanut useita web-sovelluksia Reactilla viimeisten 3 vuoden aikana."
    });

    const result = await generateInterviewReply(chatHistory, jobText, phase, language);

    // Varmistetaan rakenteen ja arvon säilyminen
    expect(result).toHaveProperty("nextQuestion");
    expect(result).toHaveProperty("followUp");
    expect(result).toHaveProperty("answerEvaluation");

    const evalObj = result.answerEvaluation;
    expect(evalObj.clarity).toBeGreaterThanOrEqual(0);
    expect(evalObj.clarity).toBeLessThanOrEqual(1);
  });

  test("nextQuestion is null only in feedback phase", async () => {
    const phase = "feedback";
    const result = await generateInterviewReply(chatHistory, jobText, phase, "Finnish");

    if (result.nextQuestion === null) {
      expect(phase).toBe("feedback");
    } else {
      expect(typeof result.nextQuestion).toBe("string");
    }
  });

});