import Navbar from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import "../styles/home.css";
import { useState } from "react";
import { useAvailableSkills } from "../hooks/useDatabase";
import { usePortfolio } from "../hooks/useDatabase";
import { createEmptyPortfolio } from "../data/portfolioTemplate";

/*Lisätty kotisivulle profiilin luonti ja taitovalinnat.

Tiedot siirtyvät portofolio-sivulle, jossa ne ovat vielä muokattavissa
*/

// nyt backendin database.json:ista haetaan "availableSkills" ja "portfolio" dataa. Näitä käsitellään custom hookeilla, jotka on määritelty frontend/src/hooks/useDatabase.js:ssä. Näin varmistetaan, että data on synkronoitu backendin kanssa eikä käytetä kovakoodattua dataa frontendissä.

// Käyttäjälle näytetään lomake, jossa hän voi syöttää perustiedot itsestään, valita taitonsa eri kategorioista, ja lisätä yhden kokemuksen ja koulutuksen. Lomakkeella on myös kentät sertifikaateille ja profiilin yhteenvetotekstille. Kun käyttäjä lähettää lomakkeen, tiedot tallennetaan backendin database.json:iin ja käyttäjä ohjataan portfolio-sivulle, jossa hän näkee luomansa profiilin.

// Lomakkeella on myös "resetForm" funktio, joka nollaa kaikki lomakkeen tilat ja valinnat. Tämä varmistaa, että joka kerta kun käyttäjä avaa profiilin luontilomakkeen, hän näkee tyhjän lomakkeen eikä vanhat tiedot jää näkyviin.


