import Navbar from "../components/Navbar";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
    useAvailableSkills,
    useCandidateSkills,
    usePortfolio,
    useSynchronizeCandidateSkills, 
    syncSkillsOnce
} from "../hooks/useDatabase";
import "../styles/portfolio.css";

import {
    createEmptyPortfolio,
    createEmptyExperience,
    createEmptyEducation
} from "../data/portfolioTemplate";
import GitHubSection from "../components/GitHubSection";
import Toast from "../components/Toast";



//hookit ja funktiot, jotka hakevat ja päivittävät portfolio-dataa backendistä, sekä synkronoivat taitoja. Tiedot tallennetaan paikalliseen tilaan, joka peilaa backendissä olevaa dataa. Käyttäjä voi muuttaa tietoja, ja muutokset lähetetään backendille debouncattuna, jotta ei tarvitse tallentaa joka ikistä näppäinpainallusta.

//usedatabasesta haetaan käyttäjään liittyviä tietoja: saatavilla olevat taidot, käyttäjän valitsemat taidot, portfolio-data ja funktio portfolion päivittämiseen. Lisäksi on hook synkronoimaan taitoja backendin kanssa, joka ottaa selectedSkills-tilan ja syncStatus-tilan, jota voidaan käyttää näyttämään synkronoinnin tilaa UI:ssa.

