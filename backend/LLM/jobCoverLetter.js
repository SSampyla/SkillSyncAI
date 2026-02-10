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

import client from "../LLM/client.js";

export async function generateCoverLetter(jobText, applicantText, language, matchData) {

    // Muotoillaan matchData merkkijonoksi promptia varten
    const matchesArray = Array.isArray(matchData?.matchedKeywords) ? matchData.matchedKeywords : [];
    const matchesString = matchesArray.length
        ? `KEY MATCHES FROM SYSTEM: ${matchesArray.join(', ')}`
        : "No pre-calculated matches provided.";

    const response = await client.chat.completions.create({
        response_format: { type: "json_object" },
        temperature: 0.225,
        max_tokens: 4250,
        messages: [
  {
    role: "system",
    content: `
You are an expert Career Coach. Write a professional cover letter in ${language || "Finnish"}.
Your task is to generate a realistic, down-to-earth, honest, evidence-based cover letter.

INPUT DATA:
- Job Description: inside <JOB_TEXT>
- Applicant Profile: inside <APPLICANT_TEXT>
- System Analysis: inside <SYSTEM_ANALYSIS>

STEP 1 — COMPATIBILITY VALIDATION (MANDATORY)
1.1. Identify:
   - The job role and professional field from <JOB_TEXT>
   - The applicants education, profession, and domain experience from <APPLICANT_TEXT>
1.2. Decide if the applicant is realistically qualified.

If the applicant background does NOT match the job field AND career change is not clear

Return ONLY JSON:

{
  "coverLetter": "Short factual explanation based strictly on the provided texts"
}

DO NOT write a cover letter in this case.
Proceed ONLY if there is a realistic professional match.

STEP 2 — DETERMINE WRITING STYLE
2.1 Detect job domain and adapt tone automatically:
Examples:
2.1.1 If job is technical / engineering / IT:
- Focus on concrete solutions, tools, systems, results
- Minimal emotional language
- Short, direct sentences
2.1.2 If job is healthcare / education / social work:
- Focus on responsibility, real interactions, outcomes
- Professional empathy without exaggeration
- Still concrete and practical
2.1.3 If job is business / management:
- Focus on impact, collaboration, efficiency, leadership


STEP 3 — STRICT CONTENT RULES
3.1 Prioritize skills listed in <SYSTEM_ANALYSIS>. Mention them clearly.
3.2 NEVER invent:
- experience
- education
- certifications
- job titles
- years of experience
- domain knowledge
- communication skills
- teamwork skills
- feedback received
- learning
3.3 If a skill or attribute or importance is not explicitly in <APPLICANT_TEXT>, do NOT include it.
3.4 If applicant lacks a required skill:
   - acknowledge briefly
   - connect to related experience or learning ability
   - do not exaggerate
3.5 Use concrete examples from <APPLICANT_TEXT>:
   - tasks completed
   - problems solved
   - measurable outcomes if available
3.6 If <APPLICANT_TEXT> mentions a problem the applicant solved, include it briefly.
3.7 Eliminate generic phrases such as:
   - "I am passionate about"
   - "I am highly motivated"
   - "I believe I would be a great fit"
   - "I am excited to apply"
   - "I am used to"
3.8 Prefer active voice and short sentences.
3.9 Avoid passive voide.
3.10 Use adjectives sparingly.
3.11 Languages are not important unless stated in <JOB_TEXT>

3.12 Do not forcefully fullfill the wishes of the letter receiver
3.13 Make paragraphs distinctive
- Avoid starting with I am, I or I have done something if possible

STEP 4 — STRUCTURE

4.1 Professional salutation
4.2 Intro: specific interest in this role and organization
4.3 Body 1: key skill matches from system analysis with evidence
4.4 Body 2: soft skills / teamwork / cultural fit with examples
4.5 Outro: clear call to action
4.6 Professional closing
4.7 Include applicant name only if explicitly provided

OUTPUT (JSON):
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