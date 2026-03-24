import { renderHook, act } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";

vi.mock("../services/api", () => ({
  searchJobs: vi.fn(),
}));

const { searchJobs } = await import("../services/api");
const { useJobSearch, parseKeywords } = await import("./useJobSearch.js");

// ---------------------------------------------------------------------------
// Apurit
// ---------------------------------------------------------------------------

const mockSearchOk = (jobs = [], extra = {}) =>
  searchJobs.mockResolvedValue({ jobs, ...extra });

const mockSearchFail = (message = "Network error") =>
  searchJobs.mockRejectedValue(new Error(message));

// ---------------------------------------------------------------------------
// Testidata
// ---------------------------------------------------------------------------

const MOCK_JOBS = [
  {
    id: "job_1",
    title: "Frontend Developer",
    company: "TechCorp Oy",
    location: "Helsinki",
    compatibility: 88,
    recommended: true,
    requiredSkills: ["React", "JavaScript"],
    matchedSkills: ["React", "JavaScript"],
    missingSkills: [],
    salary: "Ei ilmoitettu",
    type: "Kokoaikainen",
    posted: "2 päivää sitten",
    source: "Duunitori",
  },
  {
    id: "job_2",
    title: "Backend Developer",
    company: "DataSystems Ltd",
    location: "Tampere",
    compatibility: 72,
    recommended: false,
    requiredSkills: ["Node.js", "PostgreSQL"],
    matchedSkills: ["Node.js"],
    missingSkills: ["PostgreSQL"],
    salary: "3800-4800€/kk",
    type: "Kokoaikainen",
    posted: "3 päivää sitten",
    source: "LinkedIn",
  },
];

// ---------------------------------------------------------------------------
// Testit
// ---------------------------------------------------------------------------

