import Navbar from "../components/Navbar";
import ProjectGallery from "../components/ProjectGallery";
import { useState, useEffect } from "react";
import "../styles/portfolio.css";
import {
  availableSkills,
  createEmptyEducation,
  createEmptyExperience,
  createEmptyPortfolio,
} from "../data/portfolioTemplate";

export default function Portfolio() {
    const normalizeProfile = (rawProfile) => {
      const emptyProfile = createEmptyPortfolio();

      if (!rawProfile || typeof rawProfile !== "object") {
        return emptyProfile;
      }

      return {
        ...emptyProfile,
        ...rawProfile,
        skills: {
          ...emptyProfile.skills,
          ...(rawProfile.skills || {}),
        },
        experience: Array.isArray(rawProfile.experience)
          ? rawProfile.experience.map((item) => ({
              ...createEmptyExperience(),
              ...item,
              achievements: Array.isArray(item?.achievements)
                ? item.achievements
                : [""],
            }))
          : [],
        education: Array.isArray(rawProfile.education)
          ? rawProfile.education.map((item) => ({
              ...createEmptyEducation(),
              ...item,
              relevant: Array.isArray(item?.relevant) ? item.relevant : [""],
            }))
          : [],
        certifications: Array.isArray(rawProfile.certifications)
          ? rawProfile.certifications
          : [],
        profileSummary: {
          ...emptyProfile.profileSummary,
          ...(rawProfile.profileSummary || {}),
          whyMe: Array.isArray(rawProfile.profileSummary?.whyMe)
            ? rawProfile.profileSummary.whyMe
            : [],
          lookingFor: Array.isArray(rawProfile.profileSummary?.lookingFor)
            ? rawProfile.profileSummary.lookingFor
            : [],
        },
      };
    };

    const [activeSection, setActiveSection] = useState("profile");
    const [isEditing, setIsEditing] = useState(false);

    const [profile, setProfile] = useState(() => {
        const storedProfile = localStorage.getItem("profile");

        if (!storedProfile) {
            return createEmptyPortfolio();
        }

        try {
            return normalizeProfile(JSON.parse(storedProfile));
        } catch {
            return createEmptyPortfolio();
        };
    });

    const [selectedSkills, setSelectedSkills] = useState(profile.skills);
    const [experience, setExperience] = useState(profile.experience || []);
    const [education, setEducation] = useState(profile.education || []);
    const [certifications, setCertifications] = useState(profile.certifications || []);
    const [profileSummary, setProfileSummary] = useState(
      profile.profileSummary || createEmptyPortfolio().profileSummary
    );

    useEffect(() => {
        const updatedProfile = {
            ...profile,
            skills: selectedSkills,
            experience,
            education,
            certifications,
            profileSummary,
        };

        localStorage.setItem("profile", JSON.stringify(updatedProfile));
    }, [profile, selectedSkills, experience, education, certifications, profileSummary]);

    const parseLines = (value) =>
      value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const joinLines = (items) => (Array.isArray(items) ? items.join("\n") : "");

  return (
    <>
      <Navbar />
      <hr className="divider" />

      <div className="portfolio-page">
      <div className="portfolio-container">
        {/* Header Section */}
        <section style={{ marginBottom: "50px", backgroundColor: "rgba(30, 41, 59, 0.6)", padding: "30px", borderRadius: "16px", color: "#ffffff", border: "1px solid rgba(148, 163, 184, 0.2)" }}>
          {isEditing ? (
            <>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  backgroundColor: "transparent",
                  border: "1px solid #64b5f6",
                  borderRadius: "4px",
                  color: "#ffffff",
                  padding: "5px",
                  marginBottom: "10px",
                  width: "100%",
                }}
              />
              <input
                type="text"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                style={{
                  fontSize: "24px",
                  backgroundColor: "transparent",
                  border: "1px solid #64b5f6",
                  borderRadius: "4px",
                  color: "#64b5f6",
                  padding: "5px",
                  marginBottom: "20px",
                  width: "100%",
                }}
              />
              <textarea
                value={profile.summary}
                onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                style={{
                  fontSize: "16px",
                  lineHeight: "1.6",
                  maxWidth: "900px",
                  backgroundColor: "transparent",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  color: "#e0e0e0",
                  padding: "10px",
                  marginBottom: "20px",
                  width: "100%",
                  minHeight: "100px",
                }}
              />
              
              {/* Contact Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "20px", fontSize: "14px", color: "#f0f0f0" }}>
                <div>
                  <strong>Email:</strong>{" "}
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid #f0f0f0",
                      borderRadius: "4px",
                      color: "#f0f0f0",
                      padding: "2px 5px",
                      width: "150px",
                    }}
                  />
                </div>
                <div>
                  <strong>Puhelin:</strong>{" "}
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid #f0f0f0",
                      borderRadius: "4px",
                      color: "#f0f0f0",
                      padding: "2px 5px",
                      width: "150px",
                    }}
                  />
                </div>
                <div>
                  <strong>Sijainti:</strong>{" "}
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid #f0f0f0",
                      borderRadius: "4px",
                      color: "#f0f0f0",
                      padding: "2px 5px",
                      width: "150px",
                    }}
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
                <div style={{ gridColumn: "1 / -1" }}>
                <strong>GitHub:</strong>{" "}
                 <a
                  href={`https://github.com/${profile.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                   >
                   github.com/{profile.github}
                  </a>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ margin: "0 0 10px 0", fontSize: "32px", color: "#ffffff" }}>{profile.name}</h1>
              <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", color: "#64b5f6" }}>{profile.title}</h2>
              <p style={{ margin: "0 0 15px 0", fontSize: "16px", lineHeight: "1.6", maxWidth: "900px", color: "#e0e0e0" }}>{profile.summary}</p>
              
              {/* Contact Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "20px", fontSize: "14px", color: "#f0f0f0" }}>
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
                                          <strong>GitHub:</strong>{" "}
                                          <a
                                              href={`https://github.com/${profile.github}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                          >
                                              github.com/{profile.github}
                                          </a>
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
            {isEditing ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "30px" }}>
                {Object.entries(availableSkills).map(([category, skillsList]) => (
                  <div key={category}>
                    <h3 style={{ textTransform: "capitalize" }}>{category === "frontend" ? "Frontend" : category === "backend" ? "Backend" : category === "tools" ? "Työkalut" : "Muut Taidot"}</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                      {skillsList.map((skill) => (
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
                    {selectedSkills.backend.map((skill) => (
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
                    {selectedSkills.tools.map((skill) => (
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
                    {selectedSkills.other.map((skill) => (
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
            )}
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
                  color: "#1f2937",
                }}
              >
                {isEditing ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                      <div style={{ flex: 1, marginRight: "20px" }}>
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => {
                            const updatedExp = [...experience];
                            updatedExp[index].title = e.target.value;
                            setExperience(updatedExp);
                          }}
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            padding: "5px",
                            width: "100%",
                            marginBottom: "5px",
                          }}
                        />
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const updatedExp = [...experience];
                            updatedExp[index].company = e.target.value;
                            setExperience(updatedExp);
                          }}
                          style={{
                            fontSize: "16px",
                            color: "#0066cc",
                            fontWeight: "bold",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            padding: "5px",
                            width: "100%",
                          }}
                        />
                      </div>
                      <input
                        type="text"
                        value={exp.period}
                        onChange={(e) => {
                          const updatedExp = [...experience];
                          updatedExp[index].period = e.target.value;
                          setExperience(updatedExp);
                        }}
                        style={{
                          color: "#666",
                          fontSize: "14px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          padding: "5px",
                          width: "120px",
                        }}
                      />
                    </div>
                    <textarea
                      value={exp.description}
                      onChange={(e) => {
                        const updatedExp = [...experience];
                        updatedExp[index].description = e.target.value;
                        setExperience(updatedExp);
                      }}
                      style={{
                        color: "#666",
                        marginBottom: "15px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        padding: "10px",
                        width: "100%",
                        minHeight: "60px",
                      }}
                    />
                    <h4 style={{ marginTop: 0, marginBottom: "10px" }}>Saavutukset:</h4>
                    {exp.achievements.map((achievement, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                        <textarea
                          value={achievement}
                          onChange={(e) => {
                            const updatedExp = [...experience];
                            updatedExp[index].achievements[idx] = e.target.value;
                            setExperience(updatedExp);
                          }}
                          style={{
                            flex: 1,
                            marginBottom: "8px",
                            color: "#555",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            padding: "5px",
                            minHeight: "30px",
                          }}
                        />
                        <button
                          onClick={() => {
                            const updatedExp = [...experience];
                            updatedExp[index].achievements.splice(idx, 1);
                            setExperience(updatedExp);
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
                        const updatedExp = [...experience];
                        updatedExp[index].achievements.push("");
                        setExperience(updatedExp);
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
                  </>
                )}
              </div>
            ))}
            {isEditing && (
              <button
                onClick={() => {
                  setExperience([...experience, createEmptyExperience()]);
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
                  color: "#1f2937",
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
                            const updatedEdu = [...education];
                            updatedEdu[index].degree = e.target.value;
                            setEducation(updatedEdu);
                          }}
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            padding: "5px",
                            width: "100%",
                            marginBottom: "5px",
                          }}
                        />
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => {
                            const updatedEdu = [...education];
                            updatedEdu[index].institution = e.target.value;
                            setEducation(updatedEdu);
                          }}
                          style={{
                            fontSize: "16px",
                            color: "#666",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            padding: "5px",
                            width: "100%",
                          }}
                        />
                      </div>
                      <input
                        type="text"
                        value={edu.year}
                        onChange={(e) => {
                          const updatedEdu = [...education];
                          updatedEdu[index].year = e.target.value;
                          setEducation(updatedEdu);
                        }}
                        style={{
                          color: "#666",
                          fontSize: "14px",
                          fontWeight: "bold",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          padding: "5px",
                          width: "120px",
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
                            const updatedEdu = [...education];
                            updatedEdu[index].relevant[idx] = e.target.value;
                            setEducation(updatedEdu);
                          }}
                          style={{
                            flex: 1,
                            padding: "6px 12px",
                            backgroundColor: "#388e3c",
                            color: "#ffffff",
                            borderRadius: "16px",
                            fontSize: "13px",
                            border: "1px solid #ddd",
                            marginRight: "10px",
                          }}
                        />
                        <button
                          onClick={() => {
                            const updatedEdu = [...education];
                            updatedEdu[index].relevant.splice(idx, 1);
                            setEducation(updatedEdu);
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
                        const updatedEdu = [...education];
                        updatedEdu[index].relevant.push("");
                        setEducation(updatedEdu);
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
                  </>
                )}
              </div>
            ))}
            {isEditing && (
              <button
                onClick={() => {
                  setEducation([...education, createEmptyEducation()]);
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
                    <input
                      type="text"
                      value={cert}
                      onChange={(e) => {
                        const updatedCerts = [...certifications];
                        updatedCerts[index] = e.target.value;
                        setCertifications(updatedCerts);
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
                        const updatedCerts = [...certifications];
                        updatedCerts.splice(index, 1);
                        setCertifications(updatedCerts);
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
                  onClick={() => setCertifications([...certifications, ""])}
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
                  <h3 style={{ color: "#1565c0", marginTop: 0 }}>Miksi minut?</h3>
                  <textarea
                    value={joinLines(profileSummary.whyMe)}
                    onChange={(e) =>
                      setProfileSummary({
                        ...profileSummary,
                        whyMe: parseLines(e.target.value),
                      })
                    }
                    style={{
                      lineHeight: "1.8",
                      color: "#1a237e",
                      border: "1px solid #ddd",
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
                    value={joinLines(profileSummary.lookingFor)}
                    onChange={(e) =>
                      setProfileSummary({
                        ...profileSummary,
                        lookingFor: parseLines(e.target.value),
                      })
                    }
                    style={{
                      lineHeight: "1.8",
                      color: "#1b5e20",
                      border: "1px solid #ddd",
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
                  <h3 style={{ color: "#1565c0" }}>Miksi minut?</h3>
                  {profileSummary.whyMe.length > 0 ? (
                    <ul style={{ paddingLeft: "20px", lineHeight: "1.8", color: "#1a237e" }}>
                      {profileSummary.whyMe.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: "#1a237e", margin: 0 }}>Ei lisattya sisaltoa viela.</p>
                  )}
                </div>

                <div style={{ backgroundColor: "#e8f5e9", padding: "25px", borderRadius: "8px" }}>
                  <h3 style={{ color: "#1b5e20" }}>Mitä etsin?</h3>
                  {profileSummary.lookingFor.length > 0 ? (
                    <ul style={{ paddingLeft: "20px", lineHeight: "1.8", color: "#1b5e20" }}>
                      {profileSummary.lookingFor.map((item, idx) => (
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

        {/* Projects Gallery */}
        {activeSection === "projects" && (
          <ProjectGallery />
        )}

        {/* Call to Action */}
        <section style={{ marginTop: "50px", paddingTop: "30px", borderTop: "2px solid #eee", textAlign: "center", backgroundColor: "#f0f7ff", padding: "30px", borderRadius: "8px", color: "#1f2937" }}>
          <h2 style={{ color: "#1f2937" }}>Kiinnostunut Yhteistyöstä?</h2>
          <p style={{ fontSize: "16px", color: "#555", marginBottom: "25px" }}>
            Ota minuun yhteyttä uusista mahdollisuuksista tai kyselyistä!
          </p>
          <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href={profile.email ? `mailto:${profile.email}` : "#"}
              style={{
                padding: "12px 30px",
                backgroundColor: "#0066cc",
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
                backgroundColor: "#333",
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
    </>
  );
}