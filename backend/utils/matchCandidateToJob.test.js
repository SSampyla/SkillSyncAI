import { calculateMatch } from "../utils/matchCandidateToJob.js";
import { getSkillMatchList } from "../utils/matchCandidateToJob.js";
import { SYNONYMS } from '../config/synonyms.js';
import { performance } from 'perf_hooks';

describe("Skill nimet ja normalisointi", () => {

  test("ohittaa tyhjät merkkijonot luomatta ID:tä", () => {
    const job = {
      hardSkillsRequired: ["", "React"],
      hardSkillsOptional: [],
      softSkillsRequired: [],
      softSkillsOptional: []
    };

    const candidate = {
      hardSkillsProficient: ["", "react"],
      hardSkillsBasics: [],
      softSkillsProficient: [],
      softSkillsBasics: []
    };

    const result = calculateMatch(job, candidate);
    expect(result).toBe(100); // Tyhjä string ohitetaan, React matchaa
  });

  test("pelkkä whitespace ei saa ID:tä", () => {
    const job = {
      hardSkillsRequired: ["   ", "Node.js"],
      hardSkillsOptional: [],
      softSkillsRequired: [],
      softSkillsOptional: []
    };

    const candidate = {
      hardSkillsProficient: ["   ", "nodejs"],
      hardSkillsBasics: [],
      softSkillsProficient: [],
      softSkillsBasics: []
    };

    const result = calculateMatch(job, candidate);
    expect(result).toBe(100); // Whitespace ohitetaan, Node.js matchaa
  });

  test("pelkkä erikoismerkit normalisoituu tyhjäksi", () => {
    const job = {
      hardSkillsRequired: ["---", "Python"],
      hardSkillsOptional: [],
      softSkillsRequired: [],
      softSkillsOptional: []
    };

    const candidate = {
      hardSkillsProficient: ["python"],
      hardSkillsBasics: [],
      softSkillsProficient: [],
      softSkillsBasics: []
    };

    const result = calculateMatch(job, candidate);
    expect(result).toBe(100); // "---" normalisoituu tyhjäksi, Python matchaa
  });

  test("null ja undefined skillit ohitetaan turvallisesti", () => {
    const job = {
      hardSkillsRequired: [null, "React", undefined, ""],
      hardSkillsOptional: [],
      softSkillsRequired: [],
      softSkillsOptional: []
    };

    const candidate = {
      hardSkillsProficient: ["react"],
      hardSkillsBasics: [],
      softSkillsProficient: [],
      softSkillsBasics: []
    };

    const result = calculateMatch(job, candidate);
    expect(result).toBe(100);
  });

  test("number-tyyppiset arvot ohitetaan", () => {
    const job = {
      hardSkillsRequired: ["React", 123, "Node.js"],
      hardSkillsOptional: [],
      softSkillsRequired: [],
      softSkillsOptional: []
    };

    const candidate = {
      hardSkillsProficient: ["react", "nodejs"],
      hardSkillsBasics: [],
      softSkillsProficient: [],
      softSkillsBasics: []
    };

    const result = calculateMatch(job, candidate);
    expect(result).toBe(100);
  });

  test("ääkköset ja synonyymit kohtaavat", () => {
    const job = {
      hardSkillsRequired: [],
      hardSkillsOptional: [],
      softSkillsRequired: ["Ryhmätyö"],
      softSkillsOptional: []
    };

    const candidate = {
      hardSkillsProficient: [],
      hardSkillsBasics: [],
      softSkillsProficient: ["ryhmatyo"], // normalize poistaa ä-pisteet jos regex muuttuu, 
      // tai synonyymi ohjaa 'ryhmatyo' -> 'tiimityo'
      softSkillsBasics: []
    };

    const result = calculateMatch(job, candidate);
    expect(result).toBe(100);
  });

  describe("calculateMatch –pisteytys", () => {

    // 1. Job varaa ID:n 1 (Rust)
    // 2. Hakija varaa ID:n 2 (Python)
    // 3. Arrayn koko on 3.
    // 4. Loop hakee hakijaSkills[1].
    // Testi varmistaa, että TypedArrayn oletusarvo (0) toimii, eikä tule undefined.
    test("Työpaikan vaatima taito, jota hakijalla ei ole, ei riko taulukkoviittausta", () => {
      const job = {
        hardSkillsRequired: ["Rust"], // ID 1
        hardSkillsOptional: [],
        softSkillsRequired: [],
        softSkillsOptional: []
      };
      const candidate = {
        hardSkillsProficient: [], // Hakijalla ei ole Rustia
        hardSkillsBasics: ["Python"], // ID 2
        softSkillsProficient: [],
        softSkillsBasics: []
      };

      const result = calculateMatch(job, candidate);
      expect(result).toBe(0);
      expect(result).not.toBeNaN();
    });

    test("täysi match antaa 100%", () => {

      const job = {
        hardSkillsRequired: ["React", "Node.js"],
        hardSkillsOptional: [],
        softSkillsRequired: ["Tiimityö"],
        softSkillsOptional: []
      };

      const candidate = {
        hardSkillsProficient: ["react", "node"],
        hardSkillsBasics: [],
        softSkillsProficient: ["tiimityo"],
        softSkillsBasics: []
      };

      const result = calculateMatch(job, candidate);

      expect(result).toBe(100);
    });

    test("perusosaaminen laskee pistettä", () => {

      const job = {
        hardSkillsRequired: ["React"],
        hardSkillsOptional: [],
        softSkillsRequired: [],
        softSkillsOptional: []
      };

      const candidate = {
        hardSkillsProficient: [],
        hardSkillsBasics: ["react"],
        softSkillsProficient: [],
        softSkillsBasics: []
      };

      const result = calculateMatch(job, candidate);

      // basics = 0.4 → 40%
      expect(result).toBe(40);
    });

    test("valinnainen taito painaa vähemmän kuin pakollinen", () => {

      const job = {
        hardSkillsRequired: ["React"],
        hardSkillsOptional: ["Docker"],
        softSkillsRequired: [],
        softSkillsOptional: []
      };

      const candidate = {
        hardSkillsProficient: ["react"],
        hardSkillsBasics: ["docker"],
        softSkillsProficient: [],
        softSkillsBasics: []
      };

      const result = calculateMatch(job, candidate);

      // max = 5 + 3 = 8
      // achieved = 5*1 + 3*0.4 = 6.2 → 77.5% → 78%
      expect(result).toBe(78);
    });

    test("puuttuvat taidot antavat 0%", () => {

      const job = {
        hardSkillsRequired: ["React"],
        hardSkillsOptional: [],
        softSkillsRequired: [],
        softSkillsOptional: []
      };

      const candidate = {
        hardSkillsProficient: [],
        hardSkillsBasics: [],
        softSkillsProficient: [],
        softSkillsBasics: []
      };

      const result = calculateMatch(job, candidate);

      expect(result).toBe(0);
    });

    test("null arrayt eivät kaada laskentaa", () => {

      const job = {
        hardSkillsRequired: ["React"],
        hardSkillsOptional: null,
        softSkillsRequired: null,
        softSkillsOptional: undefined
      };

      const candidate = {
        hardSkillsProficient: ["react"],
        hardSkillsBasics: null,
        softSkillsProficient: undefined,
        softSkillsBasics: null
      };

      const result = calculateMatch(job, candidate);

      expect(result).toBe(100);
    });

    test("ei taitovaatimuksia palauttaa null", () => {

      const job = {
        hardSkillsRequired: [],
        hardSkillsOptional: [],
        softSkillsRequired: [],
        softSkillsOptional: []
      };

      const candidate = {
        hardSkillsProficient: ["react"],
        hardSkillsBasics: [],
        softSkillsProficient: [],
        softSkillsBasics: []
      };

      const result = calculateMatch(job, candidate);

      expect(result).toBe(null);
    });

    test("paras osaamistaso voittaa (proficient > basics)", () => {

      const job = {
        hardSkillsRequired: ["React"],
        hardSkillsOptional: [],
        softSkillsRequired: [],
        softSkillsOptional: []
      };

      const candidate = {
        hardSkillsProficient: ["react"],
        hardSkillsBasics: ["react"],
        softSkillsProficient: [],
        softSkillsBasics: []
      };

      const result = calculateMatch(job, candidate);

      expect(result).toBe(100);
    });

  });

  describe("calculateMatch – Synonyymien ja normalisoinnin kattavuus", () => {

    // Parametrisoidun testin data-taulukko: [työpaikan termi, hakijan termi, odotettu match%]
    test.each([
      ["React.js", "react", 100],
      ["Node.js", "nodejs", 100],
      ["C#", "csharp", 100],
      ["C++", "cpp", 100],
      [".NET", "dotnet", 100],
      ["Amazon Web Services", "aws", 100],
      ["JS", "javascript", 100],
      ["Ryhmätyö", "tiimityo", 100], // Soft skill synonyymi
      ["Yhteistyökyky", "tiimityoskentely", 100], // Ketjutettu synonyymi
      ["Puolikas Osaaminen", "ei-ole", 0] // Negatiivinen testi
    ])(
      "pitäisi tunnistaa match, kun työpaikka vaatii '%s' ja hakijalla on '%s'",
      (jobSkill, candidateSkill, expectedMatch) => {
        const job = {
          hardSkillsRequired: [jobSkill],
          hardSkillsOptional: [],
          softSkillsRequired: [],
          softSkillsOptional: []
        };

        // Jos kyseessä on pehmeä taito (kuten tiimityö), siirretään se softSkillsiin, jotta testi vastaa todellista käyttöä.
        const isSoftSkill = ["Ryhmätyö", "Yhteistyökyky", "tiimityo", "tiimityoskentely"].includes(jobSkill) ||
          ["Ryhmätyö", "Yhteistyökyky", "tiimityo", "tiimityoskentely"].includes(candidateSkill);

        if (isSoftSkill) {
          job.hardSkillsRequired = [];
          job.softSkillsRequired = [jobSkill];
        }

        const candidate = {
          hardSkillsProficient: isSoftSkill ? [] : [candidateSkill],
          hardSkillsBasics: [],
          softSkillsProficient: isSoftSkill ? [candidateSkill] : [],
          softSkillsBasics: []
        };

        const result = calculateMatch(job, candidate);
        expect(result).toBe(expectedMatch);
      }
    );
  });

  // Tarkistetus edge caselle. typedarray ylivuoto.
  describe("varmistaa pisteytyksen oikeellisuuden, vaikka hakijalla on vaatimusten ulkopuolista osaamista", () => {

    test("hakijan taitoja ei kadoteta, vaikka niitä ei olisi rekisteröity jobin aikana", () => {

      const job = {
        hardSkillsRequired: ["Skill1"],
        hardSkillsOptional: [],
        softSkillsRequired: [],
        softSkillsOptional: []
      };

      const extraSkills = [];

      for (let i = 0; i < 100; i++) {
        extraSkills.push("ExtraSkill" + i);
      }

      const candidate = {
        hardSkillsProficient: ["Skill1"],
        hardSkillsBasics: extraSkills,
        softSkillsProficient: [],
        softSkillsBasics: ["Unreal"]
      };

      const result = calculateMatch(job, candidate);

      // Job vaatii vain Reactin (paino 5)
      // Hakija osaa Reactin proficient (1.0)
      // -> score = 5 / 5 = 100%

      expect(result).not.toBeNaN();
      expect(result).toBe(100);
    });
  });

  describe('laskee eri hakijoiden tulokset toisistaan riippumatta', () => {

    test('state ID:t eivät sekoitu eri laskuissa', () => {
      const job1 = {
        hardSkillsRequired: ["JavaScript", "Node.js"],
        hardSkillsOptional: ["Docker"],
        softSkillsRequired: ["Teamwork"],
        softSkillsOptional: []
      };

      const candidate1 = {
        hardSkillsProficient: ["javascript"],
        hardSkillsBasics: ["node", "docker"],
        softSkillsProficient: ["teamwork"],
        softSkillsBasics: []
      };

      const job2 = {
        hardSkillsRequired: ["Python"],
        hardSkillsOptional: [],
        softSkillsRequired: ["Communication"],
        softSkillsOptional: []
      };

      const candidate2 = {
        hardSkillsProficient: ["python"],
        hardSkillsBasics: [],
        softSkillsProficient: ["communication"],
        softSkillsBasics: []
      };

      // Ensimmäinen laskenta
      const score1 = calculateMatch(job1, candidate1);
      expect(score1).toBeGreaterThan(0); // jotain pistettä pitäisi tulla

      // Toinen laskenta eri job/candidate
      const score2 = calculateMatch(job2, candidate2);
      expect(score2).toBeGreaterThan(0); // myös tässä pitää tulla pisteitä

      // Varmistetaan, että normalizeCache on käytössä
      // esim. nodejs pitäisi normalisoitua samaksi kuin Node.js
      expect(SYNONYMS['nodejs'] || 'nodejs').toBe('node');

      // Tärkein testi: ID:t eivät sekoitu
      // Ensimmäisen laskennan id:t eivät vaikuta toiseen
      // ei voi testata suoraan nextId, mutta voi varmistaa että molemmissa lasketaan oikein
      expect(score1).not.toBe(score2);
    });
  });

  describe('getSkillMatchList', () => {
    const mockJob = {
      hardSkillsRequired: ['TypeScript', 'Docker'],
      softSkillsRequired: ['Leadership']
    };

    it('palauttaa oikein jäsennellyt listat löytyvistä ja puuttuvista taidoista', () => {
      const mockCandidate = {
        hardSkillsProficient: ['TypeScript'], // Match
        softSkillsBasics: ['Leadership'],     // Match
        hardSkillsBasics: []                  // Docker puuttuu
      };

      const result = getSkillMatchList(mockJob, mockCandidate);

      expect(result).toHaveProperty('matchedSkills');
      expect(result).toHaveProperty('missingSkills');

      expect(result.matchedSkills).toContain('TypeScript');
      expect(result.matchedSkills).toContain('Leadership');
      expect(result.missingSkills).toContain('Docker');
      expect(result.matchedSkills).not.toContain('Docker');
    });

    it('hyödyntää normalisointia ja synonyymejä (esim. C# -> csharp)', () => {
      const jobWithSharp = {
        hardSkillsRequired: ['C#'],
        softSkillsRequired: []
      };

      const candidateWithSharp = {
        hardSkillsProficient: ['csharp'], // Pitäisi mätsätä normalisoinnin ansiosta
        hardSkillsBasics: [],
        softSkillsProficient: [],
        softSkillsBasics: []
      };

      const result = getSkillMatchList(jobWithSharp, candidateWithSharp);

      expect(result.matchedSkills).toContain('C#');
      expect(result.missingSkills).toHaveLength(0);
    });

    it('palauttaa tyhjät listat jos data puuttuu', () => {
      const result = getSkillMatchList(null, null);
      expect(result.matchedSkills).toEqual([]);
      expect(result.missingSkills).toEqual([]);
    });
  });

  test("Suorituskyky benchmark", () => { // Tämä oli nyt ihan hupi hommaa mutta tulipahan tehtyä
    const testSize = 4000;
    const bigJob = {
      hardSkillsRequired: Array.from({ length: testSize }, (_, i) => `SkillName-${i}`),
      hardSkillsOptional: [],
      softSkillsRequired: [],
      softSkillsOptional: []
    };

    const candidate = {
      hardSkillsProficient: [`SkillName-1`, `SkillName-${testSize / 2}`],
      hardSkillsBasics: [],
      softSkillsProficient: [],
      softSkillsBasics: []
    };

    // --- Kylmä, täytetään välimuisti (Regex ja String-käsittely) ---
    const startCold = performance.now();
    calculateMatch(bigJob, candidate);
    const endCold = performance.now();
    const durationCold = endCold - startCold;

    // --- Kuuma (Välimuisti valmiina) ---
    const startHot = performance.now();
    calculateMatch(bigJob, candidate);
    const endHot = performance.now();
    const durationHot = endHot - startHot;
    const improvement = (durationCold / durationHot).toFixed(1);

    console.log(`--- BENCHMARK TULOKSET (${testSize} taitoa) ---
          Kylmä ajo (ei välimuistia):  ${durationCold.toFixed(4)} ms
          Kuuma ajo (välimuistista):   ${durationHot.toFixed(4)} ms
          Toinen ajo ~${improvement}x nopeampi kun välimuisti oli kuuma`);

    expect(durationHot).toBeLessThan(durationCold);
  })
});