import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import "../styles/portfolio.css";
import { useAppliedJobs } from "../hooks/db/useAppliedJobs";
import { usePortfolio } from "../hooks/useDatabase";

export default function Jobs() {
  const [selectedJob, setSelectedJob] = useState(0);
  const { jobs, loading, deleteJob } = useAppliedJobs();
  const currentJobs = Array.isArray(jobs) ? jobs : [];
    const currentJob = currentJobs[selectedJob] || currentJobs[0];

    const { portfolio } = usePortfolio();

    const hasProfile =
        portfolio &&
        portfolio.name &&
        portfolio.email;

  
  if (loading) {
    return (
      <>
        <Navbar />
        <hr className="divider" />
        <div className="portfolio-page">
          <div className="portfolio-container" style={{ textAlign: "center" }}>
            <h1 style={{ color: "var(--text-primary)", fontSize: "2.5rem", marginBottom: "20px" }}>Työhaut</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "30px", fontSize: "1.1rem" }}>
              Ladataan haettuja työpaikkoja...
            </p>
          </div>
        </div>
      </>
    );
    }
    if (!hasProfile) {
        return (
            <>
                <Navbar />
                <hr className="divider" />

                <div className="empty-overlay">
                    <div className="empty-modal">
                        <h2>Ei profiilia</h2>
                        <p>Luo profiili käyttääksesi tätä näkymää</p>

                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                window.location.href = "/";
                            }}
                        >
                            Luo profiili
                        </button>
                    </div>
                </div>
            </>
        );
    }


  if (currentJobs.length === 0) {
    return (
      <>
        <Navbar />
        <hr className="divider" />
        <div className="portfolio-page">
          <div className="portfolio-container" style={{ textAlign: "center" }}>
            <h1 style={{ color: "var(--text-primary)", fontSize: "2.5rem", marginBottom: "20px" }}>Työhaut</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "30px", fontSize: "1.1rem" }}>
              Et ole vielä hakenut yhtään työpaikkaa.
            </p>
            <p style={{ color: "var(--text-muted)" }}>
              Siirry <a href="/avoimet-tyopaikat" style={{ color: "var(--color-primary)", textDecoration: "none", borderBottom: "1px solid var(--color-primary)" }}>Avoimet Työpaikat</a> -sivulle ja hae työpaikkoja.
            </p>
          </div>
        </div>
      </>
    );
  }

  // Funktio ympyräkaavion piirtämiseen
  const renderPieChart = (compatibility) => {
    const angle = Math.min((compatibility / 100) * 360, 359.999); // jesari fix clamp: 0-360, koska 360 deg tarkoittaa 0.
    const largeArc = angle > 180 ? 1 : 0;

    const x1 = 125 + 100 * Math.cos((0 * Math.PI) / 180);
    const y1 = 125 + 100 * Math.sin((0 * Math.PI) / 180);
    const x2 = 125 + 100 * Math.cos((angle * Math.PI) / 180);
    const y2 = 125 + 100 * Math.sin((angle * Math.PI) / 180);

    const color = compatibility >= 80 ? "var(--color-success)" : compatibility >= 70 ? "#FFC107" : "#FF6B6B";

    return (
      <svg width="250" height="250" viewBox="0 0 250 250" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.1))" }}>
        {/* Taustakehä */}
        <circle cx="125" cy="125" r="100" fill="var(--border-soft-72)" opacity="0.3" />

        {/* Yhteensopivuuskehä */}
        <path
          d={`M 125 125 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
          fill={color}
          opacity="0.8"
        />

        {/* Keskellä oleva teksti */}
        <circle cx="125" cy="125" r="70" fill="var(--surface-card)" />
        <text x="125" y="120" fontSize="48" fontWeight="bold" textAnchor="middle" fill={color}>
          {compatibility}%
        </text>
        <text x="125" y="145" fontSize="14" textAnchor="middle" fill="var(--text-muted)">
          Yhteensopivuus
        </text>
      </svg>
    );
  };

  const handleDelete = async (jobId) => {
    await deleteJob(jobId);
    const updatedJobs = currentJobs.filter(j => j.id !== jobId);
    if (selectedJob >= updatedJobs.length) {
      setSelectedJob(Math.max(updatedJobs.length - 1, 0));
    }
  };

  return (
    <>
      <Navbar />
      <hr className="divider" />

      <div className="portfolio-page">
        <div className="portfolio-container">
          <h1 style={{ marginBottom: "10px", color: "var(--text-primary)", fontSize: "2.5rem" }}>Työhaut</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "30px", fontSize: "1.1rem" }}>
            Haettujen työpaikkojen yhteensopivuus
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px" }}>
            <div>
              <h3 style={{ marginTop: 0, color: "var(--text-primary)", fontSize: "1.3rem" }}>Haetut Työpaikat</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {currentJobs.map((job, index) => (
                  <div
                    key={job.id}
                    style={{
                      padding: "15px",
                      backgroundColor: selectedJob === index ? "rgba(40, 61, 168, 0.24)" : "var(--surface-glass)",
                      color: "var(--text-primary)",
                      borderRadius: "12px",
                      border: selectedJob === index ? "2px solid rgba(40, 61, 168, 0.42)" : "1px solid var(--border-soft-72)",
                      transition: "all 0.3s",
                      position: "relative",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <div onClick={() => setSelectedJob(index)} style={{ cursor: "pointer", paddingRight: "40px" }}>
                      <h4 style={{ margin: "0 0 5px 0", fontSize: "16px", color: "var(--text-primary)" }}>{job.title}</h4>
                      <p style={{ margin: "0 0 5px 0", fontSize: "13px", opacity: 0.9, color: "var(--text-secondary)" }}>
                        {job.company} • {job.location}
                      </p>
                      <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--color-primary)" }}>
                        Yhteensopivuus: {job.compatibility}%
                      </div>
                      {job.recommended && (
                        <div style={{ fontSize: "12px", marginTop: "5px", color: "var(--color-success)" }}>Suositeltu</div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(job.id);
                      }}
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        backgroundColor: "rgba(239, 68, 68, 0.8)",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "5px 8px",
                        fontSize: "12px",
                        cursor: "pointer",
                        opacity: 0.8,
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = "1"}
                      onMouseLeave={(e) => e.target.style.opacity = "0.8"}
                      title="Poista hakemus"
                    >
                      Poista
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ backgroundColor: "var(--surface-glass)", border: "1px solid var(--border-soft-72)", backdropFilter: "blur(10px)", padding: "30px", borderRadius: "16px", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
                <h2 style={{ margin: "0 0 10px 0", color: "var(--color-primary)", fontSize: "1.8rem" }}>{currentJob.title}</h2>
                <p style={{ margin: "0 0 20px 0", fontSize: "16px", color: "var(--text-secondary)" }}>
                  <strong>{currentJob.company}</strong> • {currentJob.location}
                </p>

                <div style={{ display: "flex", justifyContent: "center", margin: "30px 0" }}>
                  {renderPieChart(currentJob.compatibility)}
                </div>

                <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "25px" }}>
                  {currentJob.description}
                </p>

                <div style={{ marginBottom: "25px" }}>
                  <h4 style={{ marginTop: 0, marginBottom: "10px", color: "var(--text-primary)" }}>Vaaditut Taidot:</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {currentJob.requiredSkills.map((skill) => {
                      const isMatched = currentJob.matchedSkills.includes(skill);
                      return (
                        <span
                          key={skill}
                          style={{
                            padding: "8px 14px",
                            backgroundColor: isMatched ? "rgba(76, 185, 68, 0.2)" : "rgba(239, 68, 68, 0.2)",
                            color: isMatched ? "var(--color-success)" : "#ef4444",
                            border: `1px solid ${isMatched ? "rgba(76, 185, 68, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                            borderRadius: "10px",
                            fontSize: "13px",
                            fontWeight: "500",
                          }}
                        >
                          {isMatched ? "Sopii: " : "Puuttuu: "}
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {currentJob.missingSkills.length > 0 && (
                  <div style={{ backgroundColor: "rgba(255, 107, 107, 0.15)", padding: "20px", borderRadius: "12px", marginBottom: "25px", borderLeft: "4px solid #ef4444", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                    <h4 style={{ marginTop: 0, marginBottom: "15px", color: "#ef4444" }}>Puuttuvat taidot:</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {currentJob.missingSkills.map((skill) => (
                        <div key={skill} style={{ padding: "10px 16px", backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "10px", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
                          {skill}
                        </div>
                      ))}
                    </div>
                    <p style={{ margin: "15px 0 0 0", fontSize: "13px", color: "#f87171" }}>
                      Suositus: Näiden taitojen kehittäminen parantaisi yhteensopivuutta tämän työpaikan kanssa.
                    </p>
                  </div>
                )}

                {currentJob.recommended && (
                  <div style={{ backgroundColor: "rgba(76, 185, 68, 0.15)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(76, 185, 68, 0.3)" }}>
                    <h4 style={{ margin: "0 0 10px 0", color: "var(--color-success)" }}>Suositeltu työpaikka sinulle</h4>
                    <p style={{ margin: 0, color: "var(--text-secondary)" }}>
                      Tämä paikkaisteeltosi on paras vastine sinun taidoillesi. Henkilökohtainen yhteensopivuus on <strong style={{ color: "var(--color-success)" }}>{currentJob.compatibility}%</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}