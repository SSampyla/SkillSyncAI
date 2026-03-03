/**
 * Job Scraper Service
 * 
 * Hakee työpaikkailmoituksia eri lähteistä:
 * - Duunitori.fi
 * - LinkedIn (OAuth setup)
 * - Yritysten omat sivut
 */

/**
 * Mock Duunitori scraper - simuloi Duunitori.fi haussa saatuja tuloksia
 * Tuotannossa tämä tekisi oikeat HTTP-kutsut ja parseisi HTML:ää
 */
async function scrapeDuunitori(jobTitle, location, keywords) {
  // Simuloidaan Duunitori API-kutsua - luo tuloksia hakusanan perusteella
  let duunitoriJobs = [
    {
      id: `duunitori_${Date.now()}_1`,
      title: jobTitle,
      company: "Futurice Oy",
      location: "Helsinki",
      description: `Etsiimme ${jobTitle}:ia tiimeihimme. Vaatimukset: ${keywords.join(", ")}. 
        Tarjoamme dynaamista työympäristöä ja mahdollisuuden kehittyä kansainvälisissä projekteissa.`,
      salary: "4500-6500€/kk",
      type: "Kokoaikainen",
      posted: "3 päivää sitten",
      source: "Duunitori",
      link: `https://duunitori.fi/tyopaikat/${jobTitle.toLowerCase().replace(/ /g, "-")}`,
      requiredSkills: keywords.length > 0 ? keywords : ["JavaScript", "React", "Node.js"],
      matchedSkills: keywords.slice(0, Math.ceil(keywords.length / 2)) || ["React"],
      compatibility: 78,
      recommended: Math.random() > 0.6
    }
  ];

  // Suodata sijainnin mukaan jos määritelty
  if (location && location.trim()) {
    duunitoriJobs = duunitoriJobs.filter(job => 
      job.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  return duunitoriJobs;
}

/**
 * Mock LinkedIn scraper - simuloi LinkedIn Job Search API tuloksia
 * Tuotannossa tämä käyttäisi LinkedIn Official Job Search API:a (vaatii OAuth)
 */
async function scrapeLinkedIn(jobTitle, location, keywords) {
  // LinkedIn vaatii OAuth integraation tuotannossa
  // Tämä on mock-implementaatio
  let linkedInJobs = [
    {
      id: `linkedin_${Date.now()}_1`,
      title: jobTitle,
      company: "Nokia Solutions and Networks",
      location: "Espoo",
      description: `Nokia on johtava teknologiayritys. Etsimme ${jobTitle}:ia kuulumaan tiimiimme.
        Teknologioita: ${keywords.join(", ")}. Sijoitamme koulutukseen ja kehitykseen.`,
      salary: "4000-6000€/kk",
      type: "Kokoaikainen",
      posted: "1 päivä sitten",
      source: "LinkedIn",
      link: `https://linkedin.com/jobs/view/${Math.random().toString().slice(2, 12)}`,
      requiredSkills: keywords.length > 0 ? keywords : ["C++", "Python", "JavaScript"],
      matchedSkills: keywords.slice(0, Math.ceil(keywords.length / 3)) || ["JavaScript"],
      compatibility: 72,
      recommended: false
    }
  ];

  // Suodata sijainnin mukaan jos määritelty
  if (location && location.trim()) {
    linkedInJobs = linkedInJobs.filter(job => 
      job.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  return linkedInJobs;
}

/**
 * Mock Company Careers scraper - simuloi yritysten omia career-sivuja
 * Tuotannossa tekisi HTTP-kutsuja ja parseisi HTML:ää cheerio/jsdom:lla
 */
async function scrapeCompanyCareers(jobTitle, location, keywords) {
  let companyJobs = [
    {
      id: `company_${Date.now()}_1`,
      title: jobTitle,
      company: "Slush Foundation",
      location: "Helsinki",
      description: `Slush etsii ${jobTitle}:ia globaalista Tech-ekosysteemistä.
        Oletko kiinnostunut ${keywords.join(", ")} teknologioista? Tulemme internationalille tasolle.`,
      salary: "3500-5000€/kk",
      type: "Kokoaikainen",
      posted: "5 päivää sitten",
      source: "Yrityksen sivu",
      link: "https://slush.org/careers",
      requiredSkills: keywords.length > 0 ? keywords : ["JavaScript", "Product thinking"],
      matchedSkills: keywords.slice(0, 1) || ["JavaScript"],
      compatibility: 68,
      recommended: false
    }
  ];

  // Suodata sijainnin mukaan jos määritelty
  if (location && location.trim()) {
    companyJobs = companyJobs.filter(job => 
      job.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  return companyJobs;
}

/**
 * Pääfunktio: haku kaikista lähteistä rinnakkain
 * @param {string} jobTitle - Haettava tehtävän nimi
 * @param {string} location - Sijainti
 * @param {string[]} keywords - Avainsanat/teknologiat
 * @param {string} experience - "junior" | "mid" | "senior"
 * @returns {object[]} - Yhdistetty lista kaikista löydetyistä töistä
 */
export async function searchJobsFromAllSources(jobTitle, location, keywords = [], experience = "mid") {
  try {
    console.log(`🔍 Haetaan töitä: "${jobTitle}" sijainnista "${location || "Kaikki"}"...`);
    
    // Hae kaikista lähteistä rinnakkain
    const [duunitoriResults, linkedInResults, companyResults] = await Promise.all([
      scrapeDuunitori(jobTitle, location, keywords),
      scrapeLinkedIn(jobTitle, location, keywords),
      scrapeCompanyCareers(jobTitle, location, keywords)
    ]);

    // Yhdistä ja suodata tulokset
    let allJobs = [
      ...duunitoriResults,
      ...linkedInResults,
      ...companyResults
    ];

    // Laske yhteensopivuus kokemustason perusteella
    allJobs = allJobs.map(job => {
      let salaryMultiplier = 1;
      if (experience === "senior") salaryMultiplier = 1.2;
      if (experience === "junior") salaryMultiplier = 0.8;

      return {
        ...job,
        // Päivitä palkka kokemustason mukaan
        salary: job.salary // Tuotannossa laskettaisiin oikeasti
      };
    });

    // Sorttaa yhteensopivuuden mukaan (suurin ensin)
    allJobs.sort((a, b) => b.compatibility - a.compatibility);

    console.log(`✅ Löytyi ${allJobs.length} työpaikkaa`);
    
    return allJobs;

  } catch (error) {
    console.error("❌ Virhe haettaessa töitä:", error.message);
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
      return scrapeDuunitori(jobTitle, location, keywords);
    case "linkedin":
      return scrapeLinkedIn(jobTitle, location, keywords);
    case "company":
      return scrapeCompanyCareers(jobTitle, location, keywords);
    default:
      return searchJobsFromAllSources(jobTitle, location, keywords);
  }
}

export default {
  searchJobsFromAllSources,
  searchJobsBySource
};