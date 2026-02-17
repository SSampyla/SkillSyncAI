import Navbar from "../components/Navbar";
import { useState } from "react";
import "../styles/portfolio.css";

export default function Jobs() {
  const [selectedJob, setSelectedJob] = useState(0);

  // Esimerkkityöpaikat
  const jobs = [
    {
      id: 1,
      title: "Frontend Developer",
      company: "TechCorp Oy",
      location: "Helsinki",
      compatibility: 88,
      recommended: true,
      description: "React-pohjaisen web-sovelluksen kehitys",
      requiredSkills: ["React", "JavaScript", "CSS", "HTML"],
      matchedSkills: ["React", "JavaScript", "CSS", "HTML"],
      missingSkills: [],
    },
    {
      id: 2,
      title: "Full Stack Developer",
      company: "StartupXYZ",
      location: "Tampere",
      compatibility: 75,
      recommended: false,
      description: "Full-stack sovelluskehitys Node.js ja React:lla",
      requiredSkills: ["React", "Node.js", "PostgreSQL", "Docker"],
      matchedSkills: ["React", "Node.js"],
      missingSkills: ["PostgreSQL", "Docker"],
    },
    {
      id: 3,
      title: "Backend Developer",
      company: "DataSystems Ltd",
      location: "Oulu",
      compatibility: 68,
      recommended: false,
      description: "REST API:iden kehitys Node.js:llä",
      requiredSkills: ["Node.js", "Express", "MongoDB", "REST APIs"],
      matchedSkills: ["Node.js", "Express", "REST APIs"],
      missingSkills: ["MongoDB"],
    },
  ];

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

      <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <h1 style={{ marginBottom: "10px" }}>Työhaut</h1>
        <p style={{ color: "#666", marginBottom: "30px" }}>
          Työpaikkojen yhteensopivuus
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px" }}>
          {/* Vasemman puolen: Työpaikkalista */}
          <div>
            <h3 style={{ marginTop: 0 }}>Haetut Työpaikat</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {jobs.map((job, index) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(index)}
                  style={{
                    padding: "15px",
                    backgroundColor: selectedJob === index ? "#1976d2" : "#f5f5f5",
                    color: selectedJob === index ? "#ffffff" : "#333",
                    borderRadius: "6px",
                    cursor: "pointer",
                    border: selectedJob === index ? "2px solid #0d47a1" : "1px solid #ddd",
                    transition: "all 0.3s",
                  }}
                >
                  <h4 style={{ margin: "0 0 5px 0", fontSize: "16px" }}>{job.title}</h4>
                  <p style={{ margin: "0 0 5px 0", fontSize: "13px", opacity: 0.9 }}>
                    {job.company} • {job.location}
                  </p>
                  <div style={{ fontSize: "12px", fontWeight: "bold" }}>
                    Yhteensopivuus: {job.compatibility}%
                  </div>
                  {job.recommended && (
                    <div style={{ fontSize: "12px", marginTop: "5px", color: selectedJob === index ? "#ffeb3b" : "#4CAF50" }}>
                      ⭐ Suositeltu
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Oikean puolen: Yksityiskohdat ja ympyräkaavio */}
          <div>
            <div style={{ backgroundColor: "#ffffff", padding: "30px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              {/* Otsikko */}
              <h2 style={{ margin: "0 0 10px 0", color: "#1976d2" }}>{currentJob.title}</h2>
              <p style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#666" }}>
                <strong>{currentJob.company}</strong> • {currentJob.location}
              </p>

              {/* Ympyräkaavio */}
              <div style={{ display: "flex", justifyContent: "center", margin: "30px 0" }}>
                {renderPieChart(currentJob.compatibility)}
              </div>

              {/* Kuvaus */}
              <p style={{ color: "#555", lineHeight: "1.6", marginBottom: "25px" }}>
                {currentJob.description}
              </p>

              {/* Taidot */}
              <div style={{ marginBottom: "25px" }}>
                <h4 style={{ marginTop: 0, marginBottom: "10px" }}>Vaaditut Taidot:</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {currentJob.requiredSkills.map((skill) => {
                    const isMatched = currentJob.matchedSkills.includes(skill);
                    return (
                      <span
                        key={skill}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: isMatched ? "#4CAF50" : "#ffcdd2",
                          color: isMatched ? "#ffffff" : "#c62828",
                          borderRadius: "16px",
                          fontSize: "13px",
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

              {/* Puuttuvat taidot */}
              {currentJob.missingSkills.length > 0 && (
                <div style={{ backgroundColor: "#fff3cd", padding: "20px", borderRadius: "6px", marginBottom: "25px", borderLeft: "4px solid #ff6b6b" }}>
                  <h4 style={{ marginTop: 0, marginBottom: "15px", color: "#c62828" }}>⚠️ Puuttuvat taidot:</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {currentJob.missingSkills.map((skill) => (
                      <div
                        key={skill}
                        style={{
                          padding: "10px 16px",
                          backgroundColor: "#ffcdd2",
                          color: "#c62828",
                          borderRadius: "16px",
                          fontSize: "14px",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>❌</span>
                        {skill}
                      </div>
                    ))}
                  </div>
                  <p style={{ margin: "15px 0 0 0", fontSize: "13px", color: "#8b6914" }}>
                    💡 Suositus: Näiden taitojen kehittäminen parantaisi yhteensopivuutta tämän työpaikan kanssa.
                  </p>
                </div>
              )}

              {/* Suositeltu työpaikka */}
              {currentJob.recommended && (
                <div style={{ backgroundColor: "#f0fdf4", padding: "20px", borderRadius: "6px", border: "2px solid #4CAF50" }}>
                  <h4 style={{ margin: "0 0 10px 0", color: "#2d5016" }}>✨ Suositeltu työpaikka sinulle</h4>
                  <p style={{ margin: 0, color: "#555" }}>
                    Tämä paikkaisteeltosi on paras vastine sinun taidoillesi. Henkilökohtainen yhteensopivuus on{" "}
                    <strong style={{ color: "#4CAF50" }}>{currentJob.compatibility}%</strong>.
                  </p>
                </div>
              )}

              {/* Hakemusnappula */}
              <button
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
                📝 Hae tätä työpaikkaa
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}