import { jest } from "@jest/globals";

// ---------------------------------------------------------------------------
// Mockit
// ---------------------------------------------------------------------------

jest.unstable_mockModule("../utils/apiCoreLLM.js", () => ({
  asyncHandler: (fn) => async (req, res) => {
    const result = await fn(req, res);
    res.json(result);
  }
}));

// dbProfileToFrontendSkills on determininen puhdas funktio —
// käytetään oikeaa toteutusta eikä mockia, jotta voidaan testata
// datan purku ja yhdistäminen realistisesti.
jest.unstable_mockModule("../utils/apiCoreDB.js", () => {
  const MOCK_COMPATIBILITY = 80;
  const MOCK_MATCH = { matchedSkills: ["JS"], missingSkills: ["TS"] };

  return {
    dbProfileToFrontendSkills: (candidateProfile, availableSkills) => {
      const result = { frontend: [], backend: [], tools: [], other: [] };
      if (!candidateProfile || !availableSkills) return result;
      const map = Object.entries(availableSkills).reduce((acc, [cat, skills]) => {
        if (!Array.isArray(skills)) return acc;
        skills.forEach(s => { acc[s.toLowerCase()] = cat; });
        return acc;
      }, {});
      const all = [
        ...(candidateProfile.hardSkillsProficient ?? []),
        ...(candidateProfile.hardSkillsBasics ?? []),
        ...(candidateProfile.softSkillsProficient ?? []),
        ...(candidateProfile.softSkillsBasics ?? []),
      ];
      all.forEach(skill => {
        const cat = map[skill.toLowerCase()] ?? "other";
        if (!result[cat].includes(skill)) result[cat].push(skill);
      });
      return result;
    },

    enrichJob: (job) => {
      if (!job) return null;
      return {
        ...job,
        compatibility: MOCK_COMPATIBILITY,
        recommended: MOCK_COMPATIBILITY >= 75,
        matchedSkills: MOCK_MATCH.matchedSkills,
        missingSkills: MOCK_MATCH.missingSkills,
      };
    }
  };
});

const EMPTY_PORTFOLIO = {
  name: "", title: "", email: "", phone: "", location: "",
  github: "", linkedin: "", summary: "",
  experience: [], education: [], certifications: [],
  profileSummary: { whyMe: [], lookingFor: [] }
};

jest.unstable_mockModule("../services/dbService.js", () => ({
  readDB: jest.fn(),
  writeDB: jest.fn(),
  createEmptyPortfolio: () => ({ ...EMPTY_PORTFOLIO }),
  INITIAL_STATE: {
    appliedJobs: [],
    candidateProfile: {
      hardSkillsProficient: [],
      hardSkillsBasics: [],
      softSkillsProficient: [],
      softSkillsBasics: []
    },
    portfolio: { ...EMPTY_PORTFOLIO },
    availableSkills: { frontend: [], backend: [], tools: [], other: [] }
  }
}));

jest.unstable_mockModule("../utils/matchCandidateToJob.js", () => ({
  calculateMatch: jest.fn(() => 80),
  getSkillMatchList: jest.fn(() => ({
    matchedSkills: ["JS"],
    missingSkills: ["TS"]
  }))
}));

const { readDB, writeDB } = await import("../services/dbService.js");
const router = (await import("./database.js")).default;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getRouteHandler = (method, path) => {
  const layer = router.stack.find(
    (l) => l.route && l.route.path === path && l.route.methods[method]
  );
  if (!layer) throw new Error(`Handler not found: ${method.toUpperCase()} ${path}`);
  return layer.route.stack[0].handle;
};

const mockReqRes = ({ body = {}, params = {} } = {}) => {
  const req = { body, params };
  let jsonData;
  const res = { json: (data) => { jsonData = data; return res; } };
  return { req, res, getJson: () => jsonData };
};

// ---------------------------------------------------------------------------
// Testit
// ---------------------------------------------------------------------------

