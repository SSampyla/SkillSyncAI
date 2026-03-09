import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import "../styles/portfolio.css";

export default function Jobs() {
  const [selectedJob, setSelectedJob] = useState(0);

  // Haetut työpaikat localStoragesta
  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem('appliedJobs');
    return saved ? JSON.parse(saved) : [];
  });

  // Päivitä jobs kun localStorage muuttuu
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('appliedJobs');
      if (saved) {
        setJobs(JSON.parse(saved));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Poista hakemus
  const removeJobApplication = (jobId) => {
    const updatedJobs = jobs.filter(job => job.id !== jobId);
    setJobs(updatedJobs);
    localStorage.setItem('appliedJobs', JSON.stringify(updatedJobs));
    
    // Päivitä valittu työpaikka jos se poistettiin
    if (selectedJob >= updatedJobs.length && updatedJobs.length > 0) {
      setSelectedJob(updatedJobs.length - 1);
    } else if (updatedJobs.length === 0) {
      setSelectedJob(0);
    }
  };

  if (jobs.length === 0) {
    return (
      <>
        <Navbar />
        <hr className="divider" />
        <div className="portfolio-page">
          <div className="portfolio-container" style={{ textAlign: "center" }}>
            <h1 style={{ color: "#f1f5f9", fontSize: "2.5rem", marginBottom: "20px" }}>Työhaut</h1>
            <p style={{ color: "#cbd5e1", marginBottom: "30px", fontSize: "1.1rem" }}>
              Et ole vielä hakenut yhtään työpaikkaa.
            </p>
            <p style={{ color: "#94a3b8" }}>
              Siirry <a href="/avoimet-tyopaikat" style={{ color: "#7dd3fc", textDecoration: "none", borderBottom: "1px solid #7dd3fc" }}>Avoimet Työpaikat</a> -sivulle ja hae työpaikkoja.
            </p>
          </div>
        </div>
      </>
    );
  }

  const currentJob = jobs[selectedJob];

  // Funktio ympyräkaavion piirtämiseen
  const renderPieChart = (compatibility) => {
    const angle = (compatibility / 100) * 360;
    const largeArc = angle > 180 ? 1 : 0;

    const x1 = 125 + 100 * Math.cos((0 * Math.PI) / 180);
    const y1 = 125 + 100 * Math.sin((0 * Math.PI) / 180);
    const x2 = 125 + 100 * Math.cos((angle * Math.PI) / 180);
    const y2 = 125 + 100 * Math.sin((angle * Math.PI) / 180);

    const color = compatibility >= 80 ? "#4CAF50" : compatibility >= 70 ? "#FFC107" : "#FF6B6B";

    return (
      <svg width="250" height="250" viewBox="0 0 250 250" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.1))" }}>
        {/* Taustakehä */}
        <circle cx="125" cy="125" r="100" fill="#e0e0e0" opacity="0.3" />

        {/* Yhteensopivuuskehä */}
        <path
          d={`M 125 125 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
          fill={color}
          opacity="0.8"
        />

        {/* Keskellä oleva teksti */}
        <circle cx="125" cy="125" r="70" fill="white" />
        <text x="125" y="120" fontSize="48" fontWeight="bold" textAnchor="middle" fill={color}>
          {compatibility}%
        </text>
        <text x="125" y="145" fontSize="14" textAnchor="middle" fill="#666">
          Yhteensopivuus
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
        {/* Header */}
        <h1 style={{ marginBottom: "10px", color: "#f1f5f9", fontSize: "2.5rem" }}>Työhaut</h1>
        <p style={{ color: "#cbd5e1", marginBottom: "30px", fontSize: "1.1rem" }}>
          Haettujen työpaikkojen yhteensopivuus
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px" }}>
          {/* Vasemman puolen: Työpaikkalista */}
          <div>
            <h3 style={{ marginTop: 0, color: "#f1f5f9", fontSize: "1.3rem" }}>Haetut Työpaikat</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {jobs.map((job, index) => (
                <div
                  key={job.id}
                  style={{
                    padding: "15px",
                    backgroundColor: selectedJob === index ? "rgba(76, 99, 255, 0.3)" : "rgba(30, 41, 59, 0.6)",
                    color: "#e2e8f0",
                    borderRadius: "12px",
                    border: selectedJob === index ? "2px solid rgba(76, 99, 255, 0.5)" : "1px solid rgba(148, 163, 184, 0.2)",
                    transition: "all 0.3s",
                    position: "relative",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div
                    onClick={() => setSelectedJob(index)}
                    style={{ cursor: "pointer", paddingRight: "40px" }}
                  >
                    <h4 style={{ margin: "0 0 5px 0", fontSize: "16px", color: "#f1f5f9" }}>{job.title}</h4>
                    <p style={{ margin: "0 0 5px 0", fontSize: "13px", opacity: 0.9, color: "#cbd5e1" }}>
                      {job.company} • {job.location}
                    </p>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#7dd3fc" }}>
                      Yhteensopivuus: {job.compatibility}%
                    </div>
                    {job.recommended && (
                      <div style={{ fontSize: "12px", marginTop: "5px", color: "#4CAF50" }}>
                        Suositeltu
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeJobApplication(job.id);
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

          {/* Oikean puolen: Yksityiskohdat ja ympyräkaavio */}
          <div>
            <div style={{ backgroundColor: "rgba(30, 41, 59, 0.6)", border: "1px solid rgba(148, 163, 184, 0.2)", backdropFilter: "blur(10px)", padding: "30px", borderRadius: "16px", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
              {/* Otsikko */}
              <h2 style={{ margin: "0 0 10px 0", color: "#7dd3fc", fontSize: "1.8rem" }}>{currentJob.title}</h2>
              <p style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#cbd5e1" }}>
                <strong>{currentJob.company}</strong> • {currentJob.location}
              </p>

              {/* Ympyräkaavio */}
              <div style={{ display: "flex", justifyContent: "center", margin: "30px 0" }}>
                {renderPieChart(currentJob.compatibility)}
              </div>

              {/* Kuvaus */}
              <p style={{ color: "#cbd5e1", lineHeight: "1.6", marginBottom: "25px" }}>
                {currentJob.description}
              </p>

              {/* Taidot */}
              <div style={{ marginBottom: "25px" }}>
                <h4 style={{ marginTop: 0, marginBottom: "10px", color: "#f1f5f9" }}>Vaaditut Taidot:</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {currentJob.requiredSkills.map((skill) => {
                    const isMatched = currentJob.matchedSkills.includes(skill);
                    return (
                      <span
                        key={skill}
                        style={{
                          padding: "8px 14px",
                          backgroundColor: isMatched ? "rgba(76, 185, 68, 0.2)" : "rgba(239, 68, 68, 0.2)",
                          color: isMatched ? "#4CAF50" : "#ef4444",
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

              {/* Puuttuvat taidot */}
              {currentJob.missingSkills.length > 0 && (
                <div style={{ backgroundColor: "rgba(255, 107, 107, 0.15)", padding: "20px", borderRadius: "12px", marginBottom: "25px", borderLeft: "4px solid #ef4444", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                  <h4 style={{ marginTop: 0, marginBottom: "15px", color: "#ef4444" }}>Puuttuvat taidot:</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {currentJob.missingSkills.map((skill) => (
                      <div
                        key={skill}
                        style={{
                          padding: "10px 16px",
                          backgroundColor: "rgba(239, 68, 68, 0.2)",
                          color: "#ef4444",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          borderRadius: "10px",
                          fontSize: "14px",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                  <p style={{ margin: "15px 0 0 0", fontSize: "13px", color: "#f87171" }}>
                    Suositus: Näiden taitojen kehittäminen parantaisi yhteensopivuutta tämän työpaikan kanssa.
                  </p>
                </div>
              )}

              {/* Suositeltu työpaikka */}
              {currentJob.recommended && (
                <div style={{ backgroundColor: "rgba(76, 185, 68, 0.15)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(76, 185, 68, 0.3)" }}>
                  <h4 style={{ margin: "0 0 10px 0", color: "#4CAF50" }}>Suositeltu työpaikka sinulle</h4>
                  <p style={{ margin: 0, color: "#cbd5e1" }}>
                    Tämä paikkaisteeltosi on paras vastine sinun taidoillesi. Henkilökohtainen yhteensopivuus on{" "}
                    <strong style={{ color: "#4CAF50" }}>{currentJob.compatibility}%</strong>.
                  </p>
                </div>
              )}

              {/* Hakemusnappula - poistettu koska jo haettu */}
              {/* <button
                style={{
                  width: "100%",
                  padding: "15px",
                  marginTop: "25px",
                  backgroundColor: "#1976d2",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "#1565c0")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = "#1976d2")}
              >
                Hae tätä työpaikkaa
              </button> */}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}