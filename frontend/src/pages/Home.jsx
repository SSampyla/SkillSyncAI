import Navbar from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import "../styles/home.css";
import { useState } from "react";
import { useAvailableSkills, usePortfolio, clearCandidateSkills  } from "../hooks/useDatabase";
import { createEmptyPortfolio } from "../data/portfolioTemplate";
import { isDemoMode } from "../demo/useDemoMode";


/*Lisätty kotisivulle profiilin luonti ja taitovalinnat.

Tiedot siirtyvät portofolio-sivulle, jossa ne ovat vielä muokattavissa
*/

// nyt backendin database.json:ista haetaan "availableSkills" ja "portfolio" dataa. Näitä käsitellään custom hookeilla, jotka on määritelty frontend/src/hooks/useDatabase.js:ssä. Näin varmistetaan, että data on synkronoitu backendin kanssa eikä käytetä kovakoodattua dataa frontendissä.

// Käyttäjälle näytetään lomake, jossa hän voi syöttää perustiedot itsestään, valita taitonsa eri kategorioista, ja lisätä yhden kokemuksen ja koulutuksen. Lomakkeella on myös kentät sertifikaateille ja profiilin yhteenvetotekstille. Kun käyttäjä lähettää lomakkeen, tiedot tallennetaan backendin database.json:iin ja käyttäjä ohjataan portfolio-sivulle, jossa hän näkee luomansa profiilin.

// Lomakkeella on myös "resetForm" funktio, joka nollaa kaikki lomakkeen tilat ja valinnat. Tämä varmistaa, että joka kerta kun käyttäjä avaa profiilin luontilomakkeen, hän näkee tyhjän lomakkeen eikä vanhat tiedot jää näkyviin.


