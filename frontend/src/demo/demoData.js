import { createEmptyPortfolio } from "../data/portfolioTemplate";

// demoData.js - Demoportfolio demo-tilaa varten
export function createDemoPortfolio() {
    const p = createEmptyPortfolio();

    return {
        ...p,
        name: "Demo Developer",
        title: "Fullstack Developer",
        email: "demo@skillsync.ai",
        phone: "040 123 4567",
        location: "Helsinki",
        linkedin: "demo-dev",
        github: "octocat",

        summary: "Motivoitunut fullstack-kehitt\u00e4j\u00e4, joka rakastaa moderneja web-teknologioita.",

        profileSummary: {
            whyMe: [
                "Nopea oppimaan uusia teknologioita",
                "Hyv\u00e4 tiimity\u00f6skentelij\u00e4",
                "Rakentanut useita projekteja Reactilla"
            ],
            lookingFor: [
                "Frontend / Fullstack rooleja",
                "Mahdollisuus kehitty\u00e4 senioriksi"
            ]
        },

        experience: [
            {
                title: "Frontend Developer",
                company: "TechCorp",
                period: "2023 - 2025",
                description: "Rakensin moderneja React-sovelluksia",
                achievements: [
                    "Paransin suorituskyky\u00e4 40%",
                    "Rakensin design systemin"
                ]
            }
        ],

        education: [
            {
                degree: "Tietojenk\u00e4sittely",
                institution: "Metropolia",
                year: "2024",
                relevant: ["React", "Node.js", "UX Design"]
            }
        ],

        certifications: ["AWS Basics", "Fullstack Open"]
    };
}

export const demoProjects = [
    {
        id: 1,
        title: "AI Job Matcher",
        description: "AI joka yhdist\u00e4\u00e4 CV:n ty\u00f6paikkoihin",
        technologies: ["React", "Node.js", "OpenAI"],
        impact: "Paransi hakuprosessia 60%",
        status: "Completed"
    }
];

export const demoSkills = {
    frontend: ["React", "JavaScript", "HTML", "CSS"],
    backend: ["Node.js", "Express"],
    tools: ["Git", "Docker"],
    other: ["Problem solving"]
};