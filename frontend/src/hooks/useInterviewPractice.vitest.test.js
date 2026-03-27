import { renderHook, act } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { useInterviewPractice } from "./useInterviewPractice";

vi.mock("./db/useFetch", () => ({
    apiFetch: vi.fn(),
}));

vi.mock("./db/useMutation", () => ({
    useMutation: vi.fn(() => ({
        saving: false,
        error: null,
        run: vi.fn(async (callback) => await callback()),
    })),
}));

vi.mock("./db/usePortfolio", () => ({
    usePortfolio: vi.fn(() => ({
        portfolio: {
            name: "Matti Meikäläinen",
            summary: "Kokenut kehittäjä",
            skills: ["React", "Node.js"],
            experience: [
                { title: "Senior Dev", company: "Tech Oy", description: "Fullstack koodausta" },
            ],
        },
    })),
}));

import { apiFetch } from "./db/useFetch";
import { useMutation } from "./db/useMutation";
import { usePortfolio } from "./db/usePortfolio";

describe("useInterviewPractice", () => {
    const mockJobId = "job-123";
    const mockSearchResults = [
        { id: "job-123", title: "Frontend Engineer", description: "Etsimme React-osaajaa." },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "error").mockImplementation(() => { });
        vi.spyOn(console, "warn").mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("alustaa tilan oikein", () => {
        const { result } = renderHook(() => useInterviewPractice(mockJobId, mockSearchResults));

        expect(result.current.interviewId).toBeNull();
        expect(result.current.messages).toEqual([]);
        expect(result.current.phase).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    describe("startInterview", () => {
        test("aloittaa haastattelun onnistuneesti", async () => {
            apiFetch.mockResolvedValueOnce({
                interviewId: "int-456",
                phase: "introduction",
                questionIndex: 0,
                nextQuestion: "Kerro itsestäsi?",
            });

            const { result } = renderHook(() => useInterviewPractice(mockJobId, mockSearchResults));

            await act(async () => {
                await result.current.startInterview("Finnish");
            });

            expect(apiFetch).toHaveBeenCalledWith(
                "/api/interview/practice",
                expect.objectContaining({
                    method: "POST",
                    body: expect.stringContaining('"language":"Finnish"'),
                })
            );

            expect(result.current.interviewId).toBe("int-456");
            expect(result.current.messages).toHaveLength(1);
            expect(result.current.messages[0].content).toBe("Kerro itsestäsi?");
        });

        test("ei aloita jos työpaikkakuvaus puuttuu", async () => {
            const { result } = renderHook(() => useInterviewPractice("wrong-id", mockSearchResults));

            await act(async () => {
                await result.current.startInterview();
            });

            expect(apiFetch).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining("puuttuu"));
        });

        test("jäädyttää hakijan tiedot ja kielen aloituksessa", async () => {
            apiFetch.mockResolvedValueOnce({ interviewId: "int-456", nextQuestion: "Q1" });

            const { result } = renderHook(() => useInterviewPractice(mockJobId, mockSearchResults));

            await act(async () => {
                await result.current.startInterview("English");
            });

            apiFetch.mockResolvedValueOnce({ nextQuestion: "Q2" });

            await act(async () => {
                await result.current.sendMessage("My answer", "Finnish");
            });

            const secondCallBody = JSON.parse(apiFetch.mock.calls[1][1].body);
            expect(secondCallBody.language).toBe("English");
        });
    });

    describe("sendMessage", () => {
        test("lisää käyttäjän viestin ja vastauksen listaan", async () => {
            apiFetch
                .mockResolvedValueOnce({ interviewId: "int-1", nextQuestion: "Q1", phase: "intro" })
                .mockResolvedValueOnce({ interviewId: "int-1", nextQuestion: "Kysymys 2", phase: "practice" });

            const { result } = renderHook(() => useInterviewPractice(mockJobId, mockSearchResults));

            await act(async () => {
                await result.current.startInterview();
            });

            await act(async () => {
                await result.current.sendMessage("Tässä vastaukseni");
            });

            expect(result.current.messages).toHaveLength(3);
            expect(result.current.messages[1].role).toBe("user");
            expect(result.current.messages[2].content).toBe("Kysymys 2");
        });

        test("ei lähetä tyhjää viestiä", async () => {
            const { result } = renderHook(() => useInterviewPractice(mockJobId, mockSearchResults));

            await act(async () => {
                await result.current.sendMessage("   ");
            });

            expect(apiFetch).not.toHaveBeenCalled();
        });
    });

    describe("resetInterview", () => {
        test("nollaa tilan kokonaan", async () => {
            apiFetch.mockResolvedValueOnce({ interviewId: "int-1", nextQuestion: "Q1" });

            const { result } = renderHook(() => useInterviewPractice(mockJobId, mockSearchResults));

            await act(async () => {
                await result.current.startInterview();
            });

            act(() => {
                result.current.resetInterview();
            });

            expect(result.current.interviewId).toBeNull();
            expect(result.current.messages).toEqual([]);
            expect(result.current.phase).toBeNull();
        });
    });

    describe("AbortController & siivous", () => {
        test("peruuttaa edellisen kutsun kun uusi aloitetaan", async () => {
            let firstController = { aborted: false, abort() { this.aborted = true; } };
            let secondController = { aborted: false, abort() { this.aborted = true; } };

            apiFetch.mockImplementation((url, options) => {
                if (!firstController.used) {
                    firstController.used = true;
                    options.signal = firstController;
                } else {
                    options.signal = secondController;
                    firstController.abort();
                }
                return Promise.resolve({ interviewId: "dummy", nextQuestion: "Q" });
            });

            const { result } = renderHook(() => useInterviewPractice(mockJobId, mockSearchResults));

            await act(async () => result.current.startInterview());
            await act(async () => result.current.startInterview());

            expect(firstController.aborted).toBe(true);
            expect(secondController.aborted).toBe(false);
        });

        test("unmount abortoi lennossa olevat kutsut", async () => {
            let capturedSignal;

            // Mockataan apiFetch niin, että tallennetaan hookin käyttämä signal
            apiFetch.mockImplementation((url, options) => {
                capturedSignal = options.signal;
                // Palautetaan Promise, jota ei koskaan resolve, jotta pysyy lennossa
                return new Promise(() => { });
            });

            const { result, unmount } = renderHook(() =>
                useInterviewPractice(mockJobId, mockSearchResults)
            );

            // Käynnistetään startInterview, joka luo AbortControllerin
            await act(async () => {
                result.current.startInterview();
            });

            // Nyt capturedSignal pitäisi olla määritelty
            expect(capturedSignal).toBeDefined();

            // Unmount suorittaa hookin cleanupin, joka abortoi signalin
            act(() => unmount());

            // Signalin aborted-property pitäisi olla true
            expect(capturedSignal.aborted).toBe(true);
        });
    });

    describe("Virhekäsittely", () => {
        test("heittää virheen jos apiFetch epäonnistuu", async () => {
            const testError = new Error("Network fail");
            useMutation.mockReturnValueOnce({
                saving: false,
                error: testError,
                run: vi.fn(async (cb) => { try { return await cb(); } catch (e) { throw e; } }),
            });

            apiFetch.mockRejectedValueOnce(testError);

            const { result } = renderHook(() => useInterviewPractice(mockJobId, mockSearchResults));

            await expect(act(async () => {
                await result.current.startInterview();
            })).rejects.toThrow("Network fail");
        });
    });

    describe("applicantText muodostus", () => {
        test("muodostaa tekstin oikein portfoliosta", async () => {
            apiFetch.mockResolvedValueOnce({ nextQuestion: "Q1" });
            const { result } = renderHook(() => useInterviewPractice(mockJobId, mockSearchResults));

            await act(async () => result.current.startInterview());

            const callBody = JSON.parse(apiFetch.mock.calls[0][1].body);
            expect(callBody.applicantText).toContain("Matti Meikäläinen");
            expect(callBody.applicantText).toContain("React, Node.js");
            expect(callBody.applicantText).toContain("Tech Oy");
        });

        test("käsittelee tyhjän portfolion", async () => {
            usePortfolio.mockReturnValueOnce({ portfolio: null });
            const { result } = renderHook(() => useInterviewPractice(mockJobId, mockSearchResults));

            await act(async () => result.current.startInterview());

            expect(apiFetch).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith("Applicant text missing");
        });
    });
});