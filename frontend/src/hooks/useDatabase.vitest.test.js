import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";

vi.mock("../utils/skillUtils", () => ({
  frontendSkillsToApplicantText: vi.fn((skills) => {
    const all = [
      ...(skills?.frontend ?? []),
      ...(skills?.backend ?? []),
      ...(skills?.tools ?? []),
      ...(skills?.other ?? []),
    ];
    return all.length > 0 ? `Skills: ${all.join(", ")}` : null;
  }),
  dbProfileToFrontendSkills: vi.fn((profile, availableSkills) => {
    const result = { frontend: [], backend: [], tools: [], other: [] };
    if (!profile || !availableSkills) return result;
    const map = Object.entries(availableSkills).reduce((acc, [cat, skills]) => {
      if (!Array.isArray(skills)) return acc;
      skills.forEach(s => { acc[s.toLowerCase()] = cat; });
      return acc;
    }, {});
    [...(profile.hardSkillsProficient ?? []), ...(profile.hardSkillsBasics ?? []),
     ...(profile.softSkillsProficient ?? []), ...(profile.softSkillsBasics ?? [])
    ].forEach(skill => {
      const cat = map[skill.toLowerCase()] ?? "other";
      if (!result[cat].includes(skill)) result[cat].push(skill);
    });
    return result;
  }),
}));

const {
  useSynchronizeCandidateSkills,
  useAvailableSkills,
  useCandidateProfile,
  usePortfolio,
  useAppliedJobs,
} = await import("./useDatabase.js");

// ---------------------------------------------------------------------------
// Apurit
// ---------------------------------------------------------------------------

const mockFetchOk = (data) =>
  vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(data) });

const mockFetchFail = (status = 500) =>
  vi.fn().mockResolvedValue({ ok: false, status, json: () => Promise.resolve({ error: "err" }) });

// ---------------------------------------------------------------------------
// Testidata
// ---------------------------------------------------------------------------

const EMPTY_PORTFOLIO = {
  name: "", title: "", email: "", phone: "", location: "",
  github: "", linkedin: "", summary: "",
  experience: [], education: [], certifications: [],
  profileSummary: { whyMe: [], lookingFor: [] },
  skills: { frontend: [], backend: [], tools: [], other: [] },
};

const MOCK_AVAILABLE_SKILLS = {
  frontend: ["React.js", "Vue.js"],
  backend: ["Node.js", "Python"],
  tools: ["Git", "Docker"],
  other: ["Problem Solving", "Leadership"],
};

const MOCK_CANDIDATE_PROFILE = {
  hardSkillsProficient: ["React.js", "Node.js"],
  hardSkillsBasics: ["Git"],
  softSkillsProficient: ["Leadership"],
  softSkillsBasics: [],
};

// ---------------------------------------------------------------------------
// Testit
// ---------------------------------------------------------------------------