describe("useJobSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Tyhjä localStorage ennen jokaista testiä
    localStorage.clear();
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  // =========================================================================
  describe("Alkutila", () => {
    test("ei hae mountissa — loading on false heti", () => {
      const { result } = renderHook(() => useJobSearch());
      expect(result.current.loading).toBe(false);
      expect(result.current.searched).toBe(false);
      expect(result.current.availableJobs).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(searchJobs).not.toHaveBeenCalled();
    });

    test("oletuskriteerit ovat oikein", () => {
      const { result } = renderHook(() => useJobSearch());
      expect(result.current.searchCriteria.jobTitle).toBe("Frontend Developer");
      expect(result.current.searchCriteria.location).toBe("Helsinki");
      expect(result.current.keywordInput).toBe("React, JavaScript");
    });

    test("appliedJobs latautuu localStoragesta", () => {
      localStorage.setItem("appliedJobs", JSON.stringify([MOCK_JOBS[0]]));
      const { result } = renderHook(() => useJobSearch());
      expect(result.current.appliedJobs).toHaveLength(1);
      expect(result.current.appliedJobs[0].id).toBe("job_1");
    });

    test("korruptoitunut localStorage ei kaada hookia", () => {
      localStorage.setItem("appliedJobs", "ei-validia-jsonia{{{");
      const { result } = renderHook(() => useJobSearch());
      expect(result.current.appliedJobs).toEqual([]);
    });
  });

  // =========================================================================
  describe("handleSearch", () => {
    test("hakee työpaikat ja asettaa tulokset", async () => {
      mockSearchOk(MOCK_JOBS);
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleSearch();
      });

      expect(result.current.availableJobs).toHaveLength(2);
      expect(result.current.availableJobs[0].title).toBe("Frontend Developer");
      expect(result.current.searched).toBe(true);
      expect(result.current.error).toBeNull();
    });

    test("asettaa loading-tilan haun ajaksi", async () => {
      let resolveSearch;
      searchJobs.mockReturnValue(new Promise((res) => { resolveSearch = res; }));

      const { result } = renderHook(() => useJobSearch());
      act(() => { result.current.handleSearch(); });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveSearch({ jobs: MOCK_JOBS });
      });

      expect(result.current.loading).toBe(false);
    });

    test("lähettää oikeat kriteerit API:lle", async () => {
      mockSearchOk([]);
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        result.current.setSearchCriteria((prev) => ({
          ...prev,
          jobTitle: "Full Stack Developer",
          location: "Tampere",
        }));
        result.current.setKeywordInput("React, Node.js");
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      expect(searchJobs).toHaveBeenCalledWith({
        jobTitle: "Full Stack Developer",
        location: "Tampere",
        keywords: ["React", "Node.js"],
      });
    });

    test("trimmaa whitespace hakukriteereistä", async () => {
      mockSearchOk([]);
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        result.current.setSearchCriteria((prev) => ({
          ...prev,
          jobTitle: "  Frontend Developer  ",
          location: "  Helsinki  ",
        }));
      });

      await act(async () => { await result.current.handleSearch(); });

      expect(searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          jobTitle: "Frontend Developer",
          location: "Helsinki",
        })
      );
    });

    test("nollaa edellisen virheen uuden haun alussa", async () => {
      mockSearchFail("Verkkovirhe");
      const { result } = renderHook(() => useJobSearch());
      await act(async () => { await result.current.handleSearch(); });
      expect(result.current.error).not.toBeNull();

      mockSearchOk(MOCK_JOBS);
      await act(async () => { await result.current.handleSearch(); });
      expect(result.current.error).toBeNull();
    });

    test("nollaa edelliset tulokset uuden haun alussa", async () => {
      mockSearchOk(MOCK_JOBS);
      const { result } = renderHook(() => useJobSearch());
      await act(async () => { await result.current.handleSearch(); });
      expect(result.current.availableJobs).toHaveLength(2);

      mockSearchFail("Virhe");
      await act(async () => { await result.current.handleSearch(); });
      expect(result.current.availableJobs).toEqual([]);
    });

    test("preventDefault kutsutaan jos event annetaan", async () => {
      mockSearchOk([]);
      const { result } = renderHook(() => useJobSearch());
      const fakeEvent = { preventDefault: vi.fn() };

      await act(async () => { await result.current.handleSearch(fakeEvent); });

      expect(fakeEvent.preventDefault).toHaveBeenCalledTimes(1);
    });

    test("toimii ilman event-argumenttia", async () => {
      mockSearchOk([]);
      const { result } = renderHook(() => useJobSearch());
      await expect(
        act(async () => { await result.current.handleSearch(); })
      ).resolves.not.toThrow();
    });

    test("asettaa searchMeta haun jälkeen", async () => {
      mockSearchOk(MOCK_JOBS, { responseTimeMs: 123, sources: ["Duunitori", "LinkedIn"] });
      const { result } = renderHook(() => useJobSearch());

      await act(async () => { await result.current.handleSearch(); });

      expect(result.current.searchMeta.responseTime).toBe(123);
      expect(result.current.searchMeta.sources).toEqual(["Duunitori", "LinkedIn"]);
    });

    test("tyhjentää searchMetan virheen sattuessa", async () => {
      mockSearchOk(MOCK_JOBS, { responseTimeMs: 99, sources: ["Duunitori"] });
      const { result } = renderHook(() => useJobSearch());
      await act(async () => { await result.current.handleSearch(); });

      mockSearchFail("Virhe");
      await act(async () => { await result.current.handleSearch(); });

      expect(result.current.searchMeta).toEqual({ responseTime: null, sources: [] });
    });
  });

  // =========================================================================
  describe("Virheenhallinta", () => {
    test("asettaa error-tilan API-virheen sattuessa", async () => {
      mockSearchFail("Palvelin ei vastaa");
      const { result } = renderHook(() => useJobSearch());

      await act(async () => { await result.current.handleSearch(); });

      expect(result.current.error).toBe("Palvelin ei vastaa");
      expect(result.current.availableJobs).toEqual([]);
      expect(result.current.searched).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    test("ei fallbackaa demo-dataan — virhe on virhe", async () => {
      mockSearchFail("500 Internal Server Error");
      const { result } = renderHook(() => useJobSearch());

      await act(async () => { await result.current.handleSearch(); });

      expect(result.current.availableJobs).toEqual([]);
      expect(result.current.error).not.toBeNull();
    });

    test("käsittelee virheen jolla ei ole message-kenttää", async () => {
      searchJobs.mockRejectedValue(new Error());
      const { result } = renderHook(() => useJobSearch());

      await act(async () => { await result.current.handleSearch(); });

      // Virhe asettuu — ei kaadu
      expect(result.current.error).toBeDefined();
      expect(result.current.searched).toBe(true);
    });
  });

  // =========================================================================
  describe("applyForJob", () => {
    test("lisää työpaikan appliedJobs-listaan", async () => {
      const { result } = renderHook(() => useJobSearch());

      act(() => { result.current.applyForJob(MOCK_JOBS[0]); });

      expect(result.current.appliedJobs).toHaveLength(1);
      expect(result.current.appliedJobs[0].id).toBe("job_1");
    });

    test("ei lisää samaa työpaikkaa kahdesti", () => {
      const { result } = renderHook(() => useJobSearch());

      act(() => { result.current.applyForJob(MOCK_JOBS[0]); });
      act(() => { result.current.applyForJob(MOCK_JOBS[0]); });

      expect(result.current.appliedJobs).toHaveLength(1);
    });

    test("tallentaa työpaikan localStorageen", () => {
      const { result } = renderHook(() => useJobSearch());

      act(() => { result.current.applyForJob(MOCK_JOBS[0]); });

      const stored = JSON.parse(localStorage.getItem("appliedJobs"));
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe("job_1");
    });

    test("voi hakea useampaan työpaikkaan", () => {
      const { result } = renderHook(() => useJobSearch());

      act(() => { result.current.applyForJob(MOCK_JOBS[0]); });
      act(() => { result.current.applyForJob(MOCK_JOBS[1]); });

      expect(result.current.appliedJobs).toHaveLength(2);
    });
  });

  // =========================================================================
  describe("isApplied", () => {
    test("palauttaa false jos ei ole hakenut", () => {
      const { result } = renderHook(() => useJobSearch());
      expect(result.current.isApplied("job_1")).toBe(false);
    });

    test("palauttaa true haetun työpaikan ID:llä", () => {
      const { result } = renderHook(() => useJobSearch());

      act(() => { result.current.applyForJob(MOCK_JOBS[0]); });

      expect(result.current.isApplied("job_1")).toBe(true);
      expect(result.current.isApplied("job_2")).toBe(false);
    });
  });

  // =========================================================================
  describe("setKeywordInput", () => {
    test("päivittää keywordInputin ja searchCriteria.keywords yhtä aikaa", () => {
      const { result } = renderHook(() => useJobSearch());

      act(() => { result.current.setKeywordInput("TypeScript, Docker, AWS"); });

      expect(result.current.keywordInput).toBe("TypeScript, Docker, AWS");
      expect(result.current.searchCriteria.keywords).toEqual(["TypeScript", "Docker", "AWS"]);
    });

    test("tyhjä syöte tuottaa tyhjän keywords-arrayn", () => {
      const { result } = renderHook(() => useJobSearch());

      act(() => { result.current.setKeywordInput(""); });

      expect(result.current.searchCriteria.keywords).toEqual([]);
    });
  });

  // =========================================================================
  describe("localStorage-synkronointi", () => {
    test("päivittää appliedJobs kun storage-event saapuu toisesta välilehdestä", async () => {
      const { result } = renderHook(() => useJobSearch());
      expect(result.current.appliedJobs).toEqual([]);

      await act(async () => {
        localStorage.setItem("appliedJobs", JSON.stringify([MOCK_JOBS[0]]));
        window.dispatchEvent(new Event("storage"));
      });

      expect(result.current.appliedJobs).toHaveLength(1);
      expect(result.current.appliedJobs[0].id).toBe("job_1");
    });

    test("storage event listener poistetaan unmountissa", () => {
      const removeSpy = vi.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(() => useJobSearch());
      unmount();
      expect(removeSpy).toHaveBeenCalledWith("storage", expect.any(Function));
      removeSpy.mockRestore();
    });
  });
});

// =========================================================================
describe("parseKeywords (apufunktio)", () => {
  test("pilkkoerotus", () => {
    expect(parseKeywords("React, Node.js, TypeScript")).toEqual(["React", "Node.js", "TypeScript"]);
  });

  test("puolipisteerotus", () => {
    expect(parseKeywords("React; Node.js")).toEqual(["React", "Node.js"]);
  });

  test("rivinvaihtoerotus", () => {
    expect(parseKeywords("React\nNode.js")).toEqual(["React", "Node.js"]);
  });

  test("poistaa tyhjät osat", () => {
    expect(parseKeywords("React,,, Node.js")).toEqual(["React", "Node.js"]);
  });

  test("trimmaa whitespace", () => {
    expect(parseKeywords("  React  ,  Node.js  ")).toEqual(["React", "Node.js"]);
  });

  test("tyhjä string tuottaa tyhjän arrayn", () => {
    expect(parseKeywords("")).toEqual([]);
  });
});