function Home() {

    const { availableSkills } = useAvailableSkills();
    const { updatePortfolio } = usePortfolio();

    const [errors, setErrors] = useState({});

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

  

    // Luo profiili ja tallenna se backendin database.json:iin. Tiedot haetaan lomakkeelta, ja jos kokemus tai koulutus on osittain täytetty, ne sisällytetään profiiliin. Taitovalinnat, sertifikaatit ja profiilin yhteenveto käsitellään myös lomakkeelta ja tallennetaan profiiliin. Lopuksi käyttäjä ohjataan portfolio-sivulle.

    function validateForm() {
        const newErrors = {};

        // NAME
        if (!profile.name.trim()) {
            newErrors.name = "Nimi on pakollinen";
        } else {
            const nameError = validateName(profile.name);
            if (nameError) {
                newErrors.name = nameError;
            }
        }

        // EMAIL
        if (!profile.email.trim()) {
            newErrors.email = "Sähköposti on pakollinen";
        } else if (!profile.email.includes("@")) {
            newErrors.email = "Virheellinen sähköposti";
        }

        // TITLE
        if (!profile.title.trim()) {
            newErrors.title = "Titteli on pakollinen";
        }

        // LOCATION
        if (!profile.location.trim()) {
            newErrors.location = "Sijainti on pakollinen";
        }

        // PHONE
        if (!profile.phone.trim()) {
            newErrors.phone = "Puhelinnumero on pakollinen";
        } else {
            const phoneResult = validatePhone(profile.phone);

            if (!phoneResult.valid) {
                newErrors.phone = phoneResult.message;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }
    function validateName(name) {
        const trimmed = name.trim();

        if (/\d/.test(trimmed)) {
            return "Nimi ei voi sisältää numeroita";
        }

        if (!/^[a-zA-ZåäöÅÄÖ\s-]+$/.test(trimmed)) {
            return "Nimi sisältää virheellisiä merkkejä";
        }

        const parts = trimmed.split(/\s+/);

        if (parts.length < 2) {
            return "Anna etu- ja sukunimi";
        }

        // varmistetaan että molemmat vähintään 2 kirjainta
        if (parts.some(p => p.length < 2)) {
            return "Nimen osien tulee olla vähintään 2 merkkiä";
        }

        return null;
    }

    function validatePhone(phone) {
        const cleaned = phone.replace(/[^\d+]/g, "");

        let normalized = cleaned;

        if (cleaned.startsWith("0")) {
            normalized = "+358" + cleaned.substring(1);
        }

        if (cleaned.startsWith("358")) {
            normalized = "+" + cleaned;
        }

        const phoneRegex = /^\+358\d{9}$/;

        if (!phoneRegex.test(normalized)) {
            return {
                valid: false,
                message: "Anna numero muodossa 0401234567 tai +358401234567"
            };
        }

        return { valid: true, value: normalized };
    }



    async function createProfile(e) {
        e.preventDefault();

        const isValid = validateForm();

        if (!isValid) {
            setTimeout(() => {
                const firstError = document.querySelector(".input-error");

                if (firstError) {
                    firstError.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                    firstError.focus();
                }
            }, 0);

            return;
        }

        if (loading) return;

        setLoading(true);

        try {
            const phoneResult = validatePhone(profile.phone);

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
                phone: phoneResult.value, // 🔥 normalisoitu numero
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
            await clearCandidateSkills();

            setShowForm(false);
            navigate("/portfolio", { state: { pendingSkills: selectedSkills } });

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

            <div className="home-container page">

                {/* Hero Section */}
                <section className="hero-section">
                    <div className="hero-content">

                        <div className="hero-badge">
                            <span className="badge-icon"></span>
                            <span>Tekoälypohjainen osaamisen arviointi</span>
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

                            {!isDemoMode() && (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={openCreateForm}
                                >
                                    Luo Portfolio
                                </button>
                            )}

                            <Link to="/avoimet-tyopaikat" className="btn btn-secondary">
                                Selaa Työpaikkoja
                            </Link>

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    localStorage.setItem("demoMode", "true");
                                    navigate("/portfolio");
                                }}
                                style={{
                                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                                    border: "none"
                                }}
                            >
                                 Kokeile demoa
                            </button>

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
                                    className={errors.name ? "input-error" : ""}
                                    placeholder="Nimi"
                                    value={profile.name}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setProfile(prev => ({ ...prev, name: value }));
                                        setErrors(prev => ({ ...prev, name: undefined }));
                                    }}
                                />
                                {errors.name && <span className="error-text">{errors.name}</span>}

                                <input
                                    className={errors.title ? "input-error" : ""}
                                    placeholder="Titteli (esim Full Stack Developer)"
                                    value={profile.title}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setProfile(prev => ({ ...prev, title: value }));
                                        setErrors(prev => ({ ...prev, title: undefined }));
                                    }}
                                />
                                {errors.title && <span className="error-text">{errors.title}</span>}

                                <input
                                    className={errors.email ? "input-error" : ""}
                                    placeholder="Email"
                                    value={profile.email}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setProfile(prev => ({ ...prev, email: value }));
                                        setErrors(prev => ({ ...prev, email: undefined }));
                                    }}
                                />
                                {errors.email && <span className="error-text">{errors.email}</span>}

                                <input
                                    className={errors.phone ? "input-error" : ""}
                                    placeholder="Puhelin"
                                    value={profile.phone}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setProfile(prev => ({ ...prev, phone: value }));
                                        setErrors(prev => ({ ...prev, phone: undefined }));
                                    }}
                                />
                                {errors.phone && <span className="error-text">{errors.phone}</span>}

                                <input
                                    className={errors.location ? "input-error" : ""}
                                    placeholder="Sijainti"
                                    value={profile.location}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setProfile(prev => ({ ...prev, location: value }));
                                        setErrors(prev => ({ ...prev, location: undefined }));
                                    }}
                                />
                                {errors.location && <span className="error-text">{errors.location}</span>}

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

                                {Object.entries(availableSkills || {})
                                    .filter(([, skills]) => Array.isArray(skills))
                                    .map(([category, skills]) => (

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

                                <h3>Lisää työkokemus</h3>
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

                                <h3>Lisää yksi tutkinto</h3>
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

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
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

                        <div className="feature-card">
                            <div className="feature-icon">🤖</div>
                            <h3>Analysoi osaamisesi</h3>
                            <p>
                                Tekoäly tunnistaa vahvuutesi Github-profiilisi, työhistoriasi, koulutuksesi sekä sertifikaattiesi perusteella.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🎯</div>
                            <h3>It's a match!</h3>
                            <p>
                                Näe kuinka hyvin osaamisesi vastaa avoimia työpaikkoja ja löydä sinulle sopivin duuni!
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📈</div>
                            <h3>Ole kehityksen aallonharjalla</h3>
                            <p>
                                Saat suosituksia mitä taitoja kehittää, jotta parannat työllistymismahdollisuuksiasi.
                            </p>
                        </div>
                    </div>
                </section>
                </div>

        </>
    );
}

export default Home;
