/**
 * ------------------------------------------------------------------
 * Synonyymisanakirja
 * ------------------------------------------------------------------
 *
 * Normalisointialgoritmi tekee ensin nämä muunnokset tekstille:
 *   1. lowercase
 *   2. poistaa ääkköset (NFD normalize)
 *   3. # → sharp   (C# → csharp)
 *   4. + → p       (C++ → cpp)
 *   5. poistaa välilyönnit, viivat, pisteet, alaviivat [\s\-_.]
 *   HUOM: kauttaviiva / ja sulkumerkit () EIVÄT poistu automaattisesti
 *
 * Tämän jälkeen haetaan kanoninen muoto tästä taulukosta.
 * Jos synoyymiä ei löydy, normalisoitu muoto ON kanoninen muoto.
 *
 * KANONINEN MUOTO = se lopullinen avain johon kaikki variantit päätyvät.
 * Sekä hakija että työpaikka normalisoidaan samalla tavalla,
 * joten match toimii kun molemmat päätyvät samaan kanonikkamuotoon.
 *
 * ESIMERKKI:
 *   Hakija: "ReactJS" → normalize → "reactjs" → synonym → "react"
 *   Työ:    "React.js" → normalize → "reactjs" → synonym → "react"
 *   → MATCH ✓
 *
 * Synonyymilistaan ei pidä lisätä ääkkösiä — ne poistetaan ennen hakua.
 */

export const SYNONYMS = {

  // ==================================================================
  // SPECIAL
  // ==================================================================
  "ci/cd": "cicd",
  "sass/scss": "scss",

  // ==================================================================
  // FRONTEND CORE
  // ==================================================================
  react: "react",
  reactjs: "react",

  vue: "vue",
  vuejs: "vue",

  angular: "angular",
  angularjs: "angular",

  next: "next",
  nextjs: "next",

  gatsby: "gatsby",

  javascript: "javascript",
  js: "javascript",

  typescript: "typescript",
  ts: "typescript",

  html: "html",
  html5: "html",

  css: "css",
  css3: "css",

  scss: "scss",
  sass: "scss",

  tailwind: "tailwind",
  tailwindcss: "tailwind",

  bootstrap: "bootstrap",

  materialui: "materialui",
  mui: "materialui",

  // ==================================================================
  // STATE / DATA FETCHING
  // ==================================================================
  redux: "redux",
  reduxjs: "redux",

  zustand: "zustand",

  reactquery: "reactquery",
  tanstackquery: "reactquery",
  tanstackreactquery: "reactquery",

  // ==================================================================
  // BUILD TOOLS
  // ==================================================================
  vite: "vite",
  webpack: "webpack",
  babel: "babel",

  eslint: "eslint",
  prettier: "prettier",

  // ==================================================================
  // FRONTEND CONCEPTS
  // ==================================================================
  responsivedesign: "responsivedesign",
  responsive: "responsivedesign",

  pwa: "pwa",
  progressivewebapp: "pwa",

  accessibility: "a11y",
  a11y: "a11y",

  webperformance: "performance",
  performance: "performance",

  // ==================================================================
  // BACKEND
  // ==================================================================
  node: "node",
  nodejs: "node",

  express: "express",
  expressjs: "express",

  nest: "nestjs",
  nestjs: "nestjs",

  python: "python",

  django: "django",
  flask: "flask",

  java: "java",
  spring: "springboot",
  springboot: "springboot",

  csharp: "csharp",
  dotnet: "dotnet",
  net: "dotnet",
  cpp: "cpp",

  php: "php",
  laravel: "laravel",

  ruby: "ruby",
  rails: "rails",
  rubyonrails: "rails",

  go: "go",
  golang: "go",

  // ==================================================================
  // API / ARCHITECTURE
  // ==================================================================
  rest: "rest",
  restapi: "rest",
  restapis: "rest",

  graphql: "graphql",
  graphqlapi: "graphql",

  apidesign: "apidesign",

  microservice: "microservices",
  microservices: "microservices",

  softwarearchitecture: "architecture",
  architecture: "architecture",
  cleancode: "cleancode",

  // ==================================================================
  // DATABASE
  // ==================================================================
  mongodb: "mongo",
  mongo: "mongo",

  postgresql: "postgres",
  postgres: "postgres",

  mysql: "mysql",

  redis: "redis",

  firebase: "firebase",
  supabase: "supabase",

  sql: "sql",
  nosql: "nosql",

  // ==================================================================
  // AUTH
  // ==================================================================
  jwt: "jwt",
  jsonwebtoken: "jwt",
  bearer: "jwt",

  oauth: "oauth",
  oauth2: "oauth",

  authentication: "auth",
  authorization: "auth",
  auth: "auth",

  // ==================================================================
  // DEVOPS
  // ==================================================================
  docker: "docker",
  dockercompose: "dockerdockercompose",

  kubernetes: "kubernetes",
  k8s: "kubernetes",

  devops: "devops",

  cicd: "cicd",

  // ==================================================================
  // TOOLS
  // ==================================================================
  git: "git",

  github: "github",
  gitlab: "gitlab",
  bitbucket: "bitbucket",

  vscode: "vscode",
  visualstudiocode: "vscode",

  intellij: "intellij",
  intellijidea: "intellij",

  npm: "npm",
  yarn: "yarn",
  pnpm: "pnpm",

  json: "json",
  xml: "xml",

  postman: "postman",
  insomnia: "insomnia",
  swagger: "swagger",

  figma: "figma",
  adobexd: "adobexd",

  jira: "jira",
  trello: "trello",

  slack: "slack",
  discord: "discord",

  jenkins: "jenkins",
  githubactions: "githubactions",
  circleci: "circleci",

  linux: "linux",
  bash: "bash",
  shell: "bash",

  // ==================================================================
  // TESTING
  // ==================================================================
  jest: "jest",
  mocha: "mocha",
  cypress: "cypress",
  playwright: "playwright",

  unittest: "unittesting",
  unittests: "unittesting",
  unittesting: "unittesting",

  integrationtest: "integrationtesting",
  integrationtests: "integrationtesting",
  integrationtesting: "integrationtesting",

  testdrivendevelopment: "tdd",
  tdd: "tdd",

  // ==================================================================
  // AGILE
  // ==================================================================
  agile: "agile",
  agilemethodology: "agile",

  scrum: "scrum",
  scrummaster: "scrum",

  kanban: "kanban",

  // ==================================================================
  // SOFT SKILLS
  // ==================================================================
  problemsolving: "problemsolving",

  teamcollaboration: "teamcollaboration",
  teamwork: "teamcollaboration",

  selflearning: "selflearning",

  communication: "communication",

  leadership: "leadership",

  mentoring: "mentoring",

  projectmanagement: "projectmanagement",
  timemanagement: "timemanagement",

  creativity: "creativity",
  adaptable: "adaptability",
  adaptability: "adaptability",

};

/**
 * Muuttaa synonyymit AI-promptiin sopivaksi merkkijonoksi.
 * Kertoo LLM:lle mitä nimeämiskäytäntöjä sen tulisi noudattaa.
 */

// Muuttaa synonyymit AI-promptiin sopivaksi merkkijonoksi
export const getAiNamingInstructions = () => {
  const meaningful = Object.entries(SYNONYMS)
    .filter(([raw, canonical]) => raw !== canonical)
  let instructions = "NAMING CONVENTIONS (use these canonical forms):\n";
  for (const [raw, official] of meaningful) {
    instructions += `- Use "${official}" instead of "${raw}"\n`;
  }
  return instructions;
};