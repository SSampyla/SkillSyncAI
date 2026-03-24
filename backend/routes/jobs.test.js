import { jest } from "@jest/globals";

// ---------------------------------------------------------------------------
// Mockit
// ---------------------------------------------------------------------------

jest.unstable_mockModule("../utils/apiCoreLLM.js", () => ({
    asyncHandler: (fn) => async (req, res) => {
        const result = await fn(req, res);
        res.json(result);
    },
    getCache: jest.fn(),
    setCache: jest.fn(),
    createCacheKey: jest.fn(() => "test_key")
}));

jest.unstable_mockModule("../services/jobScraper.js", () => ({
    searchJobsFromAllSources: jest.fn()
}));

jest.unstable_mockModule("../services/dbService.js", () => ({
    readDB: jest.fn()
}));

jest.unstable_mockModule("../utils/matchCandidateToJob.js", () => ({
    calculateMatch: jest.fn(),
    getSkillMatchList: jest.fn()
}));

// Importit mockien jälkeen
const { searchJobsFromAllSources } = await import("../services/jobScraper.js");
const { readDB } = await import("../services/dbService.js");
const { calculateMatch, getSkillMatchList } = await import("../utils/matchCandidateToJob.js");

const router = (await import("./jobs.js")).default; // 🔁 vaihda oikea polku

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

const mockReqRes = ({ query = {} } = {}) => {
    const req = { query };
    let jsonData;
    const res = { json: (data) => { jsonData = data; return res; } };
    return { req, res, getJson: () => jsonData };
};

// ---------------------------------------------------------------------------
// Testit
// ---------------------------------------------------------------------------

describe("Jobs Router", () => {

    let consoleSpy;

    beforeAll(() => {
        consoleSpy = jest.spyOn(console, "log").mockImplementation(() => { });
    });

    afterAll(() => {
        consoleSpy.mockRestore();
    });

    beforeEach(() => {
        readDB.mockResolvedValue({
            candidateProfile: {
                hardSkillsProficient: ["React"],
                hardSkillsBasics: [],
                softSkillsProficient: [],
                softSkillsBasics: []
            }
        });

        calculateMatch.mockImplementation((job) => {
            return job.hardSkillsRequired?.includes("React") ? 90 : 50;
        });

        getSkillMatchList.mockImplementation((job) => ({
            matchedSkills: job.hardSkillsRequired ?? [],
            missingSkills: []
        }));
    });

    afterEach(() => jest.clearAllMocks());

    // -------------------------------------------------------------------------
    // PERUS HAKU
    // -------------------------------------------------------------------------

    test("GET /jobs/search palauttaa työpaikat", async () => {
        searchJobsFromAllSources.mockResolvedValue([
            { id: "1", title: "React Dev", requiredSkills: ["React"] }
        ]);

        const handler = getRouteHandler("get", "/jobs/search");
        const { req, res, getJson } = mockReqRes();

        await handler(req, res);

        const result = getJson();

        expect(result.jobs).toHaveLength(1);
        expect(result.jobs[0].compatibility).toBe(90);
        expect(result.jobs[0].recommended).toBe(true);
    });

    // -------------------------------------------------------------------------
    // SORTTAUS
    // -------------------------------------------------------------------------

    test("GET /jobs/search sorttaa parhaat ensin", async () => {
        searchJobsFromAllSources.mockResolvedValue([
            { id: "1", title: "Low", requiredSkills: ["Node"] },
            { id: "2", title: "High", requiredSkills: ["React"] }
        ]);

        const handler = getRouteHandler("get", "/jobs/search");
        const { req, res, getJson } = mockReqRes();

        await handler(req, res);

        const jobs = getJson().jobs;

        expect(jobs[0].id).toBe("2"); // React → parempi score
        expect(jobs[1].id).toBe("1");
    });

    // -------------------------------------------------------------------------
    // KEYWORDS PARSING
    // -------------------------------------------------------------------------

    test("GET /jobs/search parsii keywords oikein", async () => {
        searchJobsFromAllSources.mockResolvedValue([]);

        const handler = getRouteHandler("get", "/jobs/search");
        const { req, res } = mockReqRes({
            query: {
                keywords: "react, node , typescript"
            }
        });

        await handler(req, res);

        expect(searchJobsFromAllSources).toHaveBeenCalledWith(
            "",
            "",
            ["react", "node", "typescript"]
        );
    });

    // -------------------------------------------------------------------------
    // TYHJÄ TULOS
    // -------------------------------------------------------------------------

    test("GET /jobs/search palauttaa tyhjän listan jos ei tuloksia", async () => {
        searchJobsFromAllSources.mockResolvedValue([]);

        const handler = getRouteHandler("get", "/jobs/search");
        const { req, res, getJson } = mockReqRes();

        await handler(req, res);

        expect(getJson().jobs).toEqual([]);
        expect(getJson().count).toBe(0);
    });

    // -------------------------------------------------------------------------
    // MATCH DATA
    // -------------------------------------------------------------------------

    test("GET /jobs/search lisää matched ja missing skills", async () => {
        searchJobsFromAllSources.mockResolvedValue([
            { id: "1", requiredSkills: ["React"] }
        ]);

        getSkillMatchList.mockReturnValue({
            matchedSkills: ["React"],
            missingSkills: ["Node"]
        });

        const handler = getRouteHandler("get", "/jobs/search");
        const { req, res, getJson } = mockReqRes();

        await handler(req, res);

        const job = getJson().jobs[0];

        expect(job.matchedSkills).toEqual(["React"]);
        expect(job.missingSkills).toEqual(["Node"]);
    });

    // -------------------------------------------------------------------------
    // CANDIDATE PROFILE KÄYTETÄÄN
    // -------------------------------------------------------------------------

    test("GET /jobs/search käyttää candidateProfilea matchiin", async () => {
        searchJobsFromAllSources.mockResolvedValue([
            { id: "1", requiredSkills: ["React"] }
        ]);

        const handler = getRouteHandler("get", "/jobs/search");
        const { req, res } = mockReqRes();

        await handler(req, res);

        expect(calculateMatch).toHaveBeenCalled();
        expect(readDB).toHaveBeenCalledTimes(1);
    });

});