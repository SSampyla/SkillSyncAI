import Navbar from "../components/Navbar";
import { useState } from "react";
import "../styles/portfolio.css";

export default function Portfolio() {
  const [activeSection, setActiveSection] = useState("profile");

  const profile = {
    name: "Ohjelmistokehittäjä",
    title: "Full Stack Developer",
    email: "developer@example.com",
    phone: "+358 00 000 000",
    location: "Helsinki, Finland",
    summary:
      "Motivoitunut ja oppimisorientoitunut full-stack web-sovelluskehittäjä, jolla on vahva perusta React- ja Node.js-teknologioissa. Kiinnostunut luomaan käyttäjäystävällisiä ja tehokkaita sovelluksia. Aktiivisesti hakee uusia haasteita ja oppimismahdollisuuksia.",
  };

  const skills = {
    frontend: ["React.js", "JavaScript (ES6+)", "HTML5", "CSS3", "Vite", "ESLint", "Responsive Design"],
    backend: ["Node.js", "Express.js", "REST APIs", "API Design", "JavaScript"],
    tools: ["Git", "GitHub", "VS Code", "npm", "JSON", "Postman"],
    other: ["Problem Solving", "Team Collaboration", "Self-learning", "Agile Methodology"],
  };

  const experience = [
    {
      title: "Full Stack Development Project",
      company: "Job Matching Application",
      period: "2025-2026",
      description:
        "Kehitin täyden pinon sovellusta, joka käyttää AI:ta kandidaatin ja työpaikan yhteensopivuuden analysointiin.",
      achievements: [
        "React-pohjaisen frontend-sovelluksen kehitys ja toteutus",
        "Node.js/Express backend API:n rakentaminen",
        "LLM-integraatio työtaitojen hakemiseksi",
        "Tietokannan suunnittelu ja Postman-testaus",
      ],
    },
    {
      title: "Portfolio Website",
      company: "Personal Project",
      period: "2025-2026",
      description: "Luoin modernin ja responsiivisen portfoliosivuston, joka esittelee taidot ja projektit.",
      achievements: [
        "React + Vite toteutetun responsiivisen sivuston rakentaminen",
        "React Router -pohjaisen navigaation toteutus",
        "CSS + inline styles styling",
        "Käyttäjäystävällisen käyttöliittymän suunnittelu",
      ],
    },
  ];

  const education = [
    {
      degree: "Ohjelmistotuotanto",
      institution: "Savonia-ammattikorkeakoulu",
      year: "2024-2026",
      relevant: ["Web-sovelluskehitys", "Full Stack -perusteet", "Ohjelmistoarkkitehtuuri", "Tiimityöskentely"],
    },
  ];

  const certifications = ["JavaScript", "React Basics", "Agile Development"];

  return (
    <>
      <Navbar />
      <hr className="divider" />

      <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header Section */}
        <section style={{ marginBottom: "50px", backgroundColor: "#1e3a5f", padding: "30px", borderRadius: "8px", color: "#ffffff" }}>
          <h1 style={{ margin: "0 0 10px 0", fontSize: "32px", color: "#ffffff" }}>{profile.name}</h1>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", color: "#64b5f6" }}>{profile.title}</h2>
          <p style={{ margin: "0 0 15px 0", fontSize: "16px", lineHeight: "1.6", maxWidth: "900px", color: "#e0e0e0" }}>{profile.summary}</p>
          
          {/* Contact Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "20px", fontSize: "14px", color: "#f0f0f0" }}>
            <div>
              <strong>📧 Email:</strong> {profile.email}
            </div>
            <div>
              <strong>📱 Puhelin:</strong> {profile.phone}
            </div>
            <div>
              <strong>📍 Sijainti:</strong> {profile.location}
            </div>
            <div>
              <strong>🔗 LinkedIn:</strong> linkedin.com/in/developer
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <strong>GitHub:</strong> github.com/developer
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "30px", flexWrap: "wrap" }}>
          {["profile", "skills", "experience", "education"].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              style={{
                padding: "12px 24px",
                backgroundColor: activeSection === section ? "#0066cc" : "#f0f0f0",
                color: activeSection === section ? "white" : "#333",
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
                : "Koulutus"}
            </button>
          ))}
        </div>

        {/* Skills Section */}
        {activeSection === "skills" && (
          <section style={{ marginBottom: "50px" }}>
            <h2>Tekniset Taidot</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "30px" }}>
              <div>
                <h3>Frontend</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {skills.frontend.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#1976d2",
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
                  {skills.backend.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#7b1fa2",
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
                  {skills.tools.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#388e3c",
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
                  {skills.other.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#f57c04",
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
          </section>
        )}

        {/* Experience Section */}
        {activeSection === "experience" && (
          <section style={{ marginBottom: "50px" }}>
            <h2>Työkokemus & Projektit</h2>
            {experience.map((exp, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "30px",
                  padding: "25px",
                  border: "1px solid #ddd",
                  borderLeft: "4px solid #0066cc",
                  borderRadius: "6px",
                  backgroundColor: "#ffffff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 5px 0" }}>{exp.title}</h3>
                    <p style={{ margin: 0, color: "#0066cc", fontWeight: "bold" }}>{exp.company}</p>
                  </div>
                  <span style={{ color: "#666", fontSize: "14px" }}>{exp.period}</span>
                </div>
                <p style={{ color: "#666", marginBottom: "15px" }}>{exp.description}</p>
                <h4 style={{ marginTop: 0, marginBottom: "10px" }}>Saavutukset:</h4>
                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                  {exp.achievements.map((achievement, idx) => (
                    <li key={idx} style={{ marginBottom: "8px", color: "#555" }}>
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {/* Education Section */}
        {activeSection === "education" && (
          <section style={{ marginBottom: "50px" }}>
            <h2>Koulutus</h2>
            {education.map((edu, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "30px",
                  padding: "25px",
                  border: "1px solid #ddd",
                  borderLeft: "4px solid #4CAF50",
                  borderRadius: "6px",
                  backgroundColor: "#ffffff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 5px 0" }}>{edu.degree}</h3>
                    <p style={{ margin: 0, color: "#666" }}>{edu.institution}</p>
                  </div>
                  <span style={{ color: "#666", fontSize: "14px", fontWeight: "bold" }}>{edu.year}</span>
                </div>
                <h4 style={{ marginTop: 0, marginBottom: "10px" }}>Relevantit Kurssit:</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {edu.relevant.map((course, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#388e3c",
                        color: "#ffffff",
                        borderRadius: "16px",
                        fontSize: "13px",
                      }}
                    >
                      {course}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <h2>Sertifikaatit & Koulutukset</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
              {certifications.map((cert, index) => (
                <div
                  key={index}
                  style={{
                    padding: "15px 20px",
                    backgroundColor: "#f57c04",
                    border: "1px solid #f57c04",
                    borderRadius: "6px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: "bold", color: "#ffffff" }}>✓ {cert}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Profile Section (Default) */}
        {activeSection === "profile" && (
          <section style={{ marginBottom: "50px" }}>
            <h2>Profiilin Yhteenveto</h2>
            <div style={{ backgroundColor: "#e3f2fd", padding: "25px", borderRadius: "8px", marginBottom: "30px" }}>
              <h3 style={{ color: "#1565c0" }}>Miksi minut?</h3>
              <ul style={{ paddingLeft: "20px", lineHeight: "1.8", color: "#1a237e" }}>
                <li>✓ Vahva perusta kaikkiin web-kehityksen aspekteihin</li>
                <li>✓ Kokemus täyden pinon (full-stack) sovelluskehityksestä</li>
                <li>✓ Innokas oppija ja uudistaa omaa osaamistaan jatkuvasti</li>
                <li>✓ Kyky ratkaista hankalia ongelmia systemaattisesti</li>
                <li>✓ Hyvät tiimityötaidot ja kommunikaatiokyky</li>
              </ul>
            </div>

            <div style={{ backgroundColor: "#e8f5e9", padding: "25px", borderRadius: "8px" }}>
              <h3 style={{ color: "#1b5e20" }}>Mitä etsin?</h3>
              <ul style={{ paddingLeft: "20px", lineHeight: "1.8", color: "#1b5e20" }}>
                <li>📌 Junior/Mid-level kehittäjän positio</li>
                <li>📌 Mahdollisuus kasvaa ja kehittyä ammatillisesti</li>
                <li>📌 Oppia kokeneemmilta kehittäjiltä</li>
                <li>📌 Osallistua mielenkiintoisiin projekteihin</li>
                <li>📌 Toimiva tiimi, jossa arvostetaan hyvää koodia</li>
              </ul>
            </div>
          </section>
        )}

        {/* Call to Action */}
        <section style={{ marginTop: "50px", paddingTop: "30px", borderTop: "2px solid #eee", textAlign: "center", backgroundColor: "#f0f7ff", padding: "30px", borderRadius: "8px" }}>
          <h2>Kiinnostunut Yhteistyöstä?</h2>
          <p style={{ fontSize: "16px", color: "#555", marginBottom: "25px" }}>
            Ota minuun yhteyttä uusista mahdollisuuksista tai kyselyistä!
          </p>
          <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="mailto:developer@example.com"
              style={{
                padding: "12px 30px",
                backgroundColor: "#0066cc",
                color: "white",
                textDecoration: "none",
                borderRadius: "6px",
                fontWeight: "bold",
              }}
            >
              📧 Lähetä Sähköposti
            </a>
            <a
              href="https://linkedin.com/in/developer"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "12px 30px",
                backgroundColor: "#0077B5",
                color: "white",
                textDecoration: "none",
                borderRadius: "6px",
                fontWeight: "bold",
              }}
            >
              💼 LinkedIn
            </a>
            <a
              href="https://github.com/developer"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "12px 30px",
                backgroundColor: "#333",
                color: "white",
                textDecoration: "none",
                borderRadius: "6px",
                fontWeight: "bold",
              }}
            >
              🔗 GitHub
            </a>
          </div>
        </section>
      </div>
    </>
  );
}