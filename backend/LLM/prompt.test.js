// Nämä testit on tuskallisen hitaita suorittaa koska odotellaan tekoälyn vastauksia useaan otteeseen. 
// laita .env tiedostoon RUN_AI_TESTS=true jos haluat ajaa nämä. Muuten skipataan koko test suite.
// Huom. nämä testit voi joskus epäonnistua AI:n sekoilun vuoksi, mutta yleensä pitäisi mennä läpi. 
// Jos ne epäonnistuu, kannattaa ensin ajaa uudestaan.

import { jest } from "@jest/globals";
import { analyzeGithubPortfolio } from "./portfolioAnalysis.js";
import { generateCoverLetter } from "./jobCoverLetter.js";
import { generateLearningRecommendations } from "./portfolioRecommendations.js";
import { extractJobSkills } from "./jobExtractSkills.js";
import { summarizeJob } from "./jobSummary.js";
import { githubDataText, jobText, applicantText, learningJobSkills, learningCandidateSkills } from "../data/promptTestData.js";
import { generateEditedCV } from "./cvEdit.js";
import { generateInterviewReply } from "./interviewPractice.js";
import { getCache, setCache, createCacheKey } from "../utils/apiCoreLLM.js";

const runAiTests = process.env.RUN_AI_TESTS === "true" && !!process.env.AZURE_OPENAI_KEY;

const assertCacheWorks = (firstDuration, secondDuration, label = "") => {
  const prefix = label ? `[Cache ${label}]` : "[Cache]";
  console.log(`${prefix} LLM: ${firstDuration}ms → cache: ${secondDuration}ms`);

  expect(secondDuration).toBeLessThan(
    Math.min(firstDuration / 5, 200)
  );
};

jest.setTimeout(30000);

(runAiTests ? describe : describe.skip)("analyzeGithubPortfolio – regression tests", () => {

  test("Realistic fullstack GitHub portfolio produces stable analysis", async () => {

    const start1 = Date.now();
    const result = await analyzeGithubPortfolio(githubDataText);
    const duration1 = Date.now() - start1;

    const start2 = Date.now();
    const cached = await analyzeGithubPortfolio(githubDataText);
    const duration2 = Date.now() - start2;

    expect(cached).toEqual(result);
    assertCacheWorks(duration1, duration2, "analyzeGithubPortfolio");

    // --- Rakenne ---
    expect(result).toHaveProperty("githubSkills");
    expect(result).toHaveProperty("projects");
    expect(result).toHaveProperty("activity");

    // --- Skills ---
    expect(Array.isArray(result.githubSkills)).toBe(true);
    expect(result.githubSkills.length).toBeGreaterThan(0);
    expect(result.githubSkills[0].name).not.toBe("");
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
    expect(result.projects[0].name).not.toBe("");
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
    expect(coverLetter.length).toBeGreaterThan(100);
    expect(coverLetter).toMatch(/Terveystalo|developer|intern/i);
  });

  test("test extractJobSkills with cahching", async () => {

    const start1 = Date.now();
    const skills = await extractJobSkills(jobText);
    const duration1 = Date.now() - start1;

    const start2 = Date.now();
    const cached = await extractJobSkills(jobText);
    const duration2 = Date.now() - start2;

    expect(skills).toHaveProperty("hardSkillsRequired");
    expect(skills).toHaveProperty("hardSkillsOptional");
    expect(skills).toHaveProperty("softSkillsRequired");
    expect(skills).toHaveProperty("softSkillsOptional");

    expect(Array.isArray(skills.hardSkillsRequired)).toBe(true);
    expect(Array.isArray(skills.hardSkillsOptional)).toBe(true);
    expect(Array.isArray(skills.softSkillsRequired)).toBe(true);
    expect(Array.isArray(skills.softSkillsOptional)).toBe(true);

    expect(skills.hardSkillsRequired.length + skills.softSkillsRequired.length).toBeGreaterThan(0);

    // --- cache assert ---
    expect(cached).toEqual(skills);
    assertCacheWorks(duration1, duration2, "extractJobSkills");
  });

  test("test summarizeJob with caching", async () => {

    const start1 = Date.now();
    const summary = await summarizeJob(jobText);
    const duration1 = Date.now() - start1;

    const start2 = Date.now();
    const cached = await summarizeJob(jobText);
    const duration2 = Date.now() - start2;

    expect(summary).toHaveProperty("summary");
    expect(summary).toHaveProperty("technologies");
    expect(summary).toHaveProperty("hardSkills");
    expect(summary).toHaveProperty("softSkills");
    expect(summary).toHaveProperty("otherRelevantInfo");

    expect(typeof summary.summary).toBe("string");
    expect(summary.summary.length).toBeGreaterThan(20);
    expect(summary.technologies.length).toBeGreaterThan(0);
    expect(summary.hardSkills.length).toBeGreaterThan(0);
    expect(summary.softSkills.length).toBeGreaterThan(0);

    const info = summary.otherRelevantInfo;
    expect(info).toHaveProperty("salary");
    expect(info).toHaveProperty("location");
    expect(info).toHaveProperty("remote");
    expect(info).toHaveProperty("employmentType");

    // --- cache assert ---
    expect(cached).toEqual(summary);
    assertCacheWorks(duration1, duration2, "summarizeJob");
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
        expect(result.summary.length).toBeGreaterThan(20);
        expect(result.prioritySkills.length).toBeGreaterThan(0);

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

          const start1 = Date.now();
          rawResult = await generateEditedCV(jobText, applicantText, "Finnish");
          const duration1 = Date.now() - start1;

          const start2 = Date.now();
          const cached = await generateEditedCV(jobText, applicantText, "Finnish");
          const duration2 = Date.now() - start2;

          expect(cached).toEqual(rawResult);
          assertCacheWorks(duration1, duration2, "generateEditedCV");

          expect(typeof rawResult).toBe("object");
          expect(rawResult).toHaveProperty("editedCV");
          expect(typeof rawResult.editedCV).toBe("string");
        });

        test("editedCV exists", () => {
          expect(rawResult.editedCV.length).toBeGreaterThan(100);
          expect(rawResult.editedCV).toContain("Martti");
        });

      });

    });

  (runAiTests ? describe : describe.skip)("generateInterviewReply – regression tests", () => {

    let chatHistory;

    beforeEach(() => {
      // Aloitetaan puhtaalla historialla jokaisessa testissä
      chatHistory = [];
    });

    test("AI interview reply returns valid JSON structure", async () => {
      const phase = "intro";
      const language = "Finnish";

      const result = await generateInterviewReply(chatHistory, jobText, applicantText, phase, language);

      // --- STRUCTURE ---
      expect(result).toHaveProperty("nextQuestion");
      expect(result).toHaveProperty("followUp");
      expect(result).toHaveProperty("answerEvaluation");

      if (result.nextQuestion !== null) {
        expect(result.nextQuestion.length).toBeGreaterThan(10);
      }

      const evalObj = result.answerEvaluation;
      expect(evalObj).toHaveProperty("clarity");
      expect(evalObj).toHaveProperty("technicalDepth");
      expect(evalObj).toHaveProperty("communication");
    });

    test("caching works for identical interview requests", async () => {
      const phase = "technical";
      const language = "Finnish";
      chatHistory.push({ role: "user", content: "Olen kova koodaamaan Reactia." });

      // 1. Ensimmäinen kutsu (hidas, menee LLM:lle)
      const start1 = Date.now();
      const result1 = await generateInterviewReply(chatHistory, jobText, applicantText, phase, language);
      const duration1 = Date.now() - start1;

      // 2. Toinen kutsu täysin samalla datalla (nopea, pitäisi tulla cachesta)
      const start2 = Date.now();
      const result2 = await generateInterviewReply(chatHistory, jobText, applicantText, phase, language);
      const duration2 = Date.now() - start2;

      // Varmistetaan että data on sama ja aika on murto-osa alkuperäisestä
      expect(result1).toEqual(result2);
      assertCacheWorks(duration1, duration2, "generateInterviewReply");
    });

    test("AI can handle multiple chat turns", async () => {
      const phase = "technical";
      const language = "Finnish";

      chatHistory.push({
        role: "assistant",
        content: "Kerro kokemuksestasi React-projekteissa."
      });

      chatHistory.push({
        role: "user",
        content: "Olen rakentanut useita web-sovelluksia Reactilla viimeisten 3 vuoden aikana."
      });

      const result = await generateInterviewReply(chatHistory, jobText, applicantText, phase, language);

      expect(result).toHaveProperty("nextQuestion");
      expect(result.answerEvaluation.clarity).toBeGreaterThanOrEqual(0);
    });

    test("nextQuestion is null only in feedback phase", async () => {
      const phase = "feedback";
      const result = await generateInterviewReply(chatHistory, jobText, applicantText, phase, "Finnish");

      if (result.nextQuestion === null) {
        expect(phase).toBe("feedback");
      } else {
        expect(typeof result.nextQuestion).toBe("string");
      }
    });
  });
});

