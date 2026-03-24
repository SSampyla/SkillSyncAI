/**
 * ------------------------------------------------------------------
 * generateCoverLetter(jobText, applicantText, language, matchData)
 * ------------------------------------------------------------------
 *
 * Luo ammatillisen työhakemuksen AI:n avulla.
 *
 * Syöte:
 * - jobText: työpaikkailmoituksen teksti
 * - applicantText: hakijan profiiliteksti
 * - language: haluttu kieli (esim. "Finnish")
 * - matchData: aiemmin laskettu osaamismatch { matchedKeywords: string[] }.
 *      -> Tähän voi käyttää funktiota prepareSkillsForPrompt(jobData, candidateData) tiedostosta matchCandidateToJob.js
 *
 * Palauttaa aina stringin:
 * - coverLetter: valmis työhakemus
 *
 * Fallback: jos AI palauttaa virheellistä JSONia tai ei luo hakemusta,
 *          palautetaan selkeä ilmoitus siitä.
 *
 * Käytettävissä suoraan frontissa tai backissa ilman erillistä parsea.
 */

import client, { AZURE_MODEL } from "../LLM/client.js";

export async function generateCoverLetter(jobText, applicantText, language, matchData) {

  // Muotoillaan matchData merkkijonoksi promptia varten
  const matchesArray = Array.isArray(matchData?.matchedKeywords) ? matchData.matchedKeywords : [];
  const matchesString = matchesArray.length
    ? `KEY MATCHES FROM SYSTEM: ${matchesArray.join(', ')}`
    : "No pre-calculated matches provided.";

  const response = await client.chat.completions.create({
    model: AZURE_MODEL,
    response_format: { type: "json_object" },
    temperature: 0.375,
    max_tokens: 5000,
    messages: [
      {
        role: "system",
        content: `
You are an expert Career Coach.

Write a professional, realistic, and slightly persuasive cover letter in ${language || "Finnish"}.

The goal:
- Convince the recruiter through concrete evidence
- Keep tone natural, human, and grounded
- Avoid generic or AI-like phrasing

INPUT:
- <JOB_TEXT>
- <APPLICANT_TEXT> (contains USER INPUT, PORTFOLIO, PROJECTS)
- <SYSTEM_ANALYSIS>

--------------------------------------------------
DATA PRIORITY (CRITICAL)

1. USER INPUT = PRIMARY
- Defines voice, intent, and message
- Preserve tone and meaning

2. PORTFOLIO + PROJECTS = SUPPORT
- Add concrete examples and credibility
- Do NOT override or rewrite USER INPUT

3. NEVER:
- Ignore USER INPUT
- Generate a generic “AI cover letter”
- Invent any experience or skills

--------------------------------------------------
STEP 1 — REALISM CHECK

- Identify job field and applicant background
- If clearly mismatched and no transition is visible:

Return:
{ "coverLetter": "Short factual explanation based strictly on the provided texts" }

Do NOT write a cover letter in that case.

--------------------------------------------------
STEP 2 — WRITING STRATEGY

- Start from USER INPUT
- Strengthen it using relevant details from PORTFOLIO and PROJECTS
- Focus on value to employer, not self-praise

Adapt tone to job type:
- Tech → concrete, tools, results
- Business → impact, collaboration
- Human-facing → responsibility, real outcomes

--------------------------------------------------
STEP 3 — HARD RULES

- Use skills from <SYSTEM_ANALYSIS>
- Use only information explicitly present in input
- If a skill is missing → acknowledge briefly, do not exaggerate
- Prefer concrete examples over claims
- Use short, clear sentences

STRICTLY AVOID:
- “I am passionate about…”
- “I am highly motivated…”
- “I believe I would be a great fit…”
- Any generic filler language

--------------------------------------------------
STEP 4 — STYLE

- Slightly persuasive but not exaggerated
- Show value through evidence, not adjectives
- Keep consistent human voice (no mixed styles)
- Avoid CV-style listing
- Every paragraph should contain at least one concrete detail or example

--------------------------------------------------
STRUCTURE

1. Professional opening
2. Why this role (specific)
3. Key relevant skills + evidence
4. Additional value (team, collaboration, impact)
5. Clear closing

--------------------------------------------------
OUTPUT

Return ONLY JSON:

{ "coverLetter": "..." }
`
      },
      {
        role: "user",
        content: `
<JOB_TEXT>
${jobText}
</JOB_TEXT>

<APPLICANT_TEXT>
${applicantText}
</APPLICANT_TEXT>

<SYSTEM_ANALYSIS>
${matchesString}
</SYSTEM_ANALYSIS>
`
      }
    ]
  });

  try {
    const content = JSON.parse(response.choices[0].message.content);
    return content.coverLetter || "LLM did not return a cover letter.";
  } catch (e) {
    console.warn("LLM returned invalid JSON:", response.choices[0].message.content);
    return "LLM did not return a valid cover letter.";
  }
}