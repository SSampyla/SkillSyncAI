/**
 * ------------------------------------------------------------------
 * Synonyymisanakirja
 * ------------------------------------------------------------------
 *
 * Synonyymit tarvitaan match laskentaa varten. Korjaa eri kirjoitusmuotoja samaksi. 
 * (match laskennan algoritmille react != ReactJS)
 * 
 * Kun AI analysoi tekstistä "erinomaiset ryhmätyötaidot", se saattaa palauttaa "ryhmätyötaidot". 
 * Hakijalla taas saattaa lukea profiilissaan "tiimityö".
 * 
 * Nämä viedään myös AI prompteihin, jotta LLM voi yrittää muokata jo valmiiksi.
 * Backend logiikka tunnistaa syötteen "ReactJS" syötteeksi "react".
 * Huom: Synonyymilistaan ei pidä lisätä ääkkösiä, ne poistetaan koodissa.
 * 
 * Jos tulee muita synonyymejä mieleen niin lisää vain vapaasti
 */

export const SYNONYMS = {

  // Ohjelmointikielet ja runtime-ympäristöt
  reactjs: "react",
  js: "javascript",
  ts: "typescript",
  nodejs: "node",
  cpp: "cpp",
  csharp: "csharp",
  net: "dotnet", // .NET -> net -> dotnet
  golang: "go",
  
  // Pilvipalvelut ja infrastruktuuri
  amazonwebservices: "aws",
  googlecloudplatform: "gcp",
  googlecloud: "gcp",
  microsoftazure: "azure",
  k8s: "kubernetes",
  dockercompose: "docker",
  cicd: "cicd",
  githubactions: "github",
  
  // Frameworkit ja kirjastot
  vuejs: "vue",
  angularjs: "angular",
  tailwindcss: "tailwind",
  nextjs: "next",
  expressjs: "express",
  postgresql: "postgres",
  mongodb: "mongo",
  mssql: "sqlserver",
  mysql: "sql",
  
  // Muut termit ja metodologiat
  unittesting: "testing",
  automatedtesting: "testing",
  restapi: "rest",
  scrummaster: "scrum",
  uidesign: "ui",
  uxdesign: "ux",
  fullstack: "fullstack",
  frontend: "frontend",
  backend: "backend",

  // --- Soft Skills (Pehmeat taidot) ---
  tiimityo: "tiimityo",
  tiimityoskentely: "tiimityo",
  ryhmatyo: "tiimityo",
  yhteistyokyky: "tiimityo",
  yhteistyotaidot: "tiimityo",

  viestintataidot: "viestinta",
  kommunikointi: "viestinta",
  vuorovaikutustaidot: "viestinta",
  esiintymistaidot: "viestinta",

  itseohjautuvuus: "itseohjautuvuus",
  omaaloitteisuus: "itseohjautuvuus",
  kykytyoskennellaitsepain: "itseohjautuvuus",

  ongelmanratkaisu: "ongelmanratkaisu",
  ongelmanratkaisutaidot: "ongelmanratkaisu",
  analyyttisyys: "ongelmanratkaisu",

  johtaminen: "johtaminen",
  leadership: "johtaminen",
  esimiestyo: "johtaminen",
  tiiminveto: "johtaminen",

  oppimiskyky: "oppimiskyky",
  haluoppia: "oppimiskyky",
  jatkuvaoppiminen: "oppimiskyky",

  suomenkieli: "suomi",
  suomenkielentaito: "suomi",
  englanninkieli: "englanti",
  englanninkielentaito: "englanti"

};

// Muuttaa synonyymit AI-promptiin sopivaksi merkkijonoksi
export const getAiNamingInstructions = () => {
  let instructions = "NAMING CONVENTIONS:\n";
  for (const [raw, official] of Object.entries(SYNONYMS)) {
    instructions += `- Use "${official}" for ${raw}\n`;
  }
  return instructions;
};