(runAiTests ? describe : describe.skip)("Cache Utility Tests (In-memory)", () => {
  describe("Tarkista cachen toimivuus", () => {
    beforeEach(() => {
      // Otetaan käyttöön Jestin valekellot, jotta voimme testata ajan kulumista nopeasti
      jest.useFakeTimers();
    });

    afterEach(() => {
      // Palautetaan oikeat kellot jokaisen testin jälkeen
      jest.useRealTimers();
    });

    test("createCacheKey tuottaa stabiileja ja uniikkeja tiivisteitä", () => {
      const payload1 = { jobText: "Koodari", language: "FI" };
      const payload2 = { jobText: "Koodari", language: "FI" };
      const payload3 = { jobText: "Koodari", language: "EN" };

      const key1 = createCacheKey("test", payload1);
      const key2 = createCacheKey("test", payload2);
      const key3 = createCacheKey("test", payload3);

      // Saman sisällön pitää tuottaa täsmälleen sama avain
      expect(key1).toEqual(key2);

      // Eri sisällön pitää tuottaa eri avain
      expect(key1).not.toEqual(key3);

      // Avaimen pitää alkaa annetulla etuliitteellä
      expect(key1.startsWith("test:")).toBe(true);
    });

    test("setCache ja getCache tallentavat ja palauttavat datan oikein", () => {
      const key = "test_cache_key_1";
      const data = { id: 123, text: "Välimuistissa" };

      // Aluksi pitäisi olla tyhjä
      expect(getCache(key)).toBeNull();

      // Tallennetaan 10 sekunnin elinajalla
      setCache(key, data, 10000);

      // Datan pitäisi nyt löytyä
      const cached = getCache(key);
      expect(cached).toEqual(data);
    });

    test("getCache poistaa ja palauttaa null, jos TTL on umpeutunut", () => {
      const key = "test_cache_key_expired";
      const data = { msg: "Katoava viesti" };

      // Tallennetaan data 5 sekunnin (5000 ms) elinajalla
      setCache(key, data, 5000);

      // Varmistetaan, että se on siellä heti tallennuksen jälkeen
      expect(getCache(key)).toEqual(data);

      // Kelataan aikaa eteenpäin 6 sekuntia
      jest.advanceTimersByTime(6000);

      // Nyt sen pitäisi palauttaa null, koska expiry meni umpeen
      expect(getCache(key)).toBeNull();
    });
  });
});
