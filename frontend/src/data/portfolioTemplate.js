export function createEmptyExperience() {
  return {
    title: "",
    company: "",
    period: "",
    description: "",
    achievements: [""],
  };
}

export function createEmptyEducation() {
  return {
    degree: "",
    institution: "",
    year: "",
    relevant: [""],
  };
}

export function createEmptyPortfolio() {
  return {
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    github: "",
    linkedin: "",
    summary: "",
    skills: {
      frontend: [],
      backend: [],
      tools: [],
      other: [],
    },
    experience: [],
    education: [],
    certifications: [],
    profileSummary: {
      whyMe: [],
      lookingFor: [],
    },
  };
}

// DEPRACATED: Siirretty backendin db.json:iin ja haetaan sieltä API:lla. Katso backend/routes/database.js
// backend/services/dbService.json INITIAL_STATE alustaa "availableSkills" objektin. Kuvittele read-only datana.

export const availableSkills_depracated = {
  frontend: [
    "Väärä datalähde depracated", "skill_frontend", "hae API:sta"
  ],
  backend: [
    "Väärä datalähde depracated", "skill_backend", "hae API:sta"
  ],
  tools: [
    "Väärä datalähde depracated", "skill_tools", "hae API:sta"
  ],
  other: [
    "Väärä datalähde depracated", "other", "hae API:sta"
  ],
};
