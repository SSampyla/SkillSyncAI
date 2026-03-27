import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { apiFetch } from "./db/useFetch";
import { useMutation } from "./db/useMutation";
import { usePortfolio } from "./db/usePortfolio";

/**
 * Interview practice hook hoitaa interview-simulaation frontend-logiikan.
 *
 * @param {string} jobId - valitun työpaikan ID
 */
export function useInterviewPractice(jobId, searchResults = [], passedJobText = null) {
    const { portfolio } = usePortfolio();
    const { saving, error, run } = useMutation();

    const [interviewId, setInterviewId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [phase, setPhase] = useState(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [answerEvaluation, setAnswerEvaluation] = useState(null);
    const [followUp, setFollowUp] = useState(false);

    const [frozenApplicantText, setFrozenApplicantText] = useState(null);
    const [frozenLanguage, setFrozenLanguage] = useState(null);

    // AbortController — keskeyttää lennossa olevan API-kutsun
    const abortRef = useRef(null);

    const selectedJob = searchResults.find(j => j.id === jobId);
    const jobText = passedJobText || (selectedJob ? `${selectedJob.title}\n${selectedJob.description}` : null); // Jos saimme passedJobTextin, käytetään sitä. Muuten etsitään hakutuloksista.

    // Siivotaan kesken olevat kutsut unmountissa
    useEffect(() => {
        return () => abortRef.current?.abort();
    }, []);

    // Haetaan jobText valitusta jobista
    const skills = Array.isArray(portfolio?.skills) ? portfolio.skills : [];
    const projects = Array.isArray(portfolio?.projects) ? portfolio.projects : [];

    // Rakennetaan applicantText portfoliosta turvallisesti
    const applicantText = useMemo(() => {
        if (!portfolio) return "";

        const skills = Array.isArray(portfolio.skills)
            ? portfolio.skills.join(", ")
            : "";

        // KORJAUS: Lisätään varmistus, että experience on taulukko ennen map-kutsua
        const exp = Array.isArray(portfolio.experience)
            ? portfolio.experience
                .map(e => `${e.title} @ ${e.company}: ${e.description}`)
                .join("\n")
            : "";

        return `Nimi: ${portfolio.name}\nTiivistelmä: ${portfolio.summary}\nTaidot: ${skills}\nKokemus: ${exp}`;
    }, [portfolio]);

    // Aloita haastattelu
    const startInterview = useCallback(async (language = "Finnish") => {

        if (!applicantText) {
            console.error("Applicant text missing"); // Lisää tämä debuggausta varten
            return;
        }

        if (!jobText || jobText.length < 10) {
            return console.error("Työpaikkakuvaus puuttuu tai on liian lyhyt"); // Estetään tyhjät tai "undefined" -tekstit
        }

        if (!portfolio) {
            return console.warn("Odotetaan portfolion latautumista...");
        }

        // Peruuta mahdollinen edellinen kutsu
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        return run(async () => {
            try {
                const res = await apiFetch("/api/interview/practice", {
                    method: "POST",
                    signal: controller.signal,
                    body: JSON.stringify({
                        jobText,
                        applicantText,
                        language,
                        chatHistory: [] // Aloituksessa historian pitää olla tyhjä lista.
                    })
                });

                // console.log("DEBUG: Haastattelu aloitettu, data:", res);

                setInterviewId(res.interviewId);
                setPhase(res.phase);
                setQuestionIndex(res.questionIndex);
                setFrozenApplicantText(applicantText);
                setFrozenLanguage(language);
                setAnswerEvaluation(null);
                setFollowUp(false);
                setMessages([
                    {
                        role: "assistant",
                        content: res.nextQuestion
                    }
                ]);
                return res;
            } catch (err) {
                if (err.name === "AbortError") return;
                throw err;
            }
        }, "[useInterviewPractice] start failed");
    }, [run, jobText, applicantText]);

    // Lähetä vastaus
    const sendMessage = useCallback(async (userMessage, language = "Finnish") => {
        if (saving || !userMessage?.trim() || !interviewId) return;

        // Peruuta mahdollinen edellinen kutsu
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        return run(async () => {
            try {
                const res = await apiFetch("/api/interview/practice", {
                    method: "POST",
                    body: JSON.stringify({
                        interviewId,
                        userMessage,
                        jobText,
                        applicantText: frozenApplicantText ?? applicantText,
                        language: frozenLanguage ?? language,
                        chatHistory: messages // Lähetetään nykyinen viestilista backendiin
                    })
                });

                // console.log("DEBUG: Viesti lähetetty, data:", res);

                setInterviewId(res.interviewId);
                setPhase(res.phase);
                setQuestionIndex(res.questionIndex);
                setAnswerEvaluation(res.answerEvaluation);
                setFollowUp(res.followUp);
                setMessages(prev => [
                    ...prev,
                    { role: "user", content: userMessage },
                    { role: "assistant", content: res.nextQuestion }
                ]);

                return res;
            } catch (err) {
                if (err.name === "AbortError") return;
                throw err;
            }
        }, "[useInterviewPractice] send failed");
    }, [saving, run, interviewId, jobText, applicantText, messages, frozenApplicantText, frozenLanguage]);

    // Reset
    const resetInterview = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setInterviewId(null);
        setMessages([]);
        setPhase(null);
        setQuestionIndex(0);
        setAnswerEvaluation(null);
        setFollowUp(false);
        setFrozenApplicantText(null);
        setFrozenLanguage(null);
    }, []);

    return {
        interviewId,
        messages,
        phase,
        questionIndex,
        answerEvaluation,
        followUp,
        loading: saving,
        error,
        startInterview,
        sendMessage,
        resetInterview
    };
}