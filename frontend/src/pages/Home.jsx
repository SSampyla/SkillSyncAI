import Navbar from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import "../styles/home.css";
import { useState, useEffect } from "react";


/*Lisätty kotisivulle profiilin luonti ja taitovalinnat.

Tiedot siirtyvät portofolio-sivulle, jossa ne ovat vielä muokattavissa
*/


    const navigate = useNavigate();

    const [showForm, setShowForm] = useState(false);

    const [profile, setProfile] = useState({
        name: "",
        title: "",
        email: "",
        phone: "",
        location: "",
        github: "",
        linkedin: "",
        summary: "",
        skills: {
            frontend: [],
            backend: [],
            tools: [],
            other: []
        }
    });

    const availableSkills = {
        frontend: ["React.js", "Vue.js", "Angular", "JavaScript", "TypeScript", "HTML5", "CSS3"],
        backend: ["Node.js", "Express.js", "Python", "Django", "Java", ".NET"],
        tools: ["Git", "GitHub", "Docker", "Postman", "VS Code"],
    };

    const [selectedSkills, setSelectedSkills] = useState({
        frontend: profile.skills?.frontend || [],
        backend: profile.skills?.backend || [],
        tools: profile.skills?.tools || [],
        other: profile.skills?.other || []
    });

    // Synkkaa skills profileen ja localStorageen
    useEffect(() => {

        const updatedProfile = {
            ...profile,
            skills: selectedSkills
        };

        setProfile(updatedProfile);

        localStorage.setItem("profile", JSON.stringify(updatedProfile));

    }, [selectedSkills]);

    function createProfile(e) {

        e.preventDefault();

        const fullProfile = {
            ...profile,
            skills: selectedSkills
        };

        localStorage.setItem("profile", JSON.stringify(fullProfile));

        navigate("/portfolio");
    }

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
            <hr style={{ margin: "0", border: "none", height: "1px", background: "rgba(148, 163, 184, 0.2)" }} />

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
                                className="btn btn-primary"
                                onClick={() => setShowForm(true)}
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

                    <div className="modal-overlay">

                        <div className="modal-card">

                            <button
                                className="modal-close"
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
                                    onChange={(e) =>
                                        setProfile({ ...profile, name: e.target.value })
                                    }
                                />

                                <input
                                    placeholder="Titteli (esim Full Stack Developer)"
                                    onChange={(e) =>
                                        setProfile({ ...profile, title: e.target.value })
                                    }
                                />

                                <input
                                    placeholder="Email"
                                    onChange={(e) =>
                                        setProfile({ ...profile, email: e.target.value })
                                    }
                                />

                                <input
                                    placeholder="Puhelin"
                                    onChange={(e) =>
                                        setProfile({ ...profile, phone: e.target.value })
                                    }
                                />

                                <input
                                    placeholder="Sijainti"
                                    onChange={(e) =>
                                        setProfile({ ...profile, location: e.target.value })
                                    }
                                />

                                <input
                                    placeholder="GitHub username"
                                    onChange={(e) =>
                                        setProfile({ ...profile, github: e.target.value })
                                    }
                                />

                                <input
                                    placeholder="LinkedIn username"
                                    onChange={(e) =>
                                        setProfile({ ...profile, linkedin: e.target.value })
                                    }
                                />

                                <textarea
                                    placeholder="Lyhyt esittely"
                                    onChange={(e) =>
                                        setProfile({ ...profile, summary: e.target.value })
                                    }
                                />

                                <button type="submit" className="btn btn-primary">
                                    Luo Portfolio
                                </button>

                                <h3>Valitse teknologiat</h3>

                                {Object.entries(availableSkills).map(([category, skills]) => (

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

                                            {skills.map(skill => (

                                                <span
                                                    key={skill}
                                                    onClick={() => toggleSkill(category, skill)}
                                                    style={{
                                                        padding: "6px 12px",
                                                        borderRadius: "16px",
                                                        cursor: "pointer",
                                                        background:
                                                            selectedSkills[category]?.includes(skill)
                                                                ? "#4c63ff"
                                                                : "#334155",
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