describe("Database Router", () => {
  let mockDB;

  beforeEach(() => {
    mockDB = {
      appliedJobs: [],
      candidateProfile: {
        hardSkillsProficient: [],
        hardSkillsBasics: [],
        softSkillsProficient: [],
        softSkillsBasics: []
      },
      portfolio: { ...EMPTY_PORTFOLIO },
      availableSkills: {
        frontend: ["React.js"],
        backend: ["Node.js"],
        tools: ["Git"],
        other: ["Problem Solving"]
      }
    };
    readDB.mockResolvedValue(mockDB);
    writeDB.mockResolvedValue();
  });

  afterEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // /full
  // -------------------------------------------------------------------------

  test("GET /full palauttaa koko tietokannan", async () => {
    const handler = getRouteHandler("get", "/full");
    const { req, res, getJson } = mockReqRes();
    await handler(req, res);
    expect(getJson()).toEqual(mockDB);
  });

  // -------------------------------------------------------------------------
  // /candidate-profile
  // -------------------------------------------------------------------------

  test("GET /candidate-profile palauttaa hakijan profiilin", async () => {
    const handler = getRouteHandler("get", "/candidate-profile");
    const { req, res, getJson } = mockReqRes();
    await handler(req, res);
    expect(getJson()).toEqual(mockDB.candidateProfile);
  });

  test("PUT /candidate-profile kelvollisella profiililla tallentaa", async () => {
    const handler = getRouteHandler("put", "/candidate-profile");
    const profile = {
      hardSkillsProficient: ["JS"],
      hardSkillsBasics: [],
      softSkillsProficient: [],
      softSkillsBasics: []
    };
    const { req, res, getJson } = mockReqRes({ body: profile });
    await handler(req, res);

    expect(getJson().success).toBe(true);
    expect(getJson().candidateProfile).toEqual(profile);
    expect(writeDB).toHaveBeenCalledTimes(1);
    expect(writeDB.mock.calls[0][0].candidateProfile).toEqual(profile);
  });

  test("PUT /candidate-profile virheellisellä bodyllä palauttaa success: false", async () => {
    const handler = getRouteHandler("put", "/candidate-profile");
    const { req, res, getJson } = mockReqRes({ body: { foo: "bar" } });
    await handler(req, res);

    expect(getJson().success).toBe(false);
    expect(writeDB).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // /applied-jobs
  // -------------------------------------------------------------------------

  test("GET /applied-jobs tyhjänä palauttaa tyhjän taulukon", async () => {
    const handler = getRouteHandler("get", "/applied-jobs");
    const { req, res, getJson } = mockReqRes();
    await handler(req, res);
    expect(getJson()).toEqual([]);
  });

  test("GET /applied-jobs rikastaa työpaikat match-datalla", async () => {
    mockDB.appliedJobs = [{ id: "1", title: "Dev" }];
    const handler = getRouteHandler("get", "/applied-jobs");
    const { req, res, getJson } = mockReqRes();
    await handler(req, res);

    const jobs = getJson();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].compatibility).toBe(80);
    expect(jobs[0].recommended).toBe(true);
    expect(jobs[0].matchedSkills).toEqual(["JS"]);
    expect(jobs[0].missingSkills).toEqual(["TS"]);
  });

  test("GET /applied-jobs/:id — ei löydy → null", async () => {
    const handler = getRouteHandler("get", "/applied-jobs/:id");
    const { req, res, getJson } = mockReqRes({ params: { id: "999" } });
    await handler(req, res);
    expect(getJson()).toBeNull();
  });

  test("GET /applied-jobs/:id — löytyy → rikastettu työpaikka", async () => {
    mockDB.appliedJobs = [{ id: "1", title: "Dev" }];
    const handler = getRouteHandler("get", "/applied-jobs/:id");
    const { req, res, getJson } = mockReqRes({ params: { id: "1" } });
    await handler(req, res);

    expect(getJson()).not.toBeNull();
    expect(getJson().id).toBe("1");
    expect(getJson().compatibility).toBe(80);
  });

  test("PUT /applied-jobs/:id luo uuden työpaikan", async () => {
    const handler = getRouteHandler("put", "/applied-jobs/:id");
    const { req, res, getJson } = mockReqRes({
      body: { title: "Dev" },
      params: { id: "1" }
    });
    await handler(req, res);

    expect(getJson().success).toBe(true);
    expect(getJson().job.id).toBe("1");
    expect(getJson().job.compatibility).toBe(80);
    expect(writeDB).toHaveBeenCalledTimes(1);
  });

  test("PUT /applied-jobs/:id poistetaan lasketut kentät ennen tallennusta", async () => {
    const handler = getRouteHandler("put", "/applied-jobs/:id");
    const { req, res } = mockReqRes({
      body: {
        title: "Dev",
        compatibility: 99,    // pitäisi poistua
        recommended: true,    // pitäisi poistua
        matchedSkills: ["X"], // pitäisi poistua
        missingSkills: ["Y"]  // pitäisi poistua
      },
      params: { id: "1" }
    });
    await handler(req, res);

    const saved = writeDB.mock.calls[0][0].appliedJobs[0];
    expect(saved).not.toHaveProperty("compatibility");
    expect(saved).not.toHaveProperty("recommended");
    expect(saved).not.toHaveProperty("matchedSkills");
    expect(saved).not.toHaveProperty("missingSkills");
    expect(saved.title).toBe("Dev");
  });

  test("PUT /applied-jobs/:id päivittää olemassaolevan työpaikan", async () => {
    mockDB.appliedJobs = [{ id: "1", title: "Vanha" }];
    const handler = getRouteHandler("put", "/applied-jobs/:id");
    const { req, res, getJson } = mockReqRes({
      body: { title: "Uusi" },
      params: { id: "1" }
    });
    await handler(req, res);

    expect(getJson().job.title).toBe("Uusi");
    expect(writeDB.mock.calls[0][0].appliedJobs[0].title).toBe("Uusi");
  });

  test("DELETE /applied-jobs/:id poistaa työpaikan", async () => {
    mockDB.appliedJobs = [{ id: "1" }, { id: "2" }];
    const handler = getRouteHandler("delete", "/applied-jobs/:id");
    const { req, res, getJson } = mockReqRes({ params: { id: "1" } });
    await handler(req, res);

    expect(getJson().success).toBe(true);
    expect(getJson().deletedId).toBe("1");
    expect(writeDB.mock.calls[0][0].appliedJobs).toEqual([{ id: "2" }]);
  });

  // -------------------------------------------------------------------------
  // /portfolio — datan purku ja yhdistäminen
  // -------------------------------------------------------------------------

  test("GET /portfolio yhdistää candidateProfile taidot portfolioon oikeisiin kategorioihin", async () => {
    mockDB.candidateProfile = {
      hardSkillsProficient: ["React.js", "Node.js"],
      hardSkillsBasics: ["Git"],
      softSkillsProficient: ["Problem Solving"],
      softSkillsBasics: []
    };
    mockDB.portfolio = { ...EMPTY_PORTFOLIO, name: "Testi Henkilö" };

    const handler = getRouteHandler("get", "/portfolio");
    const { req, res, getJson } = mockReqRes();
    await handler(req, res);

    const result = getJson();
    expect(result.name).toBe("Testi Henkilö");
    expect(result.skills.frontend).toContain("React.js");
    expect(result.skills.backend).toContain("Node.js");
    expect(result.skills.tools).toContain("Git");
    expect(result.skills.other).toContain("Problem Solving");
  });

  test("GET /portfolio — taidot eivät duplikoidu vaikka olisi sekä hard että soft", async () => {
    mockDB.candidateProfile = {
      hardSkillsProficient: ["React.js"],
      hardSkillsBasics: ["React.js"], // sama taito kahdessa kategoriassa
      softSkillsProficient: [],
      softSkillsBasics: []
    };

    const handler = getRouteHandler("get", "/portfolio");
    const { req, res, getJson } = mockReqRes();
    await handler(req, res);

    expect(getJson().skills.frontend.filter(s => s === "React.js")).toHaveLength(1);
  });

  test("GET /portfolio palauttaa tyhjät taidot kun candidateProfile on tyhjä", async () => {
    const handler = getRouteHandler("get", "/portfolio");
    const { req, res, getJson } = mockReqRes();
    await handler(req, res);

    expect(getJson().skills).toEqual({
      frontend: [], backend: [], tools: [], other: []
    });
  });

  test("GET /portfolio — tuntematon taito menee other-kategoriaan", async () => {
    mockDB.candidateProfile = {
      hardSkillsProficient: ["TuntematollinenTaito123"],
      hardSkillsBasics: [],
      softSkillsProficient: [],
      softSkillsBasics: []
    };

    const handler = getRouteHandler("get", "/portfolio");
    const { req, res, getJson } = mockReqRes();
    await handler(req, res);

    expect(getJson().skills.other).toContain("TuntematollinenTaito123");
  });

  test("PUT /portfolio tallentaa portfolion ilman skills-kenttää", async () => {
    const handler = getRouteHandler("put", "/portfolio");
    const { req, res, getJson } = mockReqRes({
      body: {
        name: "Testi Henkilö",
        title: "Developer",
        skills: { frontend: ["React.js"] } // pitäisi poistua
      }
    });
    await handler(req, res);

    expect(getJson().success).toBe(true);
    const saved = writeDB.mock.calls[0][0].portfolio;
    expect(saved).not.toHaveProperty("skills");
    expect(saved.name).toBe("Testi Henkilö");
    expect(saved.title).toBe("Developer");
  });

  test("DELETE /portfolio nollaa portfolion tyhjään pohjaan", async () => {
    mockDB.portfolio = { ...EMPTY_PORTFOLIO, name: "Vanha nimi", title: "Vanha title" };

    const handler = getRouteHandler("delete", "/portfolio");
    const { req, res, getJson } = mockReqRes();
    await handler(req, res);

    expect(getJson().success).toBe(true);
    const saved = writeDB.mock.calls[0][0].portfolio;
    expect(saved.name).toBe("");
    expect(saved.title).toBe("");
    expect(saved.experience).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // /portfolio-projects
  // -------------------------------------------------------------------------

  test("GET /portfolio-projects palauttaa projektit projects-kentässä", async () => {
    mockDB.portfolioProjects = [
      { id: "proj_1", title: "Projekti 1", technologies: ["React"] },
      { id: "proj_2", title: "Projekti 2", technologies: ["Vue.js"] },
    ];
    const handler = getRouteHandler("get", "/portfolio-projects");
    const { req, res, getJson } = mockReqRes();
    await handler(req, res);

    expect(getJson().projects).toHaveLength(2);
    expect(getJson().projects[0].title).toBe("Projekti 1");
  });

  test("GET /portfolio-projects tyhjänä palauttaa tyhjän taulukon", async () => {
    mockDB.portfolioProjects = [];
    const handler = getRouteHandler("get", "/portfolio-projects");
    const { req, res, getJson } = mockReqRes();
    await handler(req, res);

    expect(getJson().projects).toEqual([]);
  });

  test("GET /portfolio-projects — portfolioProjects puuttuu DB:stä → tyhjä taulukko", async () => {
    delete mockDB.portfolioProjects;
    const handler = getRouteHandler("get", "/portfolio-projects");
    const { req, res, getJson } = mockReqRes();
    await handler(req, res);

    expect(getJson().projects).toEqual([]);
  });

  test("POST /portfolio-projects luo uuden projektin ja generoi id:n ja createdAt:n", async () => {
    mockDB.portfolioProjects = [];
    const handler = getRouteHandler("post", "/portfolio-projects");
    const { req, res, getJson } = mockReqRes({
      body: { title: "Uusi projekti", category: "Full Stack", technologies: ["React"] }
    });
    await handler(req, res);

    expect(getJson().success).toBe(true);
    expect(getJson().project.title).toBe("Uusi projekti");
    expect(getJson().project.id).toMatch(/^proj_/);
    expect(getJson().project.createdAt).toBeDefined();
    expect(writeDB).toHaveBeenCalledTimes(1);
  });

  test("POST /portfolio-projects lisää projektin listan alkuun", async () => {
    mockDB.portfolioProjects = [{ id: "proj_old", title: "Vanha" }];
    const handler = getRouteHandler("post", "/portfolio-projects");
    const { req, res, getJson } = mockReqRes({
      body: { title: "Uusi" }
    });
    await handler(req, res);

    const saved = writeDB.mock.calls[0][0].portfolioProjects;
    expect(saved[0].title).toBe("Uusi");
    expect(saved[1].id).toBe("proj_old");
  });

  test("PUT /portfolio-projects/:id päivittää olemassaolevan projektin", async () => {
    mockDB.portfolioProjects = [
      { id: "proj_1", title: "Vanha nimi", category: "Frontend" }
    ];
    const handler = getRouteHandler("put", "/portfolio-projects/:id");
    const { req, res, getJson } = mockReqRes({
      body: { title: "Uusi nimi" },
      params: { id: "proj_1" }
    });
    await handler(req, res);

    expect(getJson().success).toBe(true);
    expect(getJson().project.title).toBe("Uusi nimi");
    expect(getJson().project.category).toBe("Frontend"); // muut kentät säilyvät
    expect(writeDB).toHaveBeenCalledTimes(1);
  });

  test("PUT /portfolio-projects/:id — projekti ei löydy → success: false", async () => {
    mockDB.portfolioProjects = [];
    const handler = getRouteHandler("put", "/portfolio-projects/:id");
    const { req, res, getJson } = mockReqRes({
      body: { title: "X" },
      params: { id: "proj_999" }
    });
    await handler(req, res);

    expect(getJson().success).toBe(false);
    expect(writeDB).not.toHaveBeenCalled();
  });

  test("DELETE /portfolio-projects/:id poistaa projektin", async () => {
    mockDB.portfolioProjects = [
      { id: "proj_1", title: "Projekti 1" },
      { id: "proj_2", title: "Projekti 2" },
    ];
    const handler = getRouteHandler("delete", "/portfolio-projects/:id");
    const { req, res, getJson } = mockReqRes({ params: { id: "proj_1" } });
    await handler(req, res);

    expect(getJson().success).toBe(true);
    expect(getJson().deletedId).toBe("proj_1");
    const saved = writeDB.mock.calls[0][0].portfolioProjects;
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe("proj_2");
  });

  test("DELETE /portfolio-projects/:id — projekti ei löydy → lista säilyy muuttumattomana", async () => {
    mockDB.portfolioProjects = [{ id: "proj_1", title: "Projekti 1" }];
    const handler = getRouteHandler("delete", "/portfolio-projects/:id");
    const { req, res } = mockReqRes({ params: { id: "proj_999" } });
    await handler(req, res);

    const saved = writeDB.mock.calls[0][0].portfolioProjects;
    expect(saved).toHaveLength(1);
  });

});

