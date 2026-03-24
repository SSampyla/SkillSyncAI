import { SOURCE_JOBS } from "../data/jobs.mock.js";

/**
 * Job Scraper Service
 * 
 * Hakee työpaikkailmoituksia eri lähteistä:
 * - Duunitori.fi
 * - LinkedIn (OAuth setup)
 * - Yritysten omat sivut
 */

const normalize = (value) => `${value ?? ""}`.trim().toLowerCase();

const normalizeKeywords = (keywords = []) =>
  [...new Set(keywords.map((k) => normalize(k)).filter(Boolean))];



const jobSearchText = (job) =>
  [job.title, job.company, job.description, job.location, ...(job.requiredSkills || [])]
    .join(" ")
    .toLowerCase();

const keywordsMatchJob = (job, normalizedKeywords) => {
  if (normalizedKeywords.length === 0) {
    return true;
  }

  const searchText = jobSearchText(job);
  return normalizedKeywords.every((keyword) => searchText.includes(keyword));
};

const finalizeJobForKeywords = (job, normalizedKeywords) => {
  if (normalizedKeywords.length === 0) {
    const matchedSkills = [...job.requiredSkills];
    return {
      ...job,
      matchedSkills,
      missingSkills: [],
    };
  }

  const matchedSkills = job.requiredSkills.filter((skill) => {
    const normalizedSkill = normalize(skill);
    return normalizedKeywords.some(
      (keyword) =>
        normalizedSkill.includes(keyword) || keyword.includes(normalizedSkill)
    );
  });

  const missingSkills = job.requiredSkills.filter(
    (skill) => !matchedSkills.includes(skill)
  );

  const keywordBonus = matchedSkills.length * 5;
  const compatibility = Math.min(98, job.compatibility + keywordBonus);

  return {
    ...job,
    matchedSkills,
    missingSkills,
    compatibility,
    recommended: compatibility >= 80,
  };
};

/**
 * Mock Duunitori scraper - simuloi Duunitori.fi haussa saatuja tuloksia
 * Tuotannossa tämä tekisi oikeat HTTP-kutsut ja parseisi HTML:ää
 */
async function scrapeDuunitori() {
  return [...SOURCE_JOBS.Duunitori];
}

/**
 * Mock LinkedIn scraper - simuloi LinkedIn Job Search API tuloksia
 * Tuotannossa tämä käyttäisi LinkedIn Official Job Search API:a (vaatii OAuth)
 */
async function scrapeLinkedIn() {
  return [...SOURCE_JOBS.LinkedIn];
}

/**
 * Mock Company Careers scraper - simuloi yritysten omia career-sivuja
 * Tuotannossa tekisi HTTP-kutsuja ja parseisi HTML:ää cheerio/jsdom:lla
 */
async function scrapeCompanyCareers() {
  return [...SOURCE_JOBS["Yrityksen sivu"]];
}

/**
 * Pääfunktio: haku kaikista lähteistä rinnakkain
 * @param {string} jobTitle - Haettava tehtävän nimi
 * @param {string} location - Sijainti
 * @param {string[]} keywords - Avainsanat/teknologiat
 * @param {string} experience - "junior" | "mid" | "senior" (optional)
 * @returns {object[]} - Yhdistetty lista kaikista löydetyistä töistä
 */
export async function searchJobsFromAllSources(jobTitle, location, keywords = [], experience = "") {
  try {
    const normalizedTitle = normalize(jobTitle);
    const normalizedLocation = normalize(location);
    const normalizedKeywords = normalizeKeywords(keywords);
    const normalizedExperience = normalize(experience);

    console.log(
      `Haetaan toita: "${jobTitle}" sijainnista "${location || "Kaikki"}".`
    );
    
    // Hae kaikista lähteistä rinnakkain
    const [duunitoriResults, linkedInResults, companyResults] = await Promise.all([
      scrapeDuunitori(),
      scrapeLinkedIn(),
      scrapeCompanyCareers()
    ]);

    // Yhdistä ja suodata tulokset
    let allJobs = [
      ...duunitoriResults,
      ...linkedInResults,
      ...companyResults
    ];

    // Suodata haku tarkasti annettujen ehtojen mukaan.
    allJobs = allJobs
      .filter((job) => {
        const matchesTitle =
          !normalizedTitle || normalize(job.title).includes(normalizedTitle);
        const matchesLocation =
          !normalizedLocation ||
          normalize(job.location).includes(normalizedLocation);
        const matchesKeywords = keywordsMatchJob(job, normalizedKeywords);
        const matchesExperience =
          !normalizedExperience || normalize(job.level) === normalizedExperience;

        return (
          matchesTitle &&
          matchesLocation &&
          matchesKeywords &&
          matchesExperience
        );
      })
      .map((job) => finalizeJobForKeywords(job, normalizedKeywords));

    // Sorttaa yhteensopivuuden mukaan (suurin ensin)
    allJobs.sort((a, b) => b.compatibility - a.compatibility);

    console.log(`Loytyi ${allJobs.length} tyopaikkaa`);
    
    return allJobs;

  } catch (error) {
    console.error("Virhe haettaessa toita:", error.message);
    // Palauta tyhjä array virheen tapauksessa
    return [];
  }
}

/**
 * Hae yksittäisestä lähteestä
 */
export async function searchJobsBySource(jobTitle, location, keywords, source) {
  switch(source.toLowerCase()) {
    case "duunitori":
      return scrapeDuunitori();
    case "linkedin":
      return scrapeLinkedIn();
    case "company":
      return scrapeCompanyCareers();
    default:
      return searchJobsFromAllSources(jobTitle, location, keywords);
  }
}

export default {
  searchJobsFromAllSources,
  searchJobsBySource
};