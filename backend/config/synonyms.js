/**
 * ------------------------------------------------------------------
 * Synonyymisanakirja
 * ------------------------------------------------------------------
 *
 * Tekstille suoritetaan regex (matchCandidateToJob.js)
 *   normalized = skillText
 *     .toLowerCase()
 *     .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
 *     .replace(/#/g, "sharp")
 *     .replace(/\+/g, "p")
 *     .replace(/[\s\-_.]/g, "");
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
  cicd: "cicd",
  "ci/cd": "cicd",
  "sass/scss": "scss",
  continuousintegration: "cicd",
  continuousdelivery: "cicd",
  continuousdeployment: "cicd",

  // ==================================================================
  // FRONTEND CORE
  // ==================================================================
  react: "react",
  reactjs: "react",

  blazor: "blazor",

  mobileui: "mobileui",

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

  gatsbyjs: "gatsby",
  bootstrapcss: "bootstrap",
  twitterbootstrap: "bootstrap",
  zustandjs: "zustand",
  vitejs: "vite",
  webpackjs: "webpack",
  babeljs: "babel",
  microsoftblazor: "blazor",
  mobiledevelopment: "mobileui",
  mobile: "mobileui",

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

  junit: "junit",

  databases: "databases",
  database: "databases",

  windowsserver: "windowsserver",

  powershell: "powershell",

  djangoframework: "django",
  flaskframework: "flask",
  cplusplus: "cpp",
  php8: "php",
  php7: "php",
  junit4: "junit",
  junit5: "junit",
  mariadb: "mysql",
  tsql: "sql",
  plsql: "sql",
  structuredquerylanguage: "sql",
  nonrelational: "nosql",
  rediscache: "redis",
  googlefirebase: "firebase",
  winserver: "windowsserver",
  powershellscript: "powershell",
  apidevelopment: "apidesign",

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
  // TOOLS
  // ==================================================================

  ai: "ai",
  artificialintelligence: "ai",
  machinelearning: "machinelearning",
  ml: "machinelearning",

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

  docker: "docker",
  dockercompose: "dockercompose",

  azure: "azure",
  microsoftazure: "azure",

  powerbi: "powerbi",
  microsoftpowerbi: "powerbi",

  selenium: "selenium",

  jbehave: "jbehave",

  m365: "m365",
  microsoft365: "m365",
  office365: "m365",

  entraid: "entraid",
  azuread: "entraid",
  azureactivedirectory: "entraid",

  fabric: "fabric",
  microsoftfabric: "fabric",

  kubernetes: "kubernetes",
  k8s: "kubernetes",

  devops: "devops",

  openapi: "swagger",
  swaggerui: "swagger",
  xd: "adobexd",
  jirasoftware: "jira",
  atlassianjira: "jira",
  jenkinsci: "jenkins",
  ghactions: "githubactions",
  gitlabci: "gitlab",
  dockercontainer: "docker",
  microsoftplaywright: "playwright",
  cypresse2e: "cypress",
  jestjs: "jest",
  mochajs: "mocha",

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
  kanbanboard: "kanban",

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

  // ==================================================================
  // CLOUD
  // ==================================================================
  amazonwebservices: "aws",
  aws: "aws",

  // ==================================================================
  // DOTNET FIX
  // ==================================================================
  net: "dotnet",
  dotnet: "dotnet",

  // ==================================================================
  // FINNISH SOFT SKILLS
  // ==================================================================
  ryhmatyo: "teamcollaboration",
  tiimityo: "teamcollaboration",
  tiimityoskentely: "teamcollaboration",
  yhteistyokyky: "teamcollaboration",
  criticalthinking: "problemsolving",
  continuouslearning: "selflearning",
  teamleadership: "leadership",
  coaching: "mentoring",
  pm: "projectmanagement",
  peerreview: "codereview",

  // ==================================================================
  // OTHER
  // ==================================================================

  // Kielet
  finnish: "finnish",
  suomi: "finnish",
  suomenkieli: "finnish",
  fi: "finnish",

  english: "english",
  englanti: "english",
  en: "english",

  swedish: "swedish",
  ruotsi: "swedish",
  svenska: "swedish",
  sv: "swedish",

  // Muut puuttuvat
  softwareengineering: "softwaredevelopment",
  testautomation: "testautomation",
  automatedtesting: "testautomation",

  codereview: "codereview",

  softwaredevelopment: "softwaredevelopment",
  swe: "softwaredevelopment",

  finances: "finances",
  finance: "finances",

  gameprogramming: "gameprogramming",
  gameplayprogramming: "gameprogramming",
  graphicsprogramming: "graphicsprogramming",

  systemdesign: "systemdesign",

  performanceoptimization: "performance",

  liveservice: "liveservice",
  multiplayer: "multiplayer",
  gamesprogramming: "gamesprogramming",

  datamodeling: "datamodeling",
  riskmanagement: "riskmanagement",
  documentation: "documentation",
  qualityassurance: "qualityassurance",
  qa: "qualityassurance",

  cloudservices: "cloudservices",
  cloud: "cloudservices",

  versioncontrol: "versioncontrol",

  businessintelligence: "businessintelligence",
  bi: "businessintelligence",

  datavisualization: "datavisualization",

  rag: "rag",
  retrievalaugmentedgeneration: "rag",

  zerotrust: "zerotrust",
  gpuprogramming: "graphicsprogramming",
  liveops: "liveservice",
  gamedev: "gamesprogramming",
  gamedevelopment: "gamesprogramming",
  systemarchitecture: "systemdesign",
  riskassessment: "riskmanagement",
  techwriting: "documentation",
  docs: "documentation",
  sourcecontrol: "versioncontrol",
  scm: "versioncontrol",
  dataviz: "datavisualization",
  ztna: "zerotrust",
  zerotrustsecurity: "zerotrust",

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