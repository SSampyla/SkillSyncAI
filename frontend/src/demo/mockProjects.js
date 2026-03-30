export const MOCK_PROJECTS = [
    {
        id: 1,
        title: "Job Matching Platform",
        category: "Full Stack",
        description:
            "\u00c4lykk\u00e4\u00e4t rekrytointi- ja hakija-sovellus, joka k\u00e4ytt\u00e4\u00e4 teko\u00e4ly\u00e4 kandidaatille sopivien ty\u00f6paikkojen l\u00f6yt\u00e4miseen ja osaamisen analysointiin.",
        longDescription:
            "T\u00e4m\u00e4 sovellus yhdist\u00e4\u00e4 Job Board -alustan, joka n\u00e4ytt\u00e4\u00e4 avoimia ty\u00f6paikkailmoituksia ja kehittyneen matching-algoritmin, joka analysoi kandidaatin osaamisen ja vertaa sit\u00e4 ty\u00f6paikan vaatimuksiin. Sovellus k\u00e4ytt\u00e4\u00e4 LLM:i\u00e4 (Large Language Models) ty\u00f6taitojen automaattiseen ekstrahointiin ja portfolio-analyysiin.",
        technologies: ["React", "Node.js", "Express", "MongoDB", "LLM", "AI"],
        images: [
            "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop",
        ],
        video: "",
        liveDemo: "",
        github: "https://github.com/yourname/job-matching",
        status: "In Progress",
        impact: "Auttaa tekem\u00e4\u00e4n recruitment-prosessista tehokkaamman ja dataperusteisemman.",
    },
    {
        id: 2,
        title: "Responsiivinen Portfolio Website",
        category: "Frontend",
        description:
            "Moderni, k\u00e4ytt\u00e4j\u00e4yst\u00e4v\u00e4llinen portfoliosivusto, joka n\u00e4ytt\u00e4\u00e4 projekteja, osaamista ja kokemusta.",
        longDescription:
            "T\u00e4ysin responsive portfoliosivusto, jonka rakentaminen tehtiin React + Vite -yhdistelm\u00e4ll\u00e4. Sivustolla on dynaaminen sis\u00e4ll\u00f6n hallinta, kaunis visuaalinen muotoilu ja saumaton k\u00e4ytt\u00e4j\u00e4kokemus eri laitteilla.",
        technologies: ["React", "Vite", "CSS3", "JavaScript"],
        images: [
            "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1559163499-c4c4f2d30e6f?w=800&h=600&fit=crop",
        ],
        video: "",
        liveDemo: "https://portfolio-demo.example.com",
        github: "https://github.com/yourname/portfolio",
        status: "Completed",
        impact: "Muuttaa portfolion esitt\u00e4misen visuaalisemmaksi ja interaktiivisemmaksi.",
    },
    {
        id: 3,
        title: "E-Commerce Dashboard",
        category: "Full Stack",
        description:
            "Kattava hallintapaneeli, joka hallinnoi tuotteita, tilauksia ja k\u00e4ytt\u00e4ji\u00e4 reaaliajassa.",
        longDescription:
            "Tehty Node.js/Express backendilla ja React frontendilla, t\u00e4m\u00e4 dashboard tarjoaa yritysten kaikki tarvitsemat analyysi- ja hallintaty\u00f6kalut. Reaaliaikainen p\u00e4ivitys Socket.io:n avulla, kaunis data-visualisointi chartien avulla.",
        technologies: ["React", "Node.js", "MongoDB", "Socket.io", "Chart.js"],
        images: [
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
        ],
        video: "",
        liveDemo: "https://ecommerce-dashboard.example.com",
        github: "https://github.com/yourname/ecommerce-dashboard",
        status: "Completed",
        impact: "Parantaa myynnin hallintaa ja asiakastyytyv\u00e4isyytt\u00e4 merkitt\u00e4v\u00e4sti.",
    },
    {
        id: 4,
        title: "Mobile App UI/UX",
        category: "Design",
        description:
            "Muotoilusta korostuva mobiilisovelluksen k\u00e4ytt\u00f6liittym\u00e4, joka yhdist\u00e4\u00e4 kauneuden ja funktionaalisuuden.",
        longDescription:
            "T\u00e4ss\u00e4 projektissa oli keskeinen rooli muotoilulla. Luotiin houkutteleva ja intuitiivinen k\u00e4ytt\u00f6liittym\u00e4, joka tekee sovelluksen k\u00e4yt\u00f6st\u00e4 miellytt\u00e4v\u00e4\u00e4 ja tehokasta. Noudatetaan Material Design -periaatteita ja modernia v\u00e4ripaletti\u00e4.",
        technologies: ["Figma", "UI/UX Design", "Prototyping"],
        images: [
            "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop",
        ],
        video: "",
        liveDemo: "https://www.figma.com/file/example",
        github: "",
        status: "Completed",
        impact: "K\u00e4ytt\u00e4j\u00e4t raportoivat 40% paremman k\u00e4ytett\u00e4vyyden skoorin.",
    },
    {
        id: 5,
        title: "Weather Analytics App",
        category: "Frontend",
        description:
            "Reaaliaikainen s\u00e4\u00e4data-sovellus, joka n\u00e4ytt\u00e4\u00e4 kauniisti visualisoituja s\u00e4\u00e4tietoja.",
        longDescription:
            "K\u00e4ytt\u00e4\u00e4 avoimen s\u00e4\u00e4-API:n tietoja n\u00e4ytt\u00e4\u00e4kseen reaaliaikaisen s\u00e4\u00e4informaation. Sovellus pyyt\u00e4\u00e4 k\u00e4ytt\u00e4j\u00e4lt\u00e4 sijaintia ja n\u00e4ytt\u00e4\u00e4 seitsem\u00e4n p\u00e4iv\u00e4n ennusteet kauniissa visualisoinnissa.",
        technologies: ["React", "OpenWeather API", "Chart.js", "CSS3"],
        images: [
            "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&h=600&fit=crop",
        ],
        video: "",
        liveDemo: "https://weather-app.example.com",
        github: "https://github.com/yourname/weather-app",
        status: "Completed",
        impact: "N\u00e4ytt\u00e4\u00e4 s\u00e4\u00e4n intuitiivisella tavalla, joka tekee datan ymm\u00e4rt\u00e4misest\u00e4 helppoa.",
    },
];