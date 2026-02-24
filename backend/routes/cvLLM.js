import express from "express";
import { generateEditedCV } from "../LLM/cvEdit.js";

const router = express.Router();
const MAX_TEXT_LENGTH = 30000;


// =============================
// ----- Validointi -----
// =============================

const validateCvEditInput = (req, res, next) => {
    const { jobText, cvText } = req.body;

    if (!jobText?.trim()) {
        return res.status(400).json({
            error: "Työpaikkailmoituksen teksti puuttuu."
        });
    }

    if (!cvText?.trim()) {
        return res.status(400).json({
            error: "CV teksti puuttuu."
        });
    }

    if (jobText.length > MAX_TEXT_LENGTH) {
        return res.status(413).json({
            error: `Työpaikkailmoitus on liian pitkä. Maksimi ${MAX_TEXT_LENGTH} merkkiä.`
        });
    }

    if (cvText.length > MAX_TEXT_LENGTH) {
        return res.status(413).json({
            error: `CV teksti on liian pitkä. Maksimi ${MAX_TEXT_LENGTH} merkkiä.`
        });
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
// ----- POST /api/cv/edit -----
// =====================================

router.post("/edit", validateCvEditInput, async (req, res) => {
    console.log("POST /api/cv/edit called");

    const startTime = Date.now();

    try {
        const { jobText, cvText, language } = req.body;

        const result = await generateEditedCV(
            jobText,
            cvText,
            language
        );

        const duration = Date.now() - startTime;

        console.log(`POST /api/cv/edit success (${duration} ms)`);

        res.json({
            editedCV: result.editedCV,
            responseTimeMs: duration
        });

    } catch (err) {
        handleRouteError(
            res,
            err,
            startTime,
            "CV:n muokkauksessa"
        );
    }
});

export default router;