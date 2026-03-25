// Tämä on kopioitu fronterndiin src/utils/skillUtils.js muista päivittää.
import { calculateMatch, getSkillMatchList } from "../utils/matchCandidateToJob.js";

export function dbProfileToFrontendSkills(candidateProfile, availableSkills) {
    const result = { frontend: [], backend: [], tools: [], other: [] };
    if (!candidateProfile) return result;

    // Rakennetaan map tässä, parametrina saadusta datasta
    const skillToCategoryMap = Object.entries(availableSkills).reduce(
        (map, [category, skills]) => {
            if (!Array.isArray(skills)) return map;
            skills.forEach((skill) => { map[skill.toLowerCase()] = category; });
            return map;
        }, {}
    );

    const allSkills = [
        ...(candidateProfile.hardSkillsProficient ?? []),
        ...(candidateProfile.hardSkillsBasics ?? []),
        ...(candidateProfile.softSkillsProficient ?? []),
        ...(candidateProfile.softSkillsBasics ?? []),
    ];

    allSkills.forEach((skill) => {
        const category = skillToCategoryMap[skill.toLowerCase()] ?? "other"; // <-- tässä menee jotain pieleen
        if (!result[category].includes(skill)) result[category].push(skill);
    });

    return result;
}

export function frontendSkillsToApplicantText(skills) {
    const all = [
        ...(skills.frontend ?? []),
        ...(skills.backend ?? []),
        ...(skills.tools ?? []),
        ...(skills.other ?? []),
    ];
    if (all.length === 0) return null;
    return `Skills: ${all.join(", ")}`;
}

// ==============================================
//  BACKEND JOB ENRICHMENT / RECOMMENDED LOGIIKKA
// ==============================================

/**
 * Muuntaa scrapatun työn taitoformaatista match-enginen odottamaan muotoon. Tätä ei tarvita frontin puolella.
 */
const mapJobToMatchFormat = (job) => ({
    hardSkillsRequired: job.requiredSkills ?? [],
    hardSkillsOptional: [],
    softSkillsRequired: [],
    softSkillsOptional: []
});

/**
 * Rikastaa työpaikan yhteensopivuusluvuilla.
 * Ainoa yhteinen toteutus — käytä tätä kaikissa reiteissä.
 *
 * @param {Object} job - Työpaikka-objekti (scraper tai DB-formaatti)
 * @param {Object} candidateProfile - Hakijan profiili DB:stä
 * @returns {Object|null} Rikastettu työpaikka tai null
 */
export function enrichJob(job, candidateProfile) {
    if (!job) return null;
    
    // Oletusarvot (Early return)
    const baseResult = { 
        ...job, 
        compatibility: 0, 
        recommended: false, 
        matchedSkills: [], 
        missingSkills: [] 
    };

    if (!candidateProfile) return baseResult;

    const jobSkills = mapJobToMatchFormat(job);
    const hasAnyRequirements = Object.values(jobSkills).some(
        (list) => Array.isArray(list) && list.length > 0
    );

    if (!hasAnyRequirements) {
        return { ...baseResult, compatibility: 100, recommended: true };
    }

    const compatibility = calculateMatch(jobSkills, candidateProfile) ?? 0;
    const { matchedSkills = [], missingSkills = [] } = getSkillMatchList(jobSkills, candidateProfile);
    
    const totalSkills = matchedSkills.length + missingSkills.length;
    const missingCount = missingSkills.length;
    const matchRatio = totalSkills > 0 ? matchedSkills.length / totalSkills : 0;
    
    // 1. Kynnysarvot suositukselle
    const MIN_COMPATIBILITY_FOR_RECO = 65;
    const EXCELLENT_MATCH_THRESHOLD = 80;
    
    // 2. Estetään suositus, jos taitoja on liian vähän suhteessa vaatimuksiin
    // Esim. jos vaaditaan 4 asiaa, mutta 3 puuttuu, matchRatio on 0.25.
    const hasEnoughBreadth = totalSkills > 0 && matchRatio >= 0.70;

    const isRecommended = 
        compatibility >= EXCELLENT_MATCH_THRESHOLD || 
        (compatibility >= MIN_COMPATIBILITY_FOR_RECO && hasEnoughBreadth) ||
        (compatibility >= 65 && missingCount <= 1 && totalSkills > 2);

    return {
        ...job,
        compatibility,
        recommended: isRecommended,
        matchedSkills,
        missingSkills
    };
}