describe("useDatabase hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.warn.mockRestore();
    console.error.mockRestore();
    global.fetch = undefined;
  });

  // =========================================================================
  describe("useAvailableSkills", () => {
    test("palauttaa taidot onnistuneen haun jälkeen", async () => {
      global.fetch = mockFetchOk(MOCK_AVAILABLE_SKILLS);
      const { result } = renderHook(() => useAvailableSkills());
      expect(result.current.loading).toBe(true);
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.availableSkills).toEqual(MOCK_AVAILABLE_SKILLS);
      expect(result.current.error).toBeNull();
    });

    test("asettaa error-tilan kun haku epäonnistuu", async () => {
      global.fetch = mockFetchFail(404);
      const { result } = renderHook(() => useAvailableSkills());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).not.toBeNull();
      expect(result.current.availableSkills).toEqual({ frontend: [], backend: [], tools: [], other: [] });
    });

    test("hakee täsmälleen kerran mountissa", async () => {
      global.fetch = mockFetchOk(MOCK_AVAILABLE_SKILLS);
      const { result } = renderHook(() => useAvailableSkills());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/database/available-skills"),
        expect.any(Object)
      );
    });
  });

  // =========================================================================
  describe("useCandidateProfile", () => {
    test("ei hae ennen kuin availableSkills on ladattu", () => {
      global.fetch = mockFetchOk(MOCK_CANDIDATE_PROFILE);
      renderHook(() => useCandidateProfile({ frontend: [], backend: [], tools: [], other: [] }, { current: false }));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test("hakee ja muuntaa profiilin oikeisiin kategorioihin", async () => {
      global.fetch = mockFetchOk(MOCK_CANDIDATE_PROFILE);
      const { result } = renderHook(() =>
        useCandidateProfile(MOCK_AVAILABLE_SKILLS, { current: false })
      );
      await waitFor(() => expect(result.current.selectedSkills.frontend.length).toBeGreaterThan(0));
      expect(result.current.selectedSkills.frontend).toContain("React.js");
      expect(result.current.selectedSkills.backend).toContain("Node.js");
      expect(result.current.selectedSkills.tools).toContain("Git");
      expect(result.current.selectedSkills.other).toContain("Leadership");
    });

    test("asettaa isLoadingFromDB.current = true haun jälkeen", async () => {
      global.fetch = mockFetchOk(MOCK_CANDIDATE_PROFILE);
      const isLoadingFromDB = { current: false };
      const { result } = renderHook(() => useCandidateProfile(MOCK_AVAILABLE_SKILLS, isLoadingFromDB));
      await waitFor(() => expect(result.current.selectedSkills.frontend.length).toBeGreaterThan(0));
      expect(isLoadingFromDB.current).toBe(true);
    });

    test("ei päivitä taitoja jos candidateProfile on tyhjä", async () => {
      global.fetch = mockFetchOk({ hardSkillsProficient: [], hardSkillsBasics: [], softSkillsProficient: [], softSkillsBasics: [] });
      const isLoadingFromDB = { current: false };
      const { result } = renderHook(() => useCandidateProfile(MOCK_AVAILABLE_SKILLS, isLoadingFromDB));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.selectedSkills).toEqual({ frontend: [], backend: [], tools: [], other: [] });
      expect(isLoadingFromDB.current).toBe(false);
    });
  });

  // =========================================================================
  describe("useSynchronizeCandidateSkills", () => {
    beforeEach(() => {
      // shouldAdvanceTime: true — waitFor toimii fake-timereiden kanssa
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test("ei synkronoi heti mountissa", () => {
      global.fetch = mockFetchOk({ skills: MOCK_CANDIDATE_PROFILE });
      renderHook(() =>
        useSynchronizeCandidateSkills(
          { frontend: ["React.js"], backend: [], tools: [], other: [] },
          vi.fn(),
          { current: false }
        )
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test("ohittaa synkronoinnin kun isLoadingFromDB on true", async () => {
      global.fetch = mockFetchOk({ skills: MOCK_CANDIDATE_PROFILE });
      const onStatusChange = vi.fn();
      const isLoadingFromDB = { current: true };

      renderHook(() =>
        useSynchronizeCandidateSkills(
          { frontend: ["React.js"], backend: [], tools: [], other: [] },
          onStatusChange,
          isLoadingFromDB
        )
      );

      await act(async () => { await vi.runAllTimersAsync(); });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(isLoadingFromDB.current).toBe(false);
    });

    test("kutsuu LLM:ää ja tallentaa profiilin debounce-viiveen jälkeen", async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ skills: MOCK_CANDIDATE_PROFILE }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) });

      const onStatusChange = vi.fn();
      const isLoadingFromDB = { current: false };

      const { rerender } = renderHook(
        ({ skills }) => useSynchronizeCandidateSkills(skills, onStatusChange, isLoadingFromDB),
        { initialProps: { skills: { frontend: [], backend: [], tools: [], other: [] } } }
      );

      rerender({ skills: { frontend: ["React.js"], backend: [], tools: [], other: [] } });
      await act(async () => { await vi.runAllTimersAsync(); });

      expect(onStatusChange).toHaveBeenCalledWith("saved");
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(1,
        expect.stringContaining("/api/jobs/skills/applicant"),
        expect.objectContaining({ method: "POST" })
      );
      expect(global.fetch).toHaveBeenNthCalledWith(2,
        expect.stringContaining("/api/database/candidate-profile"),
        expect.objectContaining({ method: "PUT" })
      );
    });

    test("asettaa error-tilan jos LLM-kutsu epäonnistuu", async () => {
      global.fetch = mockFetchFail(502);
      const onStatusChange = vi.fn();
      const isLoadingFromDB = { current: false };

      const { rerender } = renderHook(
        ({ skills }) => useSynchronizeCandidateSkills(skills, onStatusChange, isLoadingFromDB),
        { initialProps: { skills: { frontend: [], backend: [], tools: [], other: [] } } }
      );

      rerender({ skills: { frontend: ["React.js"], backend: [], tools: [], other: [] } });
      await act(async () => { await vi.runAllTimersAsync(); });

      expect(onStatusChange).toHaveBeenCalledWith("error");
    });

    test("ei synkronoi jos taidot ovat tyhjät", async () => {
      global.fetch = mockFetchOk({});
      const onStatusChange = vi.fn();
      const isLoadingFromDB = { current: false };

      const { rerender } = renderHook(
        ({ skills }) => useSynchronizeCandidateSkills(skills, onStatusChange, isLoadingFromDB),
        { initialProps: { skills: { frontend: [], backend: [], tools: [], other: [] } } }
      );

      rerender({ skills: { frontend: [], backend: [], tools: [], other: [] } });
      await act(async () => { await vi.runAllTimersAsync(); });

      expect(onStatusChange).toHaveBeenCalledWith("pending");
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  describe("usePortfolio", () => {
    test("hakee portfolion mountissa", async () => {
      global.fetch = mockFetchOk({ ...EMPTY_PORTFOLIO, name: "Testi" });
      const { result } = renderHook(() => usePortfolio());
      expect(result.current.loading).toBe(true);
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.portfolio.name).toBe("Testi");
    });

    test("updatePortfolio lähettää PUT ja päivittää tilan", async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(EMPTY_PORTFOLIO) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) });

      const { result } = renderHook(() => usePortfolio());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => { await result.current.updatePortfolio({ ...EMPTY_PORTFOLIO, name: "Uusi Nimi" }); });

      expect(result.current.portfolio.name).toBe("Uusi Nimi");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/database/portfolio"),
        expect.objectContaining({ method: "PUT" })
      );
    });

    test("resetPortfolio lähettää DELETE ja hakee tyhjän pohjan", async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ...EMPTY_PORTFOLIO, name: "Vanha" }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(EMPTY_PORTFOLIO) });

      const { result } = renderHook(() => usePortfolio());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => { await result.current.resetPortfolio(); });

      expect(result.current.portfolio.name).toBe("");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/database/portfolio"),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    test("updatePortfolio heittää virheen epäonnistuessa", async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(EMPTY_PORTFOLIO) })
        .mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({}) });

      const { result } = renderHook(() => usePortfolio());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await expect(act(async () => { await result.current.updatePortfolio({ name: "X" }); })).rejects.toThrow();
    });
  });

  // =========================================================================
  describe("useAppliedJobs", () => {
    const mockJobs = [
      { id: "1", title: "Dev", compatibility: 80, recommended: true, matchedSkills: [], missingSkills: [] },
      { id: "2", title: "Lead", compatibility: 60, recommended: false, matchedSkills: [], missingSkills: [] },
    ];

    test("hakee työpaikat mountissa", async () => {
      global.fetch = mockFetchOk(mockJobs);
      const { result } = renderHook(() => useAppliedJobs());
      expect(result.current.loading).toBe(true);
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.jobs).toHaveLength(2);
      expect(result.current.jobs[0].title).toBe("Dev");
    });

    test("saveJob luo uuden työpaikan", async () => {
      const newJob = { id: "3", title: "Uusi", compatibility: 75, recommended: true, matchedSkills: [], missingSkills: [] };
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, job: newJob }) });

      const { result } = renderHook(() => useAppliedJobs());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => { await result.current.saveJob("3", { title: "Uusi" }); });

      expect(result.current.jobs).toHaveLength(1);
      expect(result.current.jobs[0].title).toBe("Uusi");
    });

    test("saveJob päivittää olemassaolevan työpaikan", async () => {
      const updatedJob = { ...mockJobs[0], title: "Päivitetty Dev" };
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockJobs) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, job: updatedJob }) });

      const { result } = renderHook(() => useAppliedJobs());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => { await result.current.saveJob("1", { title: "Päivitetty Dev" }); });

      expect(result.current.jobs[0].title).toBe("Päivitetty Dev");
      expect(result.current.jobs).toHaveLength(2);
    });

    test("deleteJob poistaa työpaikan", async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockJobs) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) });

      const { result } = renderHook(() => useAppliedJobs());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => { await result.current.deleteJob("1"); });

      expect(result.current.jobs).toHaveLength(1);
      expect(result.current.jobs.find(j => j.id === "1")).toBeUndefined();
    });

    test("getJob hakee yksittäisen työpaikan", async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockJobs) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockJobs[0]) });

      const { result } = renderHook(() => useAppliedJobs());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let job;
      await act(async () => { job = await result.current.getJob("1"); });

      expect(job.id).toBe("1");
      expect(job.title).toBe("Dev");
    });

    test("deleteJob heittää virheen epäonnistuessa eikä muuta listaa", async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockJobs) })
        .mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({}) });

      const { result } = renderHook(() => useAppliedJobs());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await expect(act(async () => { await result.current.deleteJob("1"); })).rejects.toThrow();
      expect(result.current.jobs).toHaveLength(2);
    });
  });
});