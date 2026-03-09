import express from "express";
import { generateInterviewReply } from "../LLM/interviewPractice.js";

const router = express.Router();

const MAX_TEXT_LENGTH = 25000;
const MAX_CHAT_MESSAGES = 30;

const ALLOWED_PHASES = [
    "intro",
    "technical",
    "behavioral",
    "closing",
    "feedback"
];


// =============================
// ----- Validointi -----
// =============================

const validateInterviewInput = (req, res, next) => {

    const { jobText, chatHistory, phase } = req.body;

    if (!jobText?.trim()) {
        return res.status(400).json({
            error: "Työpaikkailmoituksen teksti puuttuu."
        });
    }

    if (!Array.isArray(chatHistory)) {
        return res.status(400).json({
            error: "chatHistory pitää olla taulukko."
        });
    }

    if (phase && !ALLOWED_PHASES.includes(phase)) {
        return res.status(400).json({
            error: "Virheellinen interview phase."
        });
    }

    if (jobText.length > MAX_TEXT_LENGTH) {
        return res.status(413).json({
            error: `Työpaikkailmoitus on liian pitkä. Maksimi ${MAX_TEXT_LENGTH} merkkiä.`
        });
    }

    if (chatHistory.length > MAX_CHAT_MESSAGES) {
        return res.status(413).json({
            error: `Chat history liian pitkä. Maksimi ${MAX_CHAT_MESSAGES} viestiä.`
        });
    }

    for (const msg of chatHistory) {

        if (!msg.role || !msg.content) {
            return res.status(400).json({
                error: "Chat viesteissä pitää olla role ja content."
            });
        }

        if (msg.role !== "user" && msg.role !== "assistant") {
            return res.status(400).json({
                error: "role pitää olla 'user' tai 'assistant'."
            });
        }

        if (msg.content.length > MAX_TEXT_LENGTH) {
            return res.status(413).json({
                error: "Chat viesti liian pitkä."
            });
        }
    }

    next();
};


// =============================
// ----- Error handler -----
// =============================

const handleRouteError = (res, err, startTime, context) => {

    const duration = Date.now() - startTime;

    console.error(`${context} failed (${duration} ms)`);

    if (err.status) {
        console.error("Azure OpenAI error:", {
            status: err.status,
            message: err.message,
            code: err.code
        });

        return res.status(502).json({
            error: "Tekoälypalvelu ei vastannut oikein."
        });
    }

    console.error("Backend error:", err);

    res.status(500).json({
        error: `Palvelinvirhe ${context.toLowerCase()}.`
    });
};

// =====================================
// ------------ Apufunktiot ------------
// =====================================

function deriveInterviewState(chatHistory) {

    const assistantMessages = chatHistory.filter(m => m.role === "assistant");

    const questionCount = assistantMessages.length;

    const lastAssistant = assistantMessages.at(-1);

    const lastPhase = lastAssistant?.phase ?? "derive from chat history";

    return {
        questionCount,
        lastPhase
    };
}

function nextPhase(questionCount) {

    if (questionCount < 2) return "intro";

    if (questionCount < 6) return "technical";

    if (questionCount < 9) return "behavioral";

    if (questionCount < 11) return "closing";

    return "feedback";
}

// =====================================
// ---- POST /api/interview/practice ---
// =====================================

router.post("/practice", validateInterviewInput, async (req, res) => {

    console.log("POST /api/interview/practice called");

    const startTime = Date.now();

    try {

        const { jobText, chatHistory, language } = req.body;

        const { questionCount, lastPhase } = deriveInterviewState(chatHistory);

        const computedPhase = nextPhase(questionCount);

        const questionIndex = questionCount + 1;

        console.log(`phase: ${computedPhase} | questionCount: ${questionCount}`);

        const result = await generateInterviewReply(
            chatHistory,
            jobText,
            computedPhase,
            language
        );

        let finalPhase = computedPhase;

        // Jos AI pyytää follow-up kysymystä, pysytään samassa phasessa
        if (result.followUp) {
            finalPhase = lastPhase;
        }

        const duration = Date.now() - startTime;

        console.log(`POST /api/interview/practice success (${duration} ms)`);
        console.log(`
=========================================
[Interview Reply Generated]
Phase:              ${finalPhase || "N/A"}
Question Index:     ${questionIndex || "N/A"}
Follow Up:          ${result.followUp}
Next Question:      ${result.nextQuestion || "N/A"}
Answer Evaluation:        
${JSON.stringify(result.answerEvaluation, null, 2)}
=========================================
        `.trim());

        res.json({
            phase: finalPhase,
            questionIndex,
            nextQuestion: result.nextQuestion,
            followUp: result.followUp,
            answerEvaluation: result.answerEvaluation,
            responseTimeMs: duration
        });

    } catch (err) {

        handleRouteError(
            res,
            err,
            startTime,
            "Haastatteluharjoittelussa"
        );

    }
});

export default router;