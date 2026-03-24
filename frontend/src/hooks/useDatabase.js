/**
 * @file hooks/useDatabase.js
 * @description Facade — kokoaa kaikki DB-hookit yhdeksi sisääntulopisteeksi.
 *
 * Kuluttavat komponentit importtaavat edelleen täältä, sisäinen jako on läpinäkyvä:
 *
 *   db/apiFetch.js            — yhteinen fetch-apuri
 *   db/useMutation.js         — DRY-apuri saving/error/try-catch-kuviolle
 *   db/useSkills.js           — useSynchronizeCandidateSkills, useAvailableSkills,
 *                               useCandidateSkills, clearCandidateSkills, syncSkillsOnce
 *   db/usePortfolio.js        — usePortfolio
 *   db/useAppliedJobs.js      — useAppliedJobs
 *   db/usePortfolioProjects.js — usePortfolioProjects
 *
 * Testejä varten: npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
 */
 
export {
  useSynchronizeCandidateSkills,
  useAvailableSkills,
  useCandidateSkills,
  clearCandidateSkills,
  syncSkillsOnce,
} from "./db/useSkills";
 
export { usePortfolio } from "./db/usePortfolio";
export { useAppliedJobs } from "./db/useAppliedJobs";
export { usePortfolioProjects } from "./db/usePortfolioProjects";