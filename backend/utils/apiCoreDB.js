// Tämä on kopioitu fronterndiin src/utils/skillUtils.js muista päivittää.

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