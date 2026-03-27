import express from "express";
import { asyncHandler } from "../utils/apiCoreLLM.js";
import { createValidator, validateInterview } from "../utils/routeValidatorsLLM.js";
import { generateInterviewReply } from "../LLM/interviewPractice.js";
import { getCache, setCache } from "../utils/apiCoreLLM.js";

/*
# Interview Practice API /api/interview/practice

Tämä reitti hoitaa haastattelusimulaation tilanhallinnan. Frontendin ei tarvitse säilöä chat-historiaa, vaan ainoastaan kantaa mukanaan `interviewId`-tunnistetta.

## Toimintalogiikka

1. **Aloitus:** Lähetä `jobText` ja `language`. Jätä `interviewId` ja `userMessage` tyhjäksi.
   * *Paluuarvo:* Ensimmäinen kysymys ja `interviewId`.
2. **Keskustelu:** Lähetä seuraavissa kutsuissa saamasi `interviewId` ja käyttäjän vastaus kentässä `userMessage`.
3. **Välimuisti:** Keskustelu säilyy palvelimen muistissa 2 tuntia viimeisimmän viestin jälkeen.

## Esimerkki (Request)
```json
{
  "interviewId": "int_1710758400_abc12",
  "userMessage": "Olen työskennellyt Reactin parissa kolme vuotta.",
  "jobText": "...",
  "language": "Finnish"
}
*/

const router = express.Router();

function deriveInterviewState(chatHistory) {

  const assistantMessages = chatHistory.filter(m => m.role === "assistant");

  const questionCount = assistantMessages.length;

  const lastAssistant = assistantMessages.at(-1);

  const lastPhase = lastAssistant?.phase || nextPhase(questionCount);

  console.log(`[LLM Interview State] interview state derived: ${lastPhase}, question count: ${questionCount}`);

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


router.post(
  "/practice",
  createValidator(validateInterview),

  asyncHandler(async (req) => {
    console.log("[LLM route: Interview practice called]");

    const { jobText, applicantText, userMessage, language, interviewId } = req.body;


    let history = [];
    let currentId = interviewId;

    if (!jobText) {
      throw new Error("jobText is required");
    }

    if (!interviewId && userMessage) {
      throw new Error("Start interview before sending messages");
    }

    if (!currentId && userMessage) {
      throw new Error("Start interview before sending messages");
    }

    if (!currentId) {
      currentId = `int_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      setCache(currentId + "_meta", { applicantText, jobText }, 1000 * 60 * 60 * 4);
    }

    const meta = currentId ? getCache(currentId + "_meta") : null;

    const cachedHistory = getCache(currentId);
    if (cachedHistory) {
      history = [...cachedHistory];
    } else if (interviewId) {
      // Jos käyttäjä lähetti ID:n, mutta sitä ei löydy välimuistista, 
      // session on vanhentunut -> nollataan vasta tässä kohtaa.
      currentId = null;
    }

    // Lisätään käyttäjän viesti historiaan
    if (userMessage && userMessage.trim()) {
      history.push({ role: "user", content: userMessage.trim() });
    }

    // Johdetaan tila historiasta
    const { questionCount, lastPhase } = deriveInterviewState(history);
    const computedPhase = nextPhase(questionCount);
    const questionIndex = questionCount + 1;

    const finalApplicantText = meta?.applicantText ?? applicantText;
    const finalJobText = meta?.jobText ?? jobText;

    // Tämä kutsuu nyt funktiota, joka osaa sisäisesti käyttää cachea (testit kiittää)
    const result = await generateInterviewReply(
      history,
      finalJobText,
      finalApplicantText,
      computedPhase,
      language
    );

    const finalPhase = result.followUp ? lastPhase : computedPhase;

    // Päivitetään historia assistantin vastauksella ja tallennetaan
    history.push({
      role: "assistant",
      content: result.nextQuestion,
      phase: finalPhase
    });

    // Tallennetaan päivitetty historia 2h ajaksi
    setCache(currentId, history, 1000 * 60 * 60 * 2);

    console.log(`
=========================================
[Interview Reply Generated]
Answer Evaluation:        
${JSON.stringify(result.answerEvaluation, null, 2)}
Phase:              ${finalPhase || "N/A"}
Question Index:     ${questionIndex || "N/A"}
Follow Up:          ${result.followUp}
Next Question:      ${result.nextQuestion || "N/A"}
=========================================
        `.trim());

    return {
      interviewId: currentId,
      phase: finalPhase,
      questionIndex,
      nextQuestion: result.nextQuestion,
      followUp: result.followUp,
      answerEvaluation: result.answerEvaluation
    };

  }, "Haastatteluharjoittelu")
);

export default router;