function Home() {

    const { availableSkills } = useAvailableSkills();
    const { updatePortfolio } = usePortfolio();

    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const navigate = useNavigate();

    const [profile, setProfile] = useState(() => createEmptyPortfolio());
    const [selectedSkills, setSelectedSkills] = useState(() =>
        createEmptyPortfolio().skills
    );

    const [experienceDraft, setExperienceDraft] = useState({
        title: "",
        company: "",
        period: "",
        description: "",
        achievements: ""
    });

    const [educationDraft, setEducationDraft] = useState({
        degree: "",
        institution: "",
        year: "",
        relevant: ""
    });

    const [certificationsText, setCertificationsText] = useState("");
    const [whyMeText, setWhyMeText] = useState("");
    const [lookingForText, setLookingForText] = useState("");

    const splitLines = (value) =>
        value
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);

    const hasAnyValue = (values) => values.some((value) => value.trim() !== "");

    // Avaa profiilin luontilomake


    function openCreateForm() {
        setShowForm(true);
    }

    // Nollaa lomakkeen tilat ja valinnat, jotta käyttäjälle näytetään tyhjä lomake joka kerta, kun hän avaa profiilin luontilomakkeen. Tämä funktio voidaan kutsua aina, kun lomake avataan, varmistaen että vanhat tiedot eivät jää näkyviin.
    function resetForm() {
        const emptyProfile = createEmptyPortfolio();
        setProfile(emptyProfile);
        setSelectedSkills(emptyProfile.skills);
        setExperienceDraft({
            title: "",
            company: "",
            period: "",
            description: "",
            achievements: ""
        });
        setEducationDraft({
            degree: "",
            institution: "",
            year: "",
            relevant: ""
        });
        setCertificationsText("");
        setWhyMeText("");
        setLookingForText("");
    }

    // Luo profiili ja tallenna se backendin database.json:iin. Tiedot haetaan lomakkeelta, ja jos kokemus tai koulutus on osittain täytetty, ne sisällytetään profiiliin. Taitovalinnat, sertifikaatit ja profiilin yhteenveto käsitellään myös lomakkeelta ja tallennetaan profiiliin. Lopuksi käyttäjä ohjataan portfolio-sivulle.



    async function createProfile(e) {
        e.preventDefault();

        if (loading) return;

        setLoading(true);

        try {

            const includeExperience = hasAnyValue([
                experienceDraft.title,
                experienceDraft.company,
                experienceDraft.period,
                experienceDraft.description,
                experienceDraft.achievements
            ]);

            const includeEducation = hasAnyValue([
                educationDraft.degree,
                educationDraft.institution,
                educationDraft.year,
                educationDraft.relevant
            ]);

            const fullProfile = {
                ...profile,
                skills: selectedSkills,
                experience: includeExperience
                    ? [{
                        title: experienceDraft.title,
                        company: experienceDraft.company,
                        period: experienceDraft.period,
                        description: experienceDraft.description,
                        achievements: splitLines(experienceDraft.achievements)
                    }]
                    : [],
                education: includeEducation
                    ? [{
                        degree: educationDraft.degree,
                        institution: educationDraft.institution,
                        year: educationDraft.year,
                        relevant: splitLines(educationDraft.relevant)
                    }]
                    : [],
                certifications: splitLines(certificationsText),
                profileSummary: {
                    whyMe: splitLines(whyMeText),
                    lookingFor: splitLines(lookingForText)
                }
            };

            await updatePortfolio(fullProfile);

            setShowForm(false);
            navigate("/portfolio");

        } catch (err) {
            console.error(err);
            alert("Tallennus epäonnistui");
        } finally {
            setLoading(false);
        }
    }
   
    // Lisää tai poista taito valitusta kategoriasta. Jos taito on jo valittuna, se poistetaan, muuten se lisätään. Päivitetty taitolista tallennetaan tilaan.
    function toggleSkill(category, skill) {

        const updated = { ...selectedSkills };

        if (updated[category].includes(skill)) {
            updated[category] = updated[category].filter(s => s !== skill);
        } else {
            updated[category] = [...updated[category], skill];
        }

        setSelectedSkills(updated);
    }

    return (
        <>
            <Navbar />
            <hr className="divider" />

            <div className="home-container">

                {/* Hero Section */}
                <section className="hero-section">
                    <div className="hero-content">

                        <div className="hero-badge">
                            <span className="badge-icon">AI</span>
                            <span>Tekoäly-pohjainen osaamisen arviointi</span>
                        </div>

                        <h1 className="hero-title">
                            <span className="gradient-text">SkillSync AI</span>
                        </h1>

                        <p className="hero-subtitle">
                            Kuroa umpeen kuilu todellisen osaamisesi ja työmarkkinoiden vaatimusten välillä
                        </p>

                        <p className="hero-description">
                            Tekoäly tulkkina opiskelijan osaamisen ja työnantajan tarpeiden välillä –
                            löydä täydellinen match ja vie urasi seuraavalle tasolle.
                        </p>

                        <div className="hero-buttons">

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={openCreateForm}
                            >
                                Luo Portfolio
                            </button>

                            <Link to="/avoimet-tyopaikat" className="btn btn-secondary">
                                Selaa Työpaikkoja
                            </Link>

                        </div>

                    </div>
                </section>

                {/* MODAL PROFILE FORM */}

                {showForm && (

                    <div className="home-modal-overlay">

                        <div className="home-modal-card">

                            <button
                                type="button"
                                className="home-modal-close"
                                onClick={() => setShowForm(false)}
                            >
                                ✕
                            </button>

                            <h2>Luo Profiilisi</h2>

                            <form
                                onSubmit={createProfile}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px"
                                }}
                            >

                                <input
                                    placeholder="Nimi"
                                    value={profile.name}
                                    onChange={(e) =>
                                        setProfile((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                />

                                <input
                                    placeholder="Titteli (esim Full Stack Developer)"
                                    value={profile.title}
                                    onChange={(e) =>
                                        setProfile((prev) => ({ ...prev, title: e.target.value }))
                                    }
                                />

                                <input
                                    placeholder="Email"
                                    value={profile.email}
                                    onChange={(e) =>
                                        setProfile((prev) => ({ ...prev, email: e.target.value }))
                                    }
                                />

                                <input
                                    placeholder="Puhelin"
                                    value={profile.phone}
                                    onChange={(e) =>
                                        setProfile((prev) => ({ ...prev, phone: e.target.value }))
                                    }
                                />

                                <input
                                    placeholder="Sijainti"
                                    value={profile.location}
                                    onChange={(e) =>
                                        setProfile((prev) => ({ ...prev, location: e.target.value }))
                                    }
                                />

                                <input
                                    placeholder="GitHub username"
                                    value={profile.github}
                                    onChange={(e) =>
                                        setProfile((prev) => ({ ...prev, github: e.target.value }))
                                    }
                                />

                                <input
                                    placeholder="LinkedIn username"
                                    value={profile.linkedin}
                                    onChange={(e) =>
                                        setProfile((prev) => ({ ...prev, linkedin: e.target.value }))
                                    }
                                />

                                <textarea
                                    placeholder="Lyhyt esittely"
                                    value={profile.summary}
                                    onChange={(e) =>
                                        setProfile((prev) => ({ ...prev, summary: e.target.value }))
                                    }
                                />

                                <h3>Valitse teknologiat</h3>

                                {Object.entries(availableSkills || {}).map(([category, skills]) => (

                                    <div key={category} style={{ marginBottom: "15px" }}>

                                        <strong style={{ textTransform: "capitalize" }}>
                                            {category}
                                        </strong>

                                        <div style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "8px",
                                            marginTop: "8px"
                                        }}>

                                            {Array.isArray(skills) && skills.map(skill => (

                                                <span
                                                    key={skill}
                                                    onClick={() => toggleSkill(category, skill)}
                                                    style={{
                                                        padding: "6px 12px",
                                                        borderRadius: "16px",
                                                        cursor: "pointer",
                                                        background:
                                                            selectedSkills[category]?.includes(skill)
                                                                ? "var(--color-primary)"
                                                                : "var(--surface-muted)",
                                                        color: "white",
                                                        fontSize: "13px"
                                                    }}
                                                >
                                                    {skill}
                                                </span>

                                            ))}

                                        </div>

                                    </div>

                                ))}

                                <h3>Kokemus (ensimmainen)</h3>
                                <input
                                    placeholder="Rooli / projekti"
                                    value={experienceDraft.title}
                                    onChange={(e) =>
                                        setExperienceDraft({ ...experienceDraft, title: e.target.value })
                                    }
                                />
                                <input
                                    placeholder="Organisaatio / projekti"
                                    value={experienceDraft.company}
                                    onChange={(e) =>
                                        setExperienceDraft({ ...experienceDraft, company: e.target.value })
                                    }
                                />
                                <input
                                    placeholder="Ajanjakso"
                                    value={experienceDraft.period}
                                    onChange={(e) =>
                                        setExperienceDraft({ ...experienceDraft, period: e.target.value })
                                    }
                                />
                                <textarea
                                    placeholder="Kuvaus"
                                    value={experienceDraft.description}
                                    onChange={(e) =>
                                        setExperienceDraft({ ...experienceDraft, description: e.target.value })
                                    }
                                />
                                <textarea
                                    placeholder="Saavutukset, yksi per rivi"
                                    value={experienceDraft.achievements}
                                    onChange={(e) =>
                                        setExperienceDraft({ ...experienceDraft, achievements: e.target.value })
                                    }
                                />

                                <h3>Koulutus (ensimmainen)</h3>
                                <input
                                    placeholder="Tutkinto"
                                    value={educationDraft.degree}
                                    onChange={(e) =>
                                        setEducationDraft({ ...educationDraft, degree: e.target.value })
                                    }
                                />
                                <input
                                    placeholder="Oppilaitos"
                                    value={educationDraft.institution}
                                    onChange={(e) =>
                                        setEducationDraft({ ...educationDraft, institution: e.target.value })
                                    }
                                />
                                <input
                                    placeholder="Vuosi / ajanjakso"
                                    value={educationDraft.year}
                                    onChange={(e) =>
                                        setEducationDraft({ ...educationDraft, year: e.target.value })
                                    }
                                />
                                <textarea
                                    placeholder="Relevantit kurssit, yksi per rivi"
                                    value={educationDraft.relevant}
                                    onChange={(e) =>
                                        setEducationDraft({ ...educationDraft, relevant: e.target.value })
                                    }
                                />

                                <h3>Sertifikaatit</h3>
                                <textarea
                                    placeholder="Yksi sertifikaatti per rivi"
                                    value={certificationsText}
                                    onChange={(e) => setCertificationsText(e.target.value)}
                                />

                                <h3>Profiilin yhteenveto</h3>
                                <textarea
                                    placeholder="Miksi minut? yksi vahvuus per rivi"
                                    value={whyMeText}
                                    onChange={(e) => setWhyMeText(e.target.value)}
                                />
                                <textarea
                                    placeholder="Mita etsin? yksi kohta per rivi"
                                    value={lookingForText}
                                    onChange={(e) => setLookingForText(e.target.value)}
                                />

                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? "Luodaan..." : "Luo Portfolio"}
                                </button>

                            </form>

                        </div>

                    </div>

                )}

                {/* Features Section */}
                <section className="features-section">
                    <h2 className="section-title">Miten SkillSync AI toimii?</h2>

                    <div className="features-grid">
                        {/* jätin tämän koskematta */}
                    </div>

                </section>

            </div>
        </>
    );
}

export default Home;
