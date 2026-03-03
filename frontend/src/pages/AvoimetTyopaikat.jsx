import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import "../styles/portfolio.css";

export default function AvoimetTyopaikat() {
  // Hakukriteerit
  const [searchCriteria, setSearchCriteria] = useState({
    jobTitle: "Frontend Developer",
    location: "Helsinki",
    keywords: ["React", "JavaScript"],
    experience: "mid"
  });

  // Hakutulokset ja loading-state
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [keywordInput, setKeywordInput] = useState("React, JavaScript");
  const [searchMeta, setSearchMeta] = useState({ responseTime: null, sources: [] });

  // Hae työpaikkoja
  const handleSearch = async (e) => {
    e.preventDefault();
    console.log("🔍 Haku aloitettu", searchCriteria);
    setLoading(true);

    try {
      console.log("📤 Lähetetään pyyntö: http://localhost:3000/api/jobs/search");
      const response = await fetch("http://localhost:3000/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchCriteria)
      });

      console.log("📥 Vastaus saatu:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Data parsittu:", data);
        setAvailableJobs(data.jobs);
        setSearchMeta({
          responseTime: data.responseTimeMs,
          sources: data.sources || ["Kaikki lähteet"]
        });
        setSearched(true);
      } else {
        console.error("❌ API virhe:", response.status);
        alert("Haku epäonnistui. Käytetään demo-dataa.");
        setAvailableJobs(getDemoJobs());
        setSearchMeta({
          responseTime: null,
          sources: ["Demo-data"]
        });
        setSearched(true);
      }
    } catch (err) {
      console.error("❌ Verkkovirhe:", err);
      setAvailableJobs(getDemoJobs());
      setSearchMeta({
        responseTime: null,
        sources: ["Demo-data"]
      });
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  // Demo-data varalle
  const getDemoJobs = () => [
    {
      id: 1,
      title: "Frontend Developer",
      company: "TechCorp Oy",
      location: "Helsinki",
      compatibility: 88,
      recommended: true,
      description: "Etsimme kokenutta Frontend Developer -osaajaa moderneihin React-pohjaisiin projekteihin. Työssä pääset kehittämään käyttäjäystävällisiä web-sovelluksia.",
      requiredSkills: ["React", "JavaScript", "CSS", "HTML"],
      matchedSkills: ["React", "JavaScript", "CSS", "HTML"],
      missingSkills: [],
      salary: "4000-5000€/kk",
      type: "Kokoaikainen",
      posted: "2 päivää sitten",
      source: "Duunitori"
    },
    {
      id: 2,
      title: "Full Stack Developer",
      company: "StartupXYZ",
      location: "Tampere",
      compatibility: 75,
      recommended: false,
      description: "Kasvava startup hakee Full Stack -kehittäjää tiimiimme. Teknologiat: Node.js, React, PostgreSQL. Mahdollisuus vaikuttaa tuotteen kehitykseen.",
      requiredSkills: ["React", "Node.js", "PostgreSQL", "Docker"],
      matchedSkills: ["React", "Node.js"],
      missingSkills: ["PostgreSQL", "Docker"],
      salary: "3500-4500€/kk",
      type: "Kokoaikainen",
      posted: "1 viikko sitten",
      source: "LinkedIn"
    },
    {
      id: 3,
      title: "Backend Developer",
      company: "DataSystems Ltd",
      location: "Oulu",
      compatibility: 68,
      recommended: false,
      description: "Backend-kehittäjä rakentamaan skaalautuvia REST API:ita. Teknologiapino: Node.js, Express, MongoDB. Kokemus mikropalveluista plussaa.",
      requiredSkills: ["Node.js", "Express", "MongoDB", "REST APIs"],
      matchedSkills: ["Node.js", "Express", "REST APIs"],
      missingSkills: ["MongoDB"],
      salary: "3800-4800€/kk",
      type: "Kokoaikainen",
      posted: "3 päivää sitten",
      source: "Yrityksen sivu"
    },
    {
      id: 4,
      title: "Junior Developer",
      company: "WebSolutions Inc",
      location: "Jyväskylä",
      compatibility: 82,
      recommended: true,
      description: "Junior-kehittäjä web-projekteihin. Opastus ja mentorointi tarjolla. Teknologiat: JavaScript, React, Node.js, Git.",
      requiredSkills: ["JavaScript", "React", "Node.js", "Git"],
      matchedSkills: ["JavaScript", "React", "Node.js", "Git"],
      missingSkills: [],
      salary: "2800-3500€/kk",
      type: "Kokoaikainen",
      posted: "5 päivää sitten",
      source: "Duunitori"
    },
    {
      id: 5,
      title: "DevOps Engineer",
      company: "CloudTech Solutions",
      location: "Espoo",
      compatibility: 71,
      recommended: false,
      source: "LinkedIn",
      description: "DevOps-insinööri pilvipohjaisten järjestelmien ylläpitoon ja kehitykseen. AWS, Docker, Kubernetes -kokemus vaaditaan.",
      requiredSkills: ["AWS", "Docker", "Kubernetes", "CI/CD"],
      matchedSkills: ["Docker"],
      missingSkills: ["AWS", "Kubernetes", "CI/CD"],
      salary: "4500-5500€/kk",
      type: "Kokoaikainen",
      posted: "1 päivä sitten"
    },
    {
      id: 6,
      title: "Mobile App Developer",
      company: "AppWorks Mobile",
      location: "Turku",
      compatibility: 79,
      recommended: true,
      description: "React Native -kehittäjä mobiilisovellusten kehitykseen. Kokemus native-moduuleista ja app store -julkaisuista plussaa.",
      requiredSkills: ["React Native", "JavaScript", "iOS", "Android"],
      matchedSkills: ["JavaScript"],
      missingSkills: ["React Native", "iOS", "Android"],
      salary: "3800-4700€/kk",
      type: "Kokoaikainen",
      posted: "4 päivää sitten",
      source: "Yrityksen sivu"
    }
  ];

  // Ei ladata mitään automaattisesti - vain kun käyttäjä hakee
  useEffect(() => {
    // Tyhjä aluksi, käyttäjä klikkaa "Hae työpaikkoja"
  }, []);

  const [appliedJobs, setAppliedJobs] = useState(() => {
    const saved = localStorage.getItem('appliedJobs');
    return saved ? JSON.parse(saved) : [];
  });

  // Kuuntele localStorage muutoksia (kun hakemus poistetaan Työhaut-sivulta)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('appliedJobs');
      setAppliedJobs(saved ? JSON.parse(saved) : []);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const applyForJob = (job) => {
    if (!appliedJobs.find(applied => applied.id === job.id)) {
      const newApplied = [...appliedJobs, job];
      setAppliedJobs(newApplied);
      localStorage.setItem('appliedJobs', JSON.stringify(newApplied));
      // Trigger storage event for other tabs
      window.dispatchEvent(new Event('storage'));
    }
  };

  // Funktio ympyräkaavion piirtämiseen
  const renderPieChart = (compatibility) => {
    const angle = (compatibility / 100) * 360;
    const largeArc = angle > 180 ? 1 : 0;

    const x1 = 75 + 60 * Math.cos((0 * Math.PI) / 180);
    const y1 = 75 + 60 * Math.sin((0 * Math.PI) / 180);
    const x2 = 75 + 60 * Math.cos((angle * Math.PI) / 180);
    const y2 = 75 + 60 * Math.sin((angle * Math.PI) / 180);

    const color = compatibility >= 80 ? "#4CAF50" : compatibility >= 70 ? "#FFC107" : "#FF6B6B";

    return (
      <svg width="150" height="150" viewBox="0 0 150 150" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}>
        {/* Taustakehä */}
        <circle cx="75" cy="75" r="60" fill="rgba(148, 163, 184, 0.2)" opacity="0.5" />

        {/* Yhteensopivuuskehä */}
        <path
          d={`M 75 75 L ${x1} ${y1} A 60 60 0 ${largeArc} 1 ${x2} ${y2} Z`}
          fill={color}
          opacity="0.8"
        />

        {/* Keskellä oleva teksti */}
        <circle cx="75" cy="75" r="42" fill="rgba(30, 41, 59, 0.9)" />
        <text x="75" y="70" fontSize="28" fontWeight="bold" textAnchor="middle" fill={color}>
          {compatibility}%
        </text>
        <text x="75" y="88" fontSize="10" textAnchor="middle" fill="#cbd5e1">
          Match
        </text>
      </svg>
    );
  };

  return (
    <>
      <Navbar />
      <hr className="divider" />

      <div className="portfolio-page">
      <div className="portfolio-container">
        <h1 style={{ marginBottom: "10px", color: "#f1f5f9", fontSize: "2.5rem" }}>Avoimet Työpaikat</h1>
        <p style={{ color: "#cbd5e1", marginBottom: "10px", fontSize: "1.1rem" }}>
          Löydä sinulle sopivia työpaikkoja
        </p>

        {/* Hakumuoto */}
        <form onSubmit={handleSearch} style={{ marginBottom: "30px", padding: "20px", backgroundColor: "rgba(76, 99, 255, 0.1)", borderRadius: "16px", border: "1px solid rgba(76, 99, 255, 0.3)" }}>
          <h3 style={{ color: "#f1f5f9", marginTop: 0 }}>🔍 Automaattinen Haku</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px", marginBottom: "15px" }}>
            <div>
              <label style={{ display: "block", color: "#cbd5e1", marginBottom: "5px", fontSize: "0.9rem", fontWeight: "500" }}>
                Tehtävän nimi
              </label>
              <input
                type="text"
                value={searchCriteria.jobTitle}
                onChange={(e) => setSearchCriteria({ ...searchCriteria, jobTitle: e.target.value })}
                placeholder="esim. Frontend Developer"
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid rgba(148, 163, 184, 0.3)",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                  fontSize: "0.95rem"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", color: "#cbd5e1", marginBottom: "5px", fontSize: "0.9rem", fontWeight: "500" }}>
                Sijainti
              </label>
              <input
                type="text"
                value={searchCriteria.location}
                onChange={(e) => setSearchCriteria({ ...searchCriteria, location: e.target.value })}
                placeholder="esim. Helsinki, Remote"
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid rgba(148, 163, 184, 0.3)",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                  fontSize: "0.95rem"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", color: "#cbd5e1", marginBottom: "5px", fontSize: "0.9rem", fontWeight: "500" }}>
                Kokemus
              </label>
              <select
                value={searchCriteria.experience}
                onChange={(e) => setSearchCriteria({ ...searchCriteria, experience: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid rgba(148, 163, 184, 0.3)",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                  fontSize: "0.95rem"
                }}
              >
                <option value="junior">Junior</option>
                <option value="mid">Mid-level</option>
                <option value="senior">Senior</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", color: "#cbd5e1", marginBottom: "5px", fontSize: "0.9rem", fontWeight: "500" }}>
              Avainsanat (pilkulla erotettu)
            </label>
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => {
                setKeywordInput(e.target.value);
                setSearchCriteria({ ...searchCriteria, keywords: e.target.value.split(",").map(k => k.trim()) });
              }}
              placeholder="esim. React, JavaScript, TypeScript"
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "rgba(30, 41, 59, 0.6)",
                border: "1px solid rgba(148, 163, 184, 0.3)",
                borderRadius: "8px",
                color: "#f1f5f9",
                fontSize: "0.95rem"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 30px",
              background: loading ? "rgba(148, 163, 184, 0.3)" : "linear-gradient(135deg, #ff6b6b, #4c63ff)",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: loading ? "wait" : "pointer",
              transition: "all 0.3s ease",
              boxShadow: loading ? "none" : "0 4px 12px rgba(76, 99, 255, 0.3)"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(76, 99, 255, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(76, 99, 255, 0.3)";
              }
            }}
          >
            {loading ? "🔄 Haetaan..." : "🚀 Hae työpaikkoja"}
          </button>
        </form>

        {!searched && !loading && (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#cbd5e1",
            fontSize: "1.1rem"
          }}>
            <p style={{ fontSize: "3rem", marginBottom: "10px" }}>🔍</p>
            <p>Käytä hakumuotoa etsiäksesi sinulle sopivia työpaikkoja</p>
            <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginTop: "10px" }}>
              Haku käy läpi Duunitori, LinkedIn ja yritysten omat sivut
            </p>
          </div>
        )}

        {searched && availableJobs.length === 0 && (
          <p style={{ color: "#ef4444", fontSize: "1.1rem", textAlign: "center", padding: "20px" }}>
            ❌ Ei löytynyt työpaikkoja annettujen kriteerien perusteella.
          </p>
        )}

        {availableJobs.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p style={{ color: "#cbd5e1", fontSize: "0.95rem", marginBottom: "8px" }}>
              📊 Löytyi {availableJobs.length} työpaikkaa
              {searchMeta.responseTime && ` (haettu ${searchMeta.responseTime}ms)`}
            </p>
            {searchMeta.sources && searchMeta.sources.length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {searchMeta.sources.map((source, idx) => (
                  <span key={idx} style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    backgroundColor: "rgba(76, 99, 255, 0.2)",
                    color: "#4c63ff",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "500"
                  }}>
                    🔗 {source}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {availableJobs.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {availableJobs.map((job) => {
              const isApplied = appliedJobs.find(applied => applied.id === job.id);
              return (
              <div
                key={job.id}
                style={{
                  padding: "24px",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: "16px",
                  backgroundColor: "rgba(30, 41, 59, 0.6)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.borderColor = "rgba(76, 99, 255, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                }}
              >
                <h3 style={{ margin: "0 0 10px 0", color: "#7dd3fc", fontSize: "1.4rem" }}>{job.title}</h3>
                <p style={{ margin: "0 0 15px 0", fontSize: "16px", color: "#cbd5e1" }}>
                  <strong>{job.company}</strong> • {job.location}
                </p>

                {/* Lähde-badge */}
                <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    backgroundColor: 
                      job.source === "Duunitori" ? "rgba(255, 107, 107, 0.2)" :
                      job.source === "LinkedIn" ? "rgba(0, 102, 153, 0.2)" :
                      job.source === "Yrityksen sivu" ? "rgba(76, 99, 255, 0.2)" :
                      "rgba(148, 163, 184, 0.2)",
                    color: 
                      job.source === "Duunitori" ? "#ef4444" :
                      job.source === "LinkedIn" ? "#06b6d4" :
                      job.source === "Yrityksen sivu" ? "#4c63ff" :
                      "#94a3b8",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "500"
                  }}>
                    📌 {job.source}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "15px" }}>
                  <div style={{ flexShrink: 0 }}>
                    {renderPieChart(job.compatibility)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", color: "#94a3b8" }}>
                      <span>💰 {job.salary}</span>
                      <span>📅 {job.type}</span>
                      <span>🕒 {job.posted}</span>
                      {job.recommended && <span style={{ color: "#4CAF50", fontWeight: "600" }}>⭐ Suositeltu sinulle</span>}
                    </div>
                  </div>
                </div>

                <p style={{ color: "#cbd5e1", marginBottom: "15px", lineHeight: "1.6" }}>{job.description}</p>

                <div style={{ marginBottom: "15px" }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#f1f5f9" }}>Vaaditut Taidot:</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {job.requiredSkills.map((skill) => {
                      const isMatched = job.matchedSkills.includes(skill);
                      return (
                        <span
                          key={skill}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: isMatched ? "rgba(76, 185, 68, 0.2)" : "rgba(239, 68, 68, 0.2)",
                            color: isMatched ? "#4CAF50" : "#ef4444",
                            border: `1px solid ${isMatched ? "rgba(76, 185, 68, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          {isMatched ? "✓ " : "✗ "}
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => applyForJob(job)}
                  disabled={isApplied}
                  style={{
                    width: "100%",
                    padding: "12px 24px",
                    background: isApplied ? "rgba(148, 163, 184, 0.3)" : "linear-gradient(135deg, #ff6b6b, #4c63ff)",
                    color: "#ffffff",
                    border: isApplied ? "1px solid rgba(148, 163, 184, 0.3)" : "none",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: isApplied ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: isApplied ? "none" : "0 4px 12px rgba(76, 99, 255, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isApplied) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(76, 99, 255, 0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isApplied) {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(76, 99, 255, 0.3)";
                    }
                  }}
                >
                  {isApplied ? "✓ Hakemus lähetetty" : "📝 Hae työpaikkaa"}
                </button>
              </div>
            );
          })}
          </div>
        )}
      </div>
      </div>
    </>
  );
}