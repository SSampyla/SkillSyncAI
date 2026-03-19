import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../data/db.json");

export const createEmptyPortfolio = () => ({
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    github: "",
    linkedin: "",
    summary: "",
    experience: [],
    education: [],
    certifications: [],
    profileSummary: {
        whyMe: [],
        lookingFor: [],
    },
});

/**
 * Tietokannan "skeema"
 * Lisää uudet "taulut" tänne. Logiikka huolehtii alustuksesta ja oletusarvoista.
 */
export const INITIAL_STATE = {
    appliedJobs: [],
    candidateProfile: {
        hardSkillsProficient: [],
        hardSkillsBasics: [],
        softSkillsProficient: [],
        softSkillsBasics: []
    },
    portfolio: createEmptyPortfolio(),
    availableSkills: {
        frontend: [
            "React.js",
            "Vue.js",
            "Angular",
            "JavaScript",
            "TypeScript",
            "HTML5",
            "CSS3",
            "SCSS",
            "Tailwind CSS",
            "Bootstrap",
            "Material-UI",
            "Redux",
            "Zustand",
            "React Query",
            "TanStack Query",
            "Vite",
            "Webpack",
            "Babel",
            "ESLint",
            "Prettier",
            "Responsive Design",
            "PWA",
            "Next.js",
            "Gatsby",
            "Accessibility (a11y)",
            "Web Performance"
        ],
        backend: [
            "Node.js",
            "Express.js",
            "NestJS",
            "Python",
            "Django",
            "Flask",
            "Java",
            "Spring Boot",
            "C#",
            ".NET",
            "PHP",
            "Laravel",
            "Ruby",
            "Rails",
            "Go",
            "REST API",
            "GraphQL",
            "API Design",
            "Microservices",
            "Docker",
            "Kubernetes",
            "MongoDB",
            "PostgreSQL",
            "MySQL",
            "Redis",
            "Firebase",
            "Supabase",
            "JWT",
            "OAuth",
            "Authentication",
            "Authorization"
        ],
        tools: [
            "Git",
            "GitHub",
            "GitLab",
            "Bitbucket",
            "VS Code",
            "IntelliJ IDEA",
            "npm",
            "Yarn",
            "pnpm",
            "JSON",
            "XML",
            "Postman",
            "Insomnia",
            "Swagger",
            "Figma",
            "Adobe XD",
            "Jira",
            "Trello",
            "Slack",
            "Discord",
            "Jenkins",
            "GitHub Actions",
            "CircleCI",
            "Docker Compose",
            "Linux",
            "Bash",
            "Jest",
            "Mocha",
            "Cypress",
            "Playwright"
        ],
        other: [
            "Problem Solving",
            "Team Collaboration",
            "Self-learning",
            "Agile Methodology",
            "Scrum",
            "Kanban",
            "Test-Driven Development",
            "Unit Testing",
            "Integration Testing",
            "CI/CD",
            "Code Review",
            "Mentoring",
            "Project Management",
            "Time Management",
            "Communication",
            "Leadership",
            "Creativity",
            "Adaptability",
            "DevOps",
            "Clean Code",
            "Software Architecture"
        ]
    }
    // portfolioProjects: [], // Esimerkki laajennuksesta
    // settings: { theme: "dark", notifications: true } // Esimerkki toisesta laajennuksesta
};



/**
 * Palauttaa datan, jossa on varmasti kaikki INITIAL_STATE:n avaimet (Migration).
 */
const migrate = (data) => {
    const merged = { ...INITIAL_STATE, ...data };
    // Varmistetaan syvärakenne profiilille, jos se on olemassa mutta vailla kenttiä
    merged.candidateProfile = { ...INITIAL_STATE.candidateProfile, ...data?.candidateProfile };
    return merged;
};

export async function readDB() {
    try {
        await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
        const fileData = await fs.readFile(DB_PATH, "utf-8");
        return migrate(JSON.parse(fileData));
    } catch {
        // Jos tiedostoa ei ole tai se on korruptoitunut, palautetaan alkutila
        await fs.writeFile(DB_PATH, JSON.stringify(INITIAL_STATE, null, 2), "utf-8");
        return INITIAL_STATE;
    }
}

export async function writeDB(data) {
    // Tallennetaan vain skeeman mukaiset avaimet (Data-Oriented filtering)
    const safeData = Object.keys(INITIAL_STATE).reduce((acc, key) => {
        acc[key] = data[key] ?? INITIAL_STATE[key];
        return acc;
    }, {});

    await fs.writeFile(DB_PATH, JSON.stringify(safeData, null, 2), "utf-8");
    return safeData;
}