// Portfolio-sivu, jossa käyttäjä näkee ja muokkaa omaa profiiliaan. Tiedot haetaan backendistä ja tallennetaan sinne.
export default function Portfolio() {

    const showToast = (message, type = "info") => {
        setToast({ message, type });

        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    const [toast, setToast] = useState(null);

    const [activeSection, setActiveSection] = useState("profile");
    const [isEditing, setIsEditing] = useState(false);
 
    const isLoadingFromDB = useRef(false);
    const isProfileFromDB = useRef(false); 

    const { availableSkills } = useAvailableSkills();

    const location = useLocation();

    const {
        selectedSkills,
        setSelectedSkills,
        refetch: refetchSkills
    } = useCandidateSkills(availableSkills, isLoadingFromDB);

    // Portfolio data ja päivitysfunktio backendistä

    const {
        portfolio,
        updatePortfolio,
        loading: portfolioLoading
    } = usePortfolio();

    // Paikallinen tila, joka peilaa backendistä haettua portfolioa

    const [profile, setProfile] = useState(createEmptyPortfolio());

    useEffect(() => {
        if (portfolio) {
            isProfileFromDB.current = true;
            setProfile(prev => ({
                ...prev,
                ...portfolio
            }));
        }
    }, [portfolio]);

    const DEBOUNCE_MS = 250;

    useEffect(() => {
        if (isProfileFromDB.current) {      
            isProfileFromDB.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            updatePortfolio(profile).catch(() => {
                console.error("Tallennus epäonnistui");
            });
        }, DEBOUNCE_MS);

        return () => clearTimeout(timeout);
    }, [profile]);

    useEffect(() => {
        const pendingSkills = location.state?.pendingSkills;
        if (!pendingSkills) return;

        setSelectedSkills(pendingSkills); 
        window.history.replaceState({}, "");
    }, []);

    // Synkronointitila, joka kertoo onko taitojen synkronointi käynnissä, onnistui vai epäonnistui. Tämä tila voidaan näyttää UI:ssa käyttäjälle.

    const [syncStatus, setSyncStatus] = useState("idle");

    useSynchronizeCandidateSkills(
        selectedSkills,
        setSyncStatus,
        isLoadingFromDB
    );

    const [detectedSkills, setDetectedSkills] = useState(null);
    const [showSkillModal, setShowSkillModal] = useState(false); 

       
    // Funktio, joka mapataan GitHubista löydetyt teknologiat sovelluksen taitoluokkiin. Jos teknologia ei löydy, se laitetaan "other"-kategoriaan.
    

            const mapGithubTechToSkills = (techList) => {

                const mapped = {
                    frontend: [],
                    backend: [],
                    tools: [],
                    other: []
                };

                techList.forEach((tech) => {

                    const normalized = tech.toLowerCase();

                    let foundCategory = null;

                    for (const [category, skills] of Object.entries(availableSkills)) {
                        if (!Array.isArray(skills)) continue;
                        const match = skills.find(
                            skill => skill.toLowerCase() === normalized
                        );

                        if (match) {
                            mapped[category].push(match);
                            foundCategory = category;
                            break;
                        }

                    }

                    if (!foundCategory) {
                        mapped.other.push(tech);
                    }

                });

                return mapped;
    };

    // GitHub-analyysifunktio, joka hakee käyttäjän repositoriot ja niissä käytetyt kielet, ja mapataan ne taitoihin. Tässä tuli jokin häikkä että ei hae teknologioita

    const handleGithubAnalyze = async () => {

        if (!profile.github) {
            showToast("GitHub username puuttuu", "error");
            return;
        }

        try {

            const reposRes = await fetch(
                `https://api.github.com/users/${profile.github}/repos`
            );

            const repos = await reposRes.json();

            const techSet = new Set();

            for (const repo of repos.slice(0, 5)) {

                const langRes = await fetch(
                    `https://api.github.com/repos/${profile.github}/${repo.name}/languages`
                );

                const languages = await langRes.json();

                Object.keys(languages).forEach(lang => techSet.add(lang));
            }

            const detected = Array.from(techSet);
            const mappedSkills = mapGithubTechToSkills(detected);

            setDetectedSkills(mappedSkills);
            setShowSkillModal(true);

        } catch (err) {
            console.error(err);
            showToast("GitHub-analyysi epäonnistui", "error");
        }
    };

    const handleConfirmSkills = () => {

        if (!detectedSkills) return;

                setSelectedSkills((prev) => ({
                    frontend: [...new Set([...prev.frontend, ...detectedSkills.frontend])],
                    backend: [...new Set([...prev.backend, ...detectedSkills.backend])],
                    tools: [...new Set([...prev.tools, ...detectedSkills.tools])],
                    other: [...new Set([...prev.other, ...detectedSkills.other])]
                }));

        showToast("Taidot lisätty profiiliin", "success");

                setShowSkillModal(false);
    };

    const [githubProjects, setGithubProjects] = useState([]);

    const updateArrayItem = (key, index, field, value) => {
        const updated = [...(profile[key] || [])];
        updated[index][field] = value;

        setProfile({
            ...profile,
            [key]: updated
        });
    };

    const handleFetchRepos = async () => {

        if (!profile.github) {
            showToast("GitHub username puuttuu", "error");
            return;
        }

        try {
            const res = await fetch(
                `https://api.github.com/users/${profile.github}/repos`
            );

            const repos = await res.json();

            const projects = repos.slice(0, 6).map(repo => ({
                name: repo.name,
                description: repo.description,
                url: repo.html_url,
                stars: repo.stargazers_count
            }));

            setGithubProjects(projects);

            showToast("Projektit haettu GitHubista", "success");
        } catch (err) {
            console.error(err);
            showToast("Repojen haku epäonnistui", "error");
        }
    };

    const updateNestedArrayItem = (key, index, field, subIndex, value) => {
        const updated = [...(profile[key] || [])];

        if (!updated[index][field]) {
            updated[index][field] = [];
        }

        updated[index][field][subIndex] = value;

        setProfile({
            ...profile,
            [key]: updated
        });
    };
 




    
    
    const parseLines = (value) =>
      value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const joinLines = (items) => (Array.isArray(items) ? items.join("\n") : "");

    return (
        <>
  
          <Navbar />
          {portfolioLoading && (
              <div style={{ padding: "10px", color: "var(--text-secondary)", fontSize: "14px" }}>
                  Ladataan profiilia...
              </div>
          )}
          {syncStatus === "syncing" && isEditing && (
              <div style={{ padding: "10px", color: "var(--text-secondary)", fontSize: "14px" }}>
                  Synkronoidaan taitoja taustalla...
              </div>
          )}
          {syncStatus === "pending" && isEditing && (
              <div style={{ padding: "10px", color: "var(--text-secondary)", fontSize: "14px" }}>
                  . . .
              </div>
          )}
          {syncStatus === "saved" && isEditing && (
              <div style={{ padding: "10px", color: "var(--color-success)", fontSize: "14px" }}>
                  Ok
              </div>
          )}
          {syncStatus === "error" && isEditing && (
              <div style={{ padding: "10px", color: "var(--color-error, #dc3545)", fontSize: "14px" }}>
                  Virhe synkronoinnissa
              </div>
          )}

      <hr className="divider" />

      <div className="portfolio-page">
      <div className="portfolio-container">
        {/* Header Section */}
                    <section
                        style={{
                            marginBottom: "50px",
                            backgroundColor: "var(--surface-glass)",
                            padding: "30px",
                            borderRadius: "16px",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border-soft-72)",
                        }}
                    >
                        {isEditing ? (
                            <>
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={(e) =>
                                        setProfile({ ...profile, name: e.target.value })
                                    }
                                    style={{
                                        fontSize: "32px",
                                        fontWeight: "bold",
                                        backgroundColor: "transparent",
                                        border: "1px solid var(--color-primary)",
                                        borderRadius: "4px",
                                        color: "var(--text-primary)",
                                        padding: "5px",
                                        marginBottom: "10px",
                                        width: "100%",
                                    }}
                                />

                                <input
                                    type="text"
                                    value={profile.title}
                                    onChange={(e) =>
                                        setProfile({ ...profile, title: e.target.value })
                                    }
                                    style={{
                                        fontSize: "24px",
                                        backgroundColor: "transparent",
                                        border: "1px solid var(--color-primary)",
                                        borderRadius: "4px",
                                        color: "var(--color-primary)",
                                        padding: "5px",
                                        marginBottom: "20px",
                                        width: "100%",
                                    }}
                                />

                                <textarea
                                    value={profile.summary}
                                    onChange={(e) =>
                                        setProfile({ ...profile, summary: e.target.value })
                                    }
                                    style={{
                                        fontSize: "16px",
                                        lineHeight: "1.6",
                                        maxWidth: "900px",
                                        backgroundColor: "transparent",
                                        border: "1px solid var(--border-soft)",
                                        borderRadius: "4px",
                                        color: "var(--text-secondary)",
                                        padding: "10px",
                                        marginBottom: "20px",
                                        width: "100%",
                                        minHeight: "100px",
                                    }}
                                />

                                {/* Contact Info */}
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "15px",
                                        marginTop: "20px",
                                        fontSize: "14px",
                                        color: "var(--text-secondary)",
                                    }}
                                >
                                    <div>
                                        <strong>Email:</strong>{" "}
                                        <input
                                            type="email"
                                            value={profile.email}
                                            onChange={(e) =>
                                                setProfile({ ...profile, email: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <strong>Puhelin:</strong>{" "}
                                        <input
                                            type="tel"
                                            value={profile.phone}
                                            onChange={(e) =>
                                                setProfile({ ...profile, phone: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <strong>Sijainti:</strong>{" "}
                                        <input
                                            type="text"
                                            value={profile.location}
                                            onChange={(e) =>
                                                setProfile({ ...profile, location: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <strong>LinkedIn:</strong>{" "}
                                        <a
                                            href={`https://linkedin.com/in/${profile.linkedin}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            linkedin.com/in/{profile.linkedin}
                                        </a>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <h1 style={{ fontSize: "32px" }}>{profile.name}</h1>
                                <h2 style={{ fontSize: "24px", color: "var(--color-primary)" }}>
                                    {profile.title}
                                </h2>
                                <p style={{ maxWidth: "900px" }}>{profile.summary}</p>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "15px",
                                        marginTop: "20px",
                                    }}
                                >
                                    <div>
                                        <strong>Email:</strong> {profile.email}
                                    </div>

                                    <div>
                                        <strong>Puhelin:</strong> {profile.phone}
                                    </div>

                                    <div>
                                        <strong>Sijainti:</strong> {profile.location}
                                    </div>

                                    <div>
                                        <strong>LinkedIn:</strong>{" "}
                                        <a
                                            href={`https://linkedin.com/in/${profile.linkedin}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            linkedin.com/in/{profile.linkedin}
                                        </a>
                                    </div>

                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <GitHubSection
                                            username={profile.github}
                                            onFetchRepos={handleFetchRepos}
                                            onAnalyze={handleGithubAnalyze}
                                        />
                                    </div>
                                </div>
                            </>

                        )}
                    </section>

        

        {/* Edit Button */}
        <div style={{ textAlign: "right", marginBottom: "20px" }}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: "10px 20px",
              backgroundColor: isEditing ? "#dc3545" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            {isEditing ? "Lopeta Muokkaus" : "Muokkaa Portfoliota"}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "30px", flexWrap: "wrap" }}>
          {["profile", "skills", "experience", "education", "githubProjects"].map((section) => (
            <button
              key={section}
              onClick={() => {
                  setActiveSection(section);
                  if (section === "skills") refetchSkills(undefined, true);}}
              style={{
                padding: "12px 24px",
                backgroundColor: activeSection === section ? "var(--color-primary)" : "var(--surface-soft)",
                color: activeSection === section ? "white" : "var(--text-primary)",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: activeSection === section ? "bold" : "normal",
                transition: "all 0.3s",
              }}
            >
                  {section === "profile"
                      ? "Profiili"
                      : section === "skills"
                          ? "Taidot"
                          : section === "experience"
                              ? "Kokemus"
                              : section === "education"
                                  ? "Koulutus"
                                  : section === "githubProjects"
                                      ? "GitHub-projektit"
                                      : ""
                  }
            </button>
          ))}
        </div>

        {/* Skills Section */}
        {activeSection === "skills" && (
            <section style={{ marginBottom: "50px" }}>
                <h2 style={{ margin: 0 }}>Tekniset Taidot</h2>
            {isEditing ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "30px" }}>
                                  {Object.entries(availableSkills).map(([category, skillsList]) => (
                  <div key={category}>
                    <h3 style={{ textTransform: "capitalize" }}>{category === "frontend" ? "Frontend" : category === "backend" ? "Backend" : category === "tools" ? "Työkalut" : "Muut Taidot"}</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                      {Array.isArray(skillsList) && skillsList.map((skill) => (
                        <label key={skill} style={{ display: "flex", alignItems: "center", fontSize: "14px" }}>
                          <input
                            type="checkbox"
                            checked={selectedSkills[category]?.includes(skill) || false}
                            onChange={(e) => {
                              const updatedSkills = { ...selectedSkills };
                              if (e.target.checked) {
                                if (!updatedSkills[category]) updatedSkills[category] = [];
                                updatedSkills[category] = [...updatedSkills[category], skill];
                              } else {
                                updatedSkills[category] = updatedSkills[category].filter(s => s !== skill);
                              }
                              setSelectedSkills(updatedSkills);
                            }}
                            style={{ marginRight: "8px" }}
                          />
                          {skill}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "30px" }}>
                <div>
                  <h3>Frontend</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {selectedSkills.frontend.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "var(--color-primary)",
                          color: "#ffffff",
                          borderRadius: "20px",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>Backend</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {selectedSkills.backend.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "var(--color-primary-strong)",
                          color: "#ffffff",
                          borderRadius: "20px",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>Työkalut</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {selectedSkills.tools.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "var(--color-success)",
                          color: "#ffffff",
                          borderRadius: "20px",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>Muut Taidot</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {selectedSkills.other.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "var(--color-primary)",
                          color: "#ffffff",
                          borderRadius: "20px",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
                      )}

                        {activeSection === "githubProjects" && githubProjects.length > 0 && (
                          <section style={{ marginTop: "30px" }}>
                            <h3>GitHub-projektit</h3>

                              {githubProjects.map((project, i) => (
                                  <div key={i} style={{ marginBottom: "15px" }}>
                                      <strong>{project.name}</strong>
                                      <p>{project.description}</p>
                                      <a href={project.url} target="_blank">
                                          Avaa GitHubissa
                                      </a>
                                  </div>
                              ))}
                          </section>
                      )}

        {/* Experience Section */}
        {activeSection === "experience" && (
          <section style={{ marginBottom: "50px" }}>
            <h2>Työkokemus & Projektit</h2>
            {(profile.experience || []).map((exp, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "30px",
                  padding: "25px",
                  border: "1px solid var(--border-soft)",
                  borderLeft: "4px solid var(--color-primary)",
                  borderRadius: "6px",
                  backgroundColor: "var(--surface-card)",
                  color: "var(--text-primary)",
                }}
              >
                {isEditing ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                      <div style={{ flex: 1, marginRight: "20px" }}>
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) =>
                          updateArrayItem("experience", index, "title", e.target.value)
                          }
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            border: "1px solid var(--border-soft)",
                            borderRadius: "4px",
                            padding: "5px",
                            width: "100%",
                            marginBottom: "5px",
                            backgroundColor: "var(--surface-input)",
                            color: "var(--text-primary)",
                          }}
                        />
                        <input
                          type="text"
                          value={exp.company}
                                        onChange={(e) => {
                                            updateArrayItem("experience", index, "company", e.target.value)
                                        }}
                            
                          style={{
                            fontSize: "16px",
                            color: "var(--color-primary)",
                            fontWeight: "bold",
                            border: "1px solid var(--border-soft)",
                            borderRadius: "4px",
                            padding: "5px",
                            width: "100%",
                            backgroundColor: "var(--surface-input)",
                          }}
                        />
                      </div>
                      <input
                        type="text"
                        value={exp.period}
                                    onChange={(e) => {
                                        updateArrayItem("experience", index, "period", e.target.value)
                        }}
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "14px",
                          border: "1px solid var(--border-soft)",
                          borderRadius: "4px",
                          padding: "5px",
                          width: "120px",
                          backgroundColor: "var(--surface-input)",
                        }}
                      />
                    </div>
                    <textarea
                      value={exp.description}
                      onChange={(e) => {
                          updateArrayItem("experience", index, "description", e.target.value)
                      }}
                      style={{
                        color: "var(--text-muted)",
                        marginBottom: "15px",
                        border: "1px solid var(--border-soft)",
                        borderRadius: "4px",
                        padding: "10px",
                        width: "100%",
                        minHeight: "60px",
                        backgroundColor: "var(--surface-input)",
                      }}
                    />
                    <h4 style={{ marginTop: 0, marginBottom: "10px" }}>Saavutukset:</h4>
                    {exp.achievements.map((achievement, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                        <textarea
                          value={achievement}
                                onChange={(e) => {
                                    const updated = [...(profile.experience || [])];
                                    updated[index].achievements[idx] = e.target.value;

                                    setProfile({
                                        ...profile,
                                        experience: updated
                                    });
                                }}
                          style={{
                            flex: 1,
                            marginBottom: "8px",
                            color: "var(--text-primary)",
                            backgroundColor: "var(--surface-input)",
                            border: "1px solid var(--border-soft)",
                            borderRadius: "4px",
                            padding: "5px",
                            minHeight: "30px",
                          }}
                        />
                        <button
                                onClick={() => {
                                    const updated = [...(profile.experience || [])];
                                    updated[index].achievements.splice(idx, 1);
                                    setProfile({
                                        ...profile,
                                        experience: updated
                                    });                        
                          }}
                          style={{
                            marginLeft: "10px",
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            padding: "5px 10px",
                            cursor: "pointer",
                          }}
                        >
                          Poista
                        </button>
                      </div>
                    ))}
                    <button
                                onClick={() => {
                                    const updated = [...(profile.experience || [])];
                                    updated[index].achievements.push("");
                                    setProfile({
                                        ...profile,
                                        experience: updated
                                    });
                      }}
                      style={{
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "8px 16px",
                        cursor: "pointer",
                        marginTop: "10px",
                      }}
                    >
                      Lisää Saavutus
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                      <div>
                        <h3 style={{ margin: "0 0 5px 0" }}>{exp.title}</h3>
                        <p style={{ margin: 0, color: "var(--color-primary)", fontWeight: "bold" }}>{exp.company}</p>
                      </div>
                      <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>{exp.period}</span>
                    </div>
                    <p style={{ color: "var(--text-muted)", marginBottom: "15px" }}>{exp.description}</p>
                    <h4 style={{ marginTop: 0, marginBottom: "10px" }}>Saavutukset:</h4>
                    <ul style={{ margin: 0, paddingLeft: "20px" }}>
                      {exp.achievements.map((achievement, idx) => (
                        <li key={idx} style={{ marginBottom: "8px", color: "var(--text-muted)" }}>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
            {isEditing && (
              <button
                onClick={() => {
                                      setProfile({
                                          ...profile,
                                          experience: [...(profile.experience || []), createEmptyExperience()]
                                      });
                }}
                style={{
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "10px 20px",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                Lisää Kokemus
              </button>
            )}
          </section>
        )}

        {/* Education Section */}
        {activeSection === "education" && (
          <section style={{ marginBottom: "50px" }}>
            <h2>Koulutus</h2>
           {(profile.education || []).map((edu, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "30px",
                  padding: "25px",
                  border: "1px solid var(--border-soft)",
                  borderLeft: "4px solid var(--color-success)",
                  borderRadius: "6px",
                  backgroundColor: "var(--surface-card)",
                  color: "var(--text-primary)",
                }}
              >
                {isEditing ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                      <div style={{ flex: 1, marginRight: "20px" }}>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                              updateArrayItem("education", index, "degree", e.target.value)
                          }}
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            border: "1px solid var(--border-soft)",
                            borderRadius: "4px",
                            padding: "5px",
                            width: "100%",
                            marginBottom: "5px",
                            backgroundColor: "var(--surface-input)",
                            color: "var(--text-primary)",
                          }}
                        />
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => {
                              updateArrayItem("education", index, "institution", e.target.value)                
                          }}
                          style={{
                            fontSize: "16px",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border-soft)",
                            borderRadius: "4px",
                            padding: "5px",
                            width: "100%",
                            backgroundColor: "var(--surface-input)",
                          }}
                        />
                      </div>
                      <input
                        type="text"
                        value={edu.year}
                                   onChange={(e) => {
                                       updateArrayItem("education", index, "year", e.target.value)                          
                        }}
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "14px",
                          fontWeight: "bold",
                          border: "1px solid var(--border-soft)",
                          borderRadius: "4px",
                          padding: "5px",
                          width: "120px",
                          backgroundColor: "var(--surface-input)",
                        }}
                      />
                    </div>
                    <h4 style={{ marginTop: 0, marginBottom: "10px" }}>Relevantit Kurssit:</h4>
                    {edu.relevant.map((course, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                        <input
                          type="text"
                          value={course}
                                onChange={(e) => {
                                    updateNestedArrayItem("education", index, "relevant", idx, e.target.value)                           
                          }}
                          style={{
                            flex: 1,
                            padding: "6px 12px",
                            backgroundColor: "var(--color-success)",
                            color: "#ffffff",
                            borderRadius: "16px",
                            fontSize: "13px",
                            border: "1px solid var(--border-soft)",
                            marginRight: "10px",
                          }}
                        />
                        <button
                                onClick={() => {
                                    const updated = [...(profile.education || [])];
                                    updated[index].relevant.splice(idx, 1);

                                    setProfile({
                                        ...profile,
                                        education: updated
                                    });
                                }}
                                    
                          style={{
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            padding: "5px 10px",
                            cursor: "pointer",
                          }}
                        >
                          Poista
                        </button>
                      </div>
                    ))}
                    <button
                               onClick={() => {
                                   const updated = [...(profile.education || [])];
                                   updated[index].relevant.push("");

                                   setProfile({
                                       ...profile,
                                       education: updated
                                   });
                               }}
                      style={{
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "8px 16px",
                        cursor: "pointer",
                        marginTop: "10px",
                      }}
                    >
                      Lisää Kurssi
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                      <div>
                        <h3 style={{ margin: "0 0 5px 0" }}>{edu.degree}</h3>
                        <p style={{ margin: 0, color: "var(--text-muted)" }}>{edu.institution}</p>
                      </div>
                      <span style={{ color: "var(--text-muted)", fontSize: "14px", fontWeight: "bold" }}>{edu.year}</span>
                    </div>
                    <h4 style={{ marginTop: 0, marginBottom: "10px" }}>Relevantit Kurssit:</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {edu.relevant.map((course, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "var(--color-success)",
                            color: "#ffffff",
                            borderRadius: "16px",
                            fontSize: "13px",
                          }}
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
            {isEditing && (
              <button
                onClick={() => {
                                      setProfile({
                                          ...profile,
                                          education: [...(profile.education || []), createEmptyEducation()]
                                      });
                }}
                style={{
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "10px 20px",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                Lisää Koulutus
              </button>
            )}

            <h2>Sertifikaatit & Koulutukset</h2>
            {isEditing ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
                                  {(profile.certifications || []).map((cert, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "15px 20px",
                      backgroundColor: "var(--color-primary)",
                      border: "1px solid var(--color-primary)",
                      borderRadius: "6px",
                      textAlign: "center",
                    }}
                  >
                    <input
                      type="text"
                      value={cert}
                      onChange={(e) => {
                          const updated = [...(profile.certifications || [])];
                          updated[index] = e.target.value;
                          setProfile({
                              ...profile,
                              certifications: updated
                          });
                      }}
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        textAlign: "center",
                        fontWeight: "bold",
                        color: "#ffffff",
                        fontSize: "14px",
                        width: "100%",
                      }}
                    />
                    <button
                                              onClick={() => {
                                                  const updated = [...(profile.certifications || [])];
                                                  updated.splice(index, 1);

                                                  setProfile({
                                                      ...profile,
                                                      certifications: updated
                                                  });
                                              }}
                      style={{
                        marginTop: "10px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "5px 10px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Poista
                    </button>
                  </div>
                ))}
                <button
                                      onClick={() => setProfile({
                                          ...profile,
                                          certifications: [...(profile.certifications || []), ""]
                                      })}
                  style={{
                    padding: "15px 20px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  + Lisää Sertifikaatti
                </button>
              </div>
            ) : (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
                                      {(profile.certifications || []).map((cert, index) => (
                                          <div
                                              key={index}
                                              style={{
                                                  padding: "15px 20px",
                                                  backgroundColor: "var(--color-primary)",
                                                  border: "1px solid var(--color-primary)",
                                                  borderRadius: "6px",
                                                  textAlign: "center",
                                              }}
                                          >
                    <p style={{ margin: 0, fontWeight: "bold", color: "#ffffff" }}>{cert}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Profile Section (Default) */}
        {activeSection === "profile" && (
          <section style={{ marginBottom: "50px" }}>
            <h2>Profiilin Yhteenveto</h2>
            {isEditing ? (
              <>
                <div style={{ backgroundColor: "#e3f2fd", padding: "25px", borderRadius: "8px", marginBottom: "30px" }}>
                  <h3 style={{ color: "var(--color-primary-strong)", marginTop: 0 }}>Miksi minut?</h3>
                                      <textarea
                                          value={joinLines(profile.profileSummary?.whyMe || [])}
                                          onChange={(e) =>
                                              setProfile({
                                                  ...profile,
                                                  profileSummary: {
                                                      ...profile.profileSummary,
                                                      whyMe: parseLines(e.target.value)
                                                  }
                                              })
                                          }
                    style={{
                      lineHeight: "1.8",
                      color: "#1a237e",
                      border: "1px solid var(--border-soft)",
                      borderRadius: "4px",
                      padding: "10px",
                      width: "100%",
                      minHeight: "120px",
                    }}
                  />
                </div>

                <div style={{ backgroundColor: "#e8f5e9", padding: "25px", borderRadius: "8px" }}>
                  <h3 style={{ color: "#1b5e20", marginTop: 0 }}>Mitä etsin?</h3>
                  <textarea
                                          value={joinLines(profile.profileSummary?.lookingFor || [])}
                    onChange={(e) =>
                      setProfile({
                          ...profile,
                          profileSummary: {
                              ...profile.profileSummary,
                              lookingFor: parseLines(e.target.value),
                          }
                      })
                    }
                    style={{
                      lineHeight: "1.8",
                      color: "#1b5e20",
                      border: "1px solid var(--border-soft)",
                      borderRadius: "4px",
                      padding: "10px",
                      width: "100%",
                      minHeight: "120px",
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                                      <div style={{ backgroundColor: "#e3f2fd", padding: "25px", borderRadius: "8px", marginBottom: "30px" }}>
                                          <h3 style={{ color: "var(--color-primary-strong)" }}>Miksi minut?</h3>
                                          {(profile.profileSummary?.whyMe || []).length > 0 ? (
                                              <ul style={{ paddingLeft: "20px", lineHeight: "1.8", color: "#1a237e" }}>
                                                  {(profile.profileSummary?.whyMe || []).map((item, idx) => (
                                                      <li key={idx}>{item}</li>
                                                  ))}
                                              </ul>
                                          ) : (
                                              <p style={{ color: "#1a237e", margin: 0 }}>
                                                  Ei lisättyä sisältöä vielä.
                                              </p>
                                          )}
                                      </div>

                <div style={{ backgroundColor: "#e8f5e9", padding: "25px", borderRadius: "8px" }}>
                  <h3 style={{ color: "#1b5e20" }}>Mitä etsin?</h3>
                  {(profile.profileSummary?.lookingFor || []).length > 0 ? (
                                              <ul style={{ paddingLeft: "20px", lineHeight: "1.8", color: "#1b5e20" }}>
                                                  {(profile.profileSummary?.lookingFor || []).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: "#1b5e20", margin: 0 }}>Ei lisattya sisaltoa viela.</p>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {/* Call to Action */}
        <section style={{ marginTop: "50px", paddingTop: "30px", borderTop: "2px solid var(--border-soft)", textAlign: "center", backgroundColor: "rgba(40, 61, 168, 0.08)", padding: "30px", borderRadius: "8px", color: "var(--text-primary)" }}>
          <h2 style={{ color: "var(--text-primary)" }}>Kiinnostunut Yhteistyöstä?</h2>
          <p style={{ fontSize: "16px", color: "var(--text-muted)", marginBottom: "25px" }}>
            Ota minuun yhteyttä uusista mahdollisuuksista tai kyselyistä!
          </p>
          <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href={profile.email ? `mailto:${profile.email}` : "#"}
              style={{
                padding: "12px 30px",
                backgroundColor: "var(--color-primary)",
                color: "white",
                textDecoration: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                opacity: profile.email ? 1 : 0.5,
                pointerEvents: profile.email ? "auto" : "none",
              }}
            >
              Lähetä Sähköposti
            </a>
            <a
              href={profile.linkedin ? `https://linkedin.com/in/${profile.linkedin}` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "12px 30px",
                backgroundColor: "#0077B5",
                color: "white",
                textDecoration: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                opacity: profile.linkedin ? 1 : 0.5,
                pointerEvents: profile.linkedin ? "auto" : "none",
              }}
            >
              LinkedIn
            </a>
            <a
              href={profile.github ? `https://github.com/${profile.github}` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "12px 30px",
                backgroundColor: "#24292e",
                color: "white",
                textDecoration: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                opacity: profile.github ? 1 : 0.5,
                pointerEvents: profile.github ? "auto" : "none",
              }}
            >
              GitHub
            </a>
          </div>
        </section>
      </div>
          </div>

            {showSkillModal && detectedSkills && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 1000
                }}>
                    <div style={{
                        background: "var(--surface-card)",
                        color: "var(--text-primary)",
                        padding: "30px",
                        borderRadius: "10px",
                        maxWidth: "400px",
                        width: "90%",
                        border: "1px solid var(--border-soft)"
                    }}>
                        <h3>GitHubista löytyi taidot</h3>

                        <div style={{ marginBottom: "20px" }}>
                            {[...detectedSkills.frontend,
                            ...detectedSkills.backend,
                            ...detectedSkills.tools,
                            ...detectedSkills.other
                            ].map((skill, i) => (
                                <div key={i}>{skill}</div>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>
                            <button onClick={handleConfirmSkills}>
                                Lisää taidot
                            </button>

                            <button onClick={() => setShowSkillModal(false)}>
                                Peruuta
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        )
    </>
  );
}