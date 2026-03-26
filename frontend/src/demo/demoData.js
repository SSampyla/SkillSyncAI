import { createEmptyPortfolio } from "../data/portfolioTemplate";


// demoData.js - Luo demoportfolio ja demo-projektit, joita käytetään demo-tilassa. Näin käyttäjät voivat kokeilla sovellusta ilman omaa dataa.
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

        summary: "Motivoitunut fullstack-kehittäjä, joka rakastaa moderneja web-teknologioita.",

        profileSummary: {
            whyMe: [
                "Nopea oppimaan uusia teknologioita",
                "Hyvä tiimityöskentelijä",
                "Rakentanut useita projekteja Reactilla"
            ],
            lookingFor: [
                "Frontend / Fullstack rooleja",
                "Mahdollisuus kehittyä senioriksi"
            ]
        },

        experience: [
            {
                title: "Frontend Developer",
                company: "TechCorp",
                period: "2023 - 2025",
                description: "Rakensin moderneja React-sovelluksia",
                achievements: [
                    "Paransin suorituskykyä 40%",
                    "Rakensin design systemin"
                ]
            }
        ],

        education: [
            {
                degree: "Tietojenkäsittely",
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
        description: "AI joka yhdistää CV:n työpaikkoihin",
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