import { useState } from "react";
import Navbar from "./Navbar";
import "../styles/gallery.css";

export default function ProjectGallery() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [filterTag, setFilterTag] = useState("all");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedProject, setEditedProject] = useState(null);
  const [projects, setProjects] = useState([
    {
      id: 1,
      title: "Job Matching Platform",
      category: "Full Stack",
      description:
        "Älykkäät rekrytointi- ja hakija-sovellus, joka käyttää tekoälyä kandidaatille sopivien työpaikkojen löytämiseen ja osaamisen analysointiin.",
      longDescription:
        "Tämä sovellus yhdistää Job Board -alustan, joka näyttää avoimi työpaikkailmoituksia ja kehittyneen matching-algoritmin, joka analysoi kandidaatin osaamisen ja vertaa sitä työpaikan vaatimuksiin. Sovellus käyttää LLM:iä (Large Language Models) työtaitojen automaattiseen ekstrahointiin ja portfolio-analyysiin.",
      technologies: ["React", "Node.js", "Express", "MongoDB", "LLM", "AI"],
      images: [
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop",
      ],
      video: null,
      liveDemo: null,
      github: "https://github.com/yourname/job-matching",
      status: "In Progress",
      impact: "Auttaa tekemään recruitment-prosessista tehokkaamman ja dataperusteisemman.",
    },
    {
      id: 2,
      title: "Responsiivinen Portfolio Website",
      category: "Frontend",
      description:
        "Moderni, käyttäjäystävällinen portfoliosivusto, joka näyttää projekteja, osaamista ja kokemusta.",
      longDescription:
        "Täysin responsive portfoliosivusto, jonka rakentaminen tehtiin React + Vite -yhdistelmällä. Sivustolla on dynaaminen sisällön hallinta, kaunis visuaalinen muotoilu ja saumaton käyttäjäkokemus eri laitteilla.",
      technologies: ["React", "Vite", "CSS3", "JavaScript"],
      images: [
        "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1559163499-c4c4f2d30e6f?w=800&h=600&fit=crop",
      ],
      video: null,
      liveDemo: "https://portfolio-demo.example.com",
      github: "https://github.com/yourname/portfolio",
      status: "Completed",
      impact: "Muuttaa portfolion esittämisen visuaalisemmaksi ja interaktiivisemmaksi.",
    },
    {
      id: 3,
      title: "E-Commerce Dashboard",
      category: "Full Stack",
      description:
        "Kattava hallintapaneeli, joka hallinnoi tuotteita, tilauksia ja käyttäjiä reaaliajassa.",
      longDescription:
        "Tehty Node.js/Express backendilla ja React frontendilla, tämä dashboard tarjoaa yritysten kaikki tarvitsemat analyze- ja hallintatyökalut. Reaaliaikainen päivitys Socket.io:n avulla, kaunis data-visualisointi chartien avulla.",
      technologies: ["React", "Node.js", "MongoDB", "Socket.io", "Chart.js"],
      images: [
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
      ],
      video: null,
      liveDemo: "https://ecommerce-dashboard.example.com",
      github: "https://github.com/yourname/ecommerce-dashboard",
      status: "Completed",
      impact: "Parantaa myynnin hallintaa ja asiakastyytyväisyyttä merkittävästi.",
    },
    {
      id: 4,
      title: "Mobile App UI/UX",
      category: "Design",
      description:
        "Muotoilusta korostuva mobiilisovelluksen käyttöliittymä, joka yhdistää kauneuden ja funktionaalisuuden.",
      longDescription:
        "Tässä projektissa oli keskeinen rooli muotoilulla. Luotiin houkutteleva ja intuitiivinen käyttöliittymä, joka tekee sovelluksen käytöstä miellyttävää ja tehokasta. Noudatetaan Material Design -periaatteita ja modernia väripalettiä.",
      technologies: ["Figma", "UI/UX Design", "Prototyping"],
      images: [
        "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop",
      ],
      video: null,
      liveDemo: "https://www.figma.com/file/example",
      github: null,
      status: "Completed",
      impact: "Käyttäjät raportoivat 40% paremman käytettävyyden skoorin.",
    },
    {
      id: 5,
      title: "Weather Analytics App",
      category: "Frontend",
      description:
        "Reaaliaikainen säädata-sovellus, joka näyttää kauniisti visualisoituja säätietoja.",
      longDescription:
        "Käyttää avoimen sää-API:n tietoja näyttääkseen reaaliaikaisen sääinformaatioon. Sovellus pyyytää käyttäjältä sijaintia ja näyttää seitsemän päivän ennusteet kauniissa visualisoinnissa.",
      technologies: ["React", "OpenWeather API", "Chart.js", "CSS3"],
      images: [
        "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&h=600&fit=crop",
      ],
      video: null,
      liveDemo: "https://weather-app.example.com",
      github: "https://github.com/yourname/weather-app",
      status: "Completed",
      impact: "Näyttää sään intuitiivisella tavalla, joka tekee datan ymmärtämisestä helppoa.",
    },
  ]);

  // Editoinnin hallinta
  const startEdit = (project) => {
    setEditedProject({ ...project });
    setIsEditMode(true);
  };

  const saveEdit = () => {
    setProjects(projects.map(p => p.id === editedProject.id ? editedProject : p));
    setSelectedProject(editedProject);
    setIsEditMode(false);
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setEditedProject(null);
  };

  const allTags = [
    "all",
    ...new Set(projects.flatMap((p) => p.technologies)),
  ];

  const filteredProjects =
    filterTag === "all"
      ? projects
      : projects.filter((p) => p.technologies.includes(filterTag));

  return (
    <div className="gallery-wrapper">
      <Navbar />
      <hr className="divider" />
      <div className="gallery-container">
      <div className="gallery-header">
        <h1 className="gallery-title">Projektit</h1>
        <p className="gallery-subtitle">
          Tutkimme eri teknologioita ja luomme innovatiivisia ratkaisuja
        </p>
      </div>

      {/* Filter Tags */}
      <div className="filter-section">
        <div className="filter-tags">
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`filter-btn ${filterTag === tag ? "active" : ""}`}
              onClick={() => setFilterTag(tag)}
            >
              {tag.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="projects-grid">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="project-card"
            onClick={() => setSelectedProject(project)}
          >
            <div className="project-image-container">
              <img
                src={project.images[0]}
                alt={project.title}
                className="project-image"
              />
              <div className="project-overlay">
                <div className="overlay-content">
                  <span className="project-status">{project.status}</span>
                  <button className="view-btn">Näytä Lisää</button>
                </div>
              </div>
            </div>
            <div className="project-info">
              <span className="project-category">{project.category}</span>
              <h3 className="project-title">{project.title}</h3>
              <p className="project-description">{project.description}</p>
              <div className="project-tech">
                {project.technologies.slice(0, 3).map((tech) => (
                  <span key={tech} className="tech-tag">
                    {tech}
                  </span>
                ))}
                {project.technologies.length > 3 && (
                  <span className="tech-tag more">
                    +{project.technologies.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Project Details */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={() => setSelectedProject(null)}
            >
              ✕
            </button>

            {!isEditMode && (
              <button
                className="edit-btn"
                onClick={() => startEdit(selectedProject)}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "60px",
                  padding: "10px 18px",
                  backgroundColor: "rgba(124, 211, 252, 0.2)",
                  color: "#7dd3fc",
                  border: "1px solid rgba(124, 211, 252, 0.3)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  zIndex: 1000,
                }}
              >
                ✏️ Muokkaa
              </button>
            )}

            <div className="modal-gallery">
              {(isEditMode ? editedProject.images : selectedProject.images).map((img, idx) => (
                <div key={idx} className="modal-image-wrapper" style={{ position: "relative" }}>
                  <img src={img} alt={`${isEditMode ? editedProject.title : selectedProject.title} ${idx + 1}`} />
                  {isEditMode && (
                    <button
                      onClick={() => {
                        const newImages = editedProject.images.filter((_, i) => i !== idx);
                        setEditedProject({ ...editedProject, images: newImages });
                      }}
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        background: "rgba(239, 68, 68, 0.8)",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "35px",
                        height: "35px",
                        cursor: "pointer",
                        fontSize: "18px",
                        fontWeight: "bold",
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isEditMode && (
              <div style={{ padding: "20px", backgroundColor: "rgba(76, 99, 255, 0.1)", borderRadius: "12px", marginBottom: "20px" }}>
                <h4 style={{ color: "#7dd3fc", marginTop: "0" }}>📸 Lisää tai muokkaa kuvia</h4>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", color: "#cbd5e1", marginBottom: "5px", fontSize: "0.9rem" }}>
                    Kuvan URL:
                  </label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="text"
                      id="new-image-url"
                      placeholder="Syötä kuvan URL-osoite"
                      style={{
                        flex: 1,
                        padding: "10px",
                        backgroundColor: "rgba(30, 41, 59, 0.6)",
                        border: "1px solid rgba(124, 211, 252, 0.3)",
                        borderRadius: "8px",
                        color: "#f1f5f9",
                        fontSize: "14px",
                        fontFamily: "monospace",
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById("new-image-url");
                        if (input.value.trim()) {
                          setEditedProject({
                            ...editedProject,
                            images: [...editedProject.images, input.value.trim()]
                          });
                          input.value = "";
                        }
                      }}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "rgba(76, 185, 68, 0.2)",
                        color: "#4CAF50",
                        border: "1px solid rgba(76, 185, 68, 0.3)",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "14px",
                      }}
                    >
                      + Lisää
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", color: "#cbd5e1", marginBottom: "10px", fontSize: "0.9rem" }}>
                    Nykyiset kuvat ({editedProject.images.length}):
                  </label>
                  <div style={{ maxHeight: "150px", overflowY: "auto", backgroundColor: "rgba(15, 23, 42, 0.5)", borderRadius: "6px", padding: "10px" }}>
                    {editedProject.images.map((img, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px",
                          backgroundColor: "rgba(30, 41, 59, 0.6)",
                          borderRadius: "4px",
                          marginBottom: idx < editedProject.images.length - 1 ? "8px" : "0",
                          fontSize: "12px",
                          color: "#94a3b8",
                          wordBreak: "break-all",
                        }}
                      >
                        <span>{img.substring(0, 50)}...</span>
                        <button
                          onClick={() => {
                            const newImages = editedProject.images.filter((_, i) => i !== idx);
                            setEditedProject({ ...editedProject, images: newImages });
                          }}
                          style={{
                            padding: "4px 10px",
                            backgroundColor: "rgba(239, 68, 68, 0.2)",
                            color: "#ef4444",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                            marginLeft: "10px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Poista
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="modal-body">
              <div className="modal-header">
                <h2>{isEditMode ? editedProject.title : selectedProject.title}</h2>
                <span className="modal-status">{isEditMode ? editedProject.status : selectedProject.status}</span>
              </div>

              <p className="modal-description">{isEditMode ? editedProject.longDescription : selectedProject.longDescription}</p>

              {/* Video Section with Edit */}
              <div className="video-section">
                <h3>Video Demo</h3>
                {isEditMode ? (
                  <div style={{ marginBottom: "15px" }}>
                    <input
                      type="text"
                      value={editedProject?.video || ""}
                      onChange={(e) =>
                        setEditedProject({ ...editedProject, video: e.target.value })
                      }
                      placeholder="Kirjoita YouTube embed URL (esim. https://www.youtube.com/embed/...)"
                      style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor: "rgba(30, 41, 59, 0.6)",
                        border: "1px solid rgba(124, 211, 252, 0.3)",
                        borderRadius: "8px",
                        color: "#f1f5f9",
                        fontSize: "14px",
                        fontFamily: "monospace",
                      }}
                    />
                  </div>
                ) : selectedProject?.video ? (
                  <div className="video-container">
                    <iframe
                      src={selectedProject.video}
                      title={`${selectedProject.title} demo`}
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <p style={{ color: "#94a3b8" }}>Ei videota lisätty</p>
                )}
              </div>

              {/* Live Demo Link with Edit */}
              <div className="demo-section" style={{ marginTop: "20px" }}>
                <h3>🚀 Live Demo</h3>
                {isEditMode ? (
                  <div style={{ marginBottom: "15px" }}>
                    <input
                      type="text"
                      value={editedProject?.liveDemo || ""}
                      onChange={(e) =>
                        setEditedProject({ ...editedProject, liveDemo: e.target.value })
                      }
                      placeholder="Kirjoita Live Demo URL"
                      style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor: "rgba(30, 41, 59, 0.6)",
                        border: "1px solid rgba(124, 211, 252, 0.3)",
                        borderRadius: "8px",
                        color: "#f1f5f9",
                        fontSize: "14px",
                        fontFamily: "monospace",
                      }}
                    />
                  </div>
                ) : selectedProject?.liveDemo ? (
                  <a
                    href={selectedProject.liveDemo}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      color: "#7dd3fc",
                      textDecoration: "none",
                      padding: "8px 16px",
                      backgroundColor: "rgba(124, 211, 252, 0.1)",
                      border: "1px solid rgba(124, 211, 252, 0.3)",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Avaa linkki →
                  </a>
                ) : (
                  <p style={{ color: "#94a3b8" }}>Ei live demoa</p>
                )}
              </div>

              {/* Technologies */}
              <div className="tech-section">
                <h3>Käytetyt Teknologiat</h3>
                <div className="tech-list">
                  {(isEditMode ? editedProject.technologies : selectedProject.technologies).map((tech) => (
                    <span key={tech} className="tech-badge">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Impact */}
              <div className="impact-section">
                <h3>💡 Vaikutus</h3>
                <p>{isEditMode ? editedProject.impact : selectedProject.impact}</p>
              </div>

              {/* Edit Mode Buttons */}
              {isEditMode && (
                <div
                  className="edit-actions"
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "20px",
                  }}
                >
                  <button
                    onClick={saveEdit}
                    style={{
                      flex: 1,
                      padding: "12px",
                      backgroundColor: "rgba(76, 185, 68, 0.2)",
                      color: "#4CAF50",
                      border: "1px solid rgba(76, 185, 68, 0.3)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    ✓ Tallenna Muutokset
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      flex: 1,
                      padding: "12px",
                      backgroundColor: "rgba(239, 68, 68, 0.2)",
                      color: "#ef4444",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    ✕ Peruuta
                  </button>
                </div>
              )}

              {/* Links */}
              {!isEditMode && (
                <div className="links-section">
                  {selectedProject.liveDemo && (
                    <a
                      href={selectedProject.liveDemo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-btn primary"
                    >
                      🚀 Live Demo
                    </a>
                  )}
                  {selectedProject.github && (
                    <a
                      href={selectedProject.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-btn secondary"
                    >
                      💻 GitHub
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}      </div>    </div>
  );
}