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

const SOURCE_JOBS = {
  Duunitori: [
    {
      id: "duunitori_1",
      title: "Frontend Developer",
      company: "Futurice Oy",
      location: "Helsinki",
      description:
        "Rakennat React-pohjaisia web-sovelluksia ja osallistut UX-kehitykseen.",
      salary: "4500-6500EUR/kk",
      type: "Kokoaikainen",
      posted: "3 paivaa sitten",
      source: "Duunitori",
      link: "https://duunitori.fi/tyopaikat/frontend-developer",
      level: "mid",
      requiredSkills: ["React", "JavaScript", "TypeScript", "CSS"],
      compatibility: 83,
      recommended: true,
    },
    {
      id: "duunitori_2",
      title: "Backend Developer",
      company: "DataFlow Oy",
      location: "Tampere",
      description:
        "Suunnittelet Node.js API -ratkaisuja ja kehitat mikropalveluarkkitehtuuria.",
      salary: "4200-5800EUR/kk",
      type: "Kokoaikainen",
      posted: "2 paivaa sitten",
      source: "Duunitori",
      link: "https://duunitori.fi/tyopaikat/backend-developer",
      level: "mid",
      requiredSkills: ["Node.js", "Express", "MongoDB", "REST API"],
      compatibility: 79,
      recommended: false,
    },
    {
      id: "duunitori_3",
      title: "Junior Full Stack Developer",
      company: "WebStart Oy",
      location: "Helsinki",
      description: "Junior-rooli React- ja Node.js-projekteissa mentoroinnilla.",
      salary: "3000-3800EUR/kk",
      type: "Kokoaikainen",
      posted: "5 paivaa sitten",
      source: "Duunitori",
      link: "https://duunitori.fi/tyopaikat/junior-fullstack",
      level: "junior",
      requiredSkills: ["React", "Node.js", "Git", "JavaScript"],
      compatibility: 86,
      recommended: true,
    },
  ],
  LinkedIn: [
    {
      id: "linkedin_1",
      title: "Senior Full Stack Developer",
      company: "Nokia Solutions and Networks",
      location: "Espoo",
      description:
        "Tuotekehitysrooli, jossa kaytetaan Reactia, Node.js:aa ja pilvipalveluita.",
      salary: "5500-7000EUR/kk",
      type: "Kokoaikainen",
      posted: "1 paiva sitten",
      source: "LinkedIn",
      link: "https://linkedin.com/jobs/view/1234567890",
      level: "senior",
      requiredSkills: ["React", "Node.js", "AWS", "Docker"],
      compatibility: 77,
      recommended: false,
    },
    {
      id: "linkedin_2",
      title: "Mid-level React Developer",
      company: "Scaleup Helsinki",
      location: "Helsinki",
      description:
        "Frontend-keskeinen rooli SPA-kehitykseen ja komponenttiarkkitehtuuriin.",
      salary: "4300-5600EUR/kk",
      type: "Kokoaikainen",
      posted: "4 paivaa sitten",
      source: "LinkedIn",
      link: "https://linkedin.com/jobs/view/2234567890",
      level: "mid",
      requiredSkills: ["React", "TypeScript", "Redux", "Jest"],
      compatibility: 81,
      recommended: true,
    },
    {
      id: "linkedin_3",
      title: "DevOps Engineer",
      company: "CloudTech Solutions",
      location: "Helsinki",
      description:
        "Automatisoit deployment-prosesseja Kubernetes- ja CI/CD-ymparistoissa.",
      salary: "5000-6500EUR/kk",
      type: "Kokoaikainen",
      posted: "6 paivaa sitten",
      source: "LinkedIn",
      link: "https://linkedin.com/jobs/view/3234567890",
      level: "mid",
      requiredSkills: ["Docker", "Kubernetes", "CI/CD", "AWS"],
      compatibility: 73,
      recommended: false,
    },
  ],
  "Yrityksen sivu": [
    {
      id: "company_1",
      title: "Software Developer",
      company: "Slush Foundation",
      location: "Helsinki",
      description:
        "Monipuolinen kehitysrooli tapahtuma-alustan frontend- ja backend-ratkaisuihin.",
      salary: "3800-5200EUR/kk",
      type: "Kokoaikainen",
      posted: "5 paivaa sitten",
      source: "Yrityksen sivu",
      link: "https://slush.org/careers",
      level: "mid",
      requiredSkills: ["JavaScript", "React", "Node.js", "PostgreSQL"],
      compatibility: 75,
      recommended: false,
    },
    {
      id: "company_2",
      title: "Backend Engineer",
      company: "HealthSoft",
      location: "Turku",
      description:
        "Rakennat suorituskykyisia palveluita terveysdatan kasittelyyn.",
      salary: "4400-5900EUR/kk",
      type: "Kokoaikainen",
      posted: "2 paivaa sitten",
      source: "Yrityksen sivu",
      link: "https://healthsoft.fi/careers",
      level: "mid",
      requiredSkills: ["Node.js", "PostgreSQL", "Docker", "REST API"],
      compatibility: 78,
      recommended: false,
    },
    {
      id: "company_3",
      title: "Junior Frontend Developer",
      company: "AppWorks Mobile",
      location: "Helsinki",
      description:
        "Junior-fronttirooli modernien React-kayttoliittymien toteutukseen.",
      salary: "2900-3600EUR/kk",
      type: "Kokoaikainen",
      posted: "3 paivaa sitten",
      source: "Yrityksen sivu",
      link: "https://appworks.fi/jobs",
      level: "junior",
      requiredSkills: ["React", "JavaScript", "HTML", "CSS"],
      compatibility: 84,
      recommended: true,
    },
  ],
};

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