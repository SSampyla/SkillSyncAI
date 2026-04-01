import { useMemo, useState, } from "react";
import Navbar from "./Navbar";
import "../styles/gallery.css";
import { usePortfolioProjects } from "../hooks/useDatabase";
import { usePortfolio } from "../hooks/useDatabase";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop";

const parseTechnologies = (value) =>
  value
    .split(",")
    .map((tech) => tech.trim())
        .filter(Boolean);



const normalizeTechnologies = (tech) => {
    if (!tech) return [];

    if (Array.isArray(tech)) return tech;

    if (typeof tech === "string") {
        return tech.split(",").map(t => t.trim()).filter(Boolean);
    }

    return [];
};

const createEmptyProject = () => ({
  title: "Uusi projekti",
  category: "Full Stack",
  description: "Lyhyt kuvaus projektista.",
  longDescription: "Kirjoita tähän tarkempi projektikuvaus.",
  technologies: ["React"],
  images: [PLACEHOLDER_IMAGE],
  video: "",
  liveDemo: "",
  github: "",
  status: "In Progress",
  impact: "Kuvaa projektin vaikutus yhdellä tai kahdella lauseella.",
});





export default function ProjectGallery() {

    const { portfolio, loading: profileLoading } = usePortfolio();

    const {
        projects,
        loading,
        saving,
        error,
        createProject,
        updateProject,
        deleteProject
    } = usePortfolioProjects();

    const safeProjects = projects || [];
  

    // TAGIT
    const allTags = [
        "all",
        ...new Set(safeProjects.flatMap(p => normalizeTechnologies(p.technologies)))
    ];

    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [filterTag, setFilterTag] = useState("all");
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedProject, setEditedProject] = useState(null);
    const [newImageUrl, setNewImageUrl] = useState("");
    const [savingProject, setSavingProject] = useState(false);
    const [deletingProject, setDeletingProject] = useState(false);

    const selectedProject = useMemo(
        () => projects.find((project) => project.id === selectedProjectId) || null,
        [projects, selectedProjectId]
    );

    const hasProfile =
        portfolio?.name?.trim() &&
        portfolio?.email?.trim();

    if (profileLoading) return null;


    const closeModal = () => {
        setSelectedProjectId(null);
        setIsEditMode(false);
        setEditedProject(null);
        setNewImageUrl("");
    };

    const openProject = (project) => {
        setSelectedProjectId(project.id);
        setIsEditMode(false);
        setEditedProject(null);
        setNewImageUrl("");
    };

    const startEdit = (project) => {
        setEditedProject({
            ...project,
            technologies: normalizeTechnologies(project.technologies),
            images: [...project.images],
            video: project.video || "",
            liveDemo: project.liveDemo || "",
            github: project.github || "",
        });
        setNewImageUrl("");
        setIsEditMode(true);
    };



    const saveEdit = async () => {
      const normalizedProject = {
        ...editedProject,
        technologies: Array.isArray(editedProject.technologies)
          ? editedProject.technologies.filter(Boolean)
          : parseTechnologies(editedProject.technologies),
        images:
          editedProject.images.length > 0
            ? editedProject.images.filter(Boolean)
            : [PLACEHOLDER_IMAGE],
      };

      setSavingProject(true);
      try {
        if (!normalizedProject.id) {
          // Uusi projekti, luodaan vasta nyt
          const newProject = await createProject(normalizedProject);
          // Jos hook ei päivitä automaattisesti, lisätään manuaalisesti:
          // setProjects(prev => [newProject, ...prev]);
        } else {
          await updateProject(normalizedProject.id, normalizedProject);
        }
        setIsEditMode(false);
        setEditedProject(null);
        setNewImageUrl("");
      } catch {
        alert("Tallennus epäonnistui");
      } finally {
        setSavingProject(false);
      }
    };

    const cancelEdit = () => {
        setIsEditMode(false);
        setEditedProject(null);
        setNewImageUrl("");
    };


    // Uusi projekti: avaa vain muokkauslomake, ei lisää vielä galleriaan
    const addNewProject = () => {
      setEditedProject(createEmptyProject());
      setIsEditMode(true);
      setSelectedProjectId(null);
      setNewImageUrl("");
    };


    const handleDeleteProject = async (projectId) => {
      const projectToDelete = projects.find((p) => p.id === projectId);
      if (!projectToDelete) return;

      const shouldDelete = window.confirm(
        `Poistetaanko projekti "${projectToDelete.title}" pysyvästi?`
      );
      if (!shouldDelete) return;

      setDeletingProject(true);
      try {
        await deleteProject(projectId);
        closeModal();
      } catch {
        alert("Poisto epäonnistui");
      } finally {
        setDeletingProject(false);
      }
    };

    const addImageToEditedProject = () => {
        const trimmedUrl = newImageUrl.trim();
        if (!trimmedUrl || !editedProject) return;

        setEditedProject((prev) => ({
            ...prev,
            images: [...prev.images, trimmedUrl],
        }));
        setNewImageUrl("");
    };

    const removeImageFromEditedProject = (imageIndex) => {
        if (!editedProject) return;

        const nextImages = editedProject.images.filter((_, idx) => idx !== imageIndex);
        setEditedProject((prev) => ({
            ...prev,
            images: nextImages.length > 0 ? nextImages : [PLACEHOLDER_IMAGE],
        }));
    };
 
    const uniqueProjects = Array.from(
        new Map(
            safeProjects.map(p => [
                (p.title || "").trim().toLowerCase(),
                p
            ])
        ).values()
    );

    const filteredProjects =
        filterTag === "all"
            ? uniqueProjects
            : uniqueProjects.filter((p) =>
                normalizeTechnologies(p.technologies).some(
                    (t) => t.toLowerCase() === filterTag.toLowerCase()
                )
            );

    if (!hasProfile) {
        return (
            <>
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
    

    return (
      <div className="gallery-wrapper">
        <Navbar />
        <hr className="divider" />
        <div className="gallery-container">
        <div className="gallery-header">
          <div className="gallery-header-text">
            <h1 className="gallery-title">Projektit</h1>
            <p className="gallery-subtitle">
              Tutkimme eri teknologioita ja luomme innovatiivisia ratkaisuja
            </p>
          </div>
          <button className="add-project-btn" onClick={addNewProject} disabled={saving}>
            + Lisää uusi projekti
          </button>
        </div>

        {loading && <div style={{ padding: "20px", color: "var(--text-secondary)" }}>Ladataan projekteja...</div>}
        {error && <div style={{ padding: "10px", color: "var(--color-error, #dc3545)" }}>Virhe: {error}</div>}

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

                    {!loading && safeProjects.length === 0 && (
                        <div style={{ padding: "40px", textAlign: "center" }}>
                            <h2>Ei projekteja</h2>
                            <p>Luo ensimmäinen projekti.</p>
                        </div>
                    )}


        {/* Projects Grid */}
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => openProject(project)}
            >
              <div className="project-image-container">
                <img
                  src={project.images[0] || PLACEHOLDER_IMAGE}
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
                          {normalizeTechnologies(project.technologies)
                              .slice(0, 3)
                              .map((tech) => (
                    <span key={tech} className="tech-tag">{tech}</span>
                  ))}
                          {normalizeTechnologies(project.technologies).length > 3 && (
                              <span className="tech-tag more">
                                  +{normalizeTechnologies(project.technologies).length - 3}
                              </span>
                          )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal for Project Details OR New Project Edit */}
        {(selectedProject || (isEditMode && editedProject)) && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={closeModal}>X</button>

              {/* Näytä muokkausnapit vain jos katsotaan olemassaolevaa projektia */}
              {!isEditMode && selectedProject && (
                <div className="modal-top-actions">
                  <button
                    className="edit-btn"
                    onClick={() => startEdit(selectedProject)}
                    style={{
                      padding: "10px 18px",
                      backgroundColor: "rgba(40, 61, 168, 0.16)",
                      color: "var(--color-primary)",
                      border: "1px solid rgba(40, 61, 168, 0.24)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    Muokkaa
                  </button>
                  <button
                    className="delete-project-btn"
                    onClick={() => handleDeleteProject(selectedProject.id)}
                  >
                    Poista projekti
                  </button>
                </div>
              )}

              <div className="modal-gallery">
                {(isEditMode ? editedProject.images : selectedProject?.images || []).map((img, idx) => (
                  <div key={idx} className="modal-image-wrapper" style={{ position: "relative" }}>
                    <img src={img} alt={`${isEditMode ? editedProject.title : selectedProject?.title} ${idx + 1}`} />
                    {isEditMode && (
                      <button
                        onClick={() => removeImageFromEditedProject(idx)}
                        style={{
                          position: "absolute", top: "10px", right: "10px",
                          background: "rgba(239, 68, 68, 0.8)", color: "white",
                          border: "none", borderRadius: "50%", width: "35px",
                          height: "35px", cursor: "pointer", fontSize: "18px", fontWeight: "bold",
                        }}
                      >X</button>
                    )}
                  </div>
                ))}
              </div>

              {isEditMode && (
                <div style={{ padding: "20px", backgroundColor: "rgba(40, 61, 168, 0.10)", borderRadius: "12px", marginBottom: "20px" }}>
                  <h4 style={{ color: "var(--color-primary)", marginTop: "0" }}>Lisää tai muokkaa kuvia</h4>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", color: "var(--text-secondary)", marginBottom: "5px", fontSize: "0.9rem" }}>
                      Kuvan URL:
                    </label>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input
                        type="text"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Syötä kuvan URL-osoite"
                        style={{
                          flex: 1, padding: "10px", backgroundColor: "var(--surface-glass)",
                          border: "1px solid rgba(40, 61, 168, 0.24)", borderRadius: "8px",
                          color: "var(--text-primary)", fontSize: "14px", fontFamily: "monospace",
                        }}
                      />
                      <button
                        onClick={addImageToEditedProject}
                        style={{
                          padding: "10px 20px", backgroundColor: "rgba(76, 185, 68, 0.2)",
                          color: "var(--color-success)", border: "1px solid rgba(76, 185, 68, 0.3)",
                          borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px",
                        }}
                      >+ Lisää</button>
                    </div>
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", color: "var(--text-secondary)", marginBottom: "10px", fontSize: "0.9rem" }}>
                      Nykyiset kuvat ({editedProject.images.length}):
                    </label>
                    <div style={{ maxHeight: "150px", overflowY: "auto", backgroundColor: "var(--surface-input-soft)", borderRadius: "6px", padding: "10px" }}>
                      {editedProject.images.map((img, idx) => (
                        <div key={idx} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "8px", backgroundColor: "var(--surface-glass)", borderRadius: "4px",
                          marginBottom: idx < editedProject.images.length - 1 ? "8px" : "0",
                          fontSize: "12px", color: "var(--text-muted)", wordBreak: "break-all",
                        }}>
                          <span>{img.substring(0, 50)}...</span>
                          <button
                            onClick={() => removeImageFromEditedProject(idx)}
                            style={{
                              padding: "4px 10px", backgroundColor: "rgba(239, 68, 68, 0.2)",
                              color: "#ef4444", border: "none", borderRadius: "4px", cursor: "pointer",
                              fontSize: "12px", fontWeight: "600", marginLeft: "10px", whiteSpace: "nowrap",
                            }}
                          >Poista</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-body">
                <div className="modal-header">
                  {isEditMode ? (
                    <div style={{ width: "100%", display: "grid", gap: "10px" }}>
                      <input
                        type="text"
                        value={editedProject.title}
                        onChange={(e) => setEditedProject({ ...editedProject, title: e.target.value })}
                        placeholder="Projektin nimi"
                        style={{
                          width: "100%", padding: "10px", backgroundColor: "var(--surface-glass)",
                          border: "1px solid rgba(40, 61, 168, 0.24)", borderRadius: "8px",
                          color: "var(--text-primary)", fontSize: "20px", fontWeight: "700",
                        }}
                      />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <input
                          type="text"
                          value={editedProject.category}
                          onChange={(e) => setEditedProject({ ...editedProject, category: e.target.value })}
                          placeholder="Kategoria"
                          style={{
                            width: "100%", padding: "10px", backgroundColor: "var(--surface-glass)",
                            border: "1px solid rgba(40, 61, 168, 0.24)", borderRadius: "8px",
                            color: "var(--text-primary)", fontSize: "14px",
                          }}
                        />
                        <input
                          type="text"
                          value={editedProject.status}
                          onChange={(e) => setEditedProject({ ...editedProject, status: e.target.value })}
                          placeholder="Status"
                          style={{
                            width: "100%", padding: "10px", backgroundColor: "var(--surface-glass)",
                            border: "1px solid rgba(40, 61, 168, 0.24)", borderRadius: "8px",
                            color: "var(--text-primary)", fontSize: "14px",
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2>{selectedProject.title}</h2>
                      <span className="modal-status">{selectedProject.status}</span>
                    </>
                  )}
                </div>

                {isEditMode ? (
                  <div style={{ display: "grid", gap: "10px", marginBottom: "20px" }}>
                    <textarea
                      value={editedProject.description}
                      onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                      placeholder="Lyhyt kuvaus"
                      style={{
                        width: "100%", minHeight: "72px", padding: "10px",
                        backgroundColor: "var(--surface-glass)", border: "1px solid rgba(40, 61, 168, 0.24)",
                        borderRadius: "8px", color: "var(--text-primary)", fontSize: "14px", lineHeight: "1.4",
                      }}
                    />
                    <textarea
                      value={editedProject.longDescription}
                      onChange={(e) => setEditedProject({ ...editedProject, longDescription: e.target.value })}
                      placeholder="Pitkä kuvaus"
                      style={{
                        width: "100%", minHeight: "120px", padding: "10px",
                        backgroundColor: "var(--surface-glass)", border: "1px solid rgba(40, 61, 168, 0.24)",
                        borderRadius: "8px", color: "var(--text-primary)", fontSize: "14px", lineHeight: "1.5",
                      }}
                    />
                  </div>
                ) : (
                  <p className="modal-description">{selectedProject.longDescription}</p>
                )}

                <div className="video-section">
                  <h3>Video Demo</h3>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedProject?.video || ""}
                      onChange={(e) => setEditedProject({ ...editedProject, video: e.target.value })}
                      placeholder="YouTube-linkki (https://www.youtube.com/watch?v=...)"
                      style={{
                        width: "100%", padding: "10px", backgroundColor: "var(--surface-glass)",
                        border: "1px solid rgba(40, 61, 168, 0.24)", borderRadius: "8px",
                        color: "var(--text-primary)", fontSize: "14px", fontFamily: "monospace",
                      }}
                    />
                  ) : selectedProject?.video ? (
                    <a
                      href={selectedProject.video}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "8px",
                        padding: "10px 20px", backgroundColor: "#ff0000",
                        color: "#fff", borderRadius: "8px", textDecoration: "none",
                        fontWeight: "600", fontSize: "15px",
                      }}
                    >
                      ▶ Katso video YouTubessa
                    </a>
                  ) : (
                    <p style={{ color: "var(--text-muted)" }}>Ei videota lisätty</p>
                  )}
                </div>

                <div className="demo-section" style={{ marginTop: "20px" }}>
                  <h3>Live Demo</h3>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedProject?.liveDemo || ""}
                      onChange={(e) => setEditedProject({ ...editedProject, liveDemo: e.target.value })}
                      placeholder="Live Demo URL"
                      style={{
                        width: "100%", padding: "10px", backgroundColor: "var(--surface-glass)",
                        border: "1px solid rgba(40, 61, 168, 0.24)", borderRadius: "8px",
                        color: "var(--text-primary)", fontSize: "14px", fontFamily: "monospace",
                      }}
                    />
                  ) : selectedProject?.liveDemo ? (
                    <a href={selectedProject.liveDemo} target="_blank" rel="noopener noreferrer"
                      style={{
                        display: "inline-block", color: "var(--color-primary)", textDecoration: "none",
                        padding: "8px 16px", backgroundColor: "rgba(40, 61, 168, 0.1)",
                        border: "1px solid rgba(40, 61, 168, 0.24)", borderRadius: "8px",
                        fontSize: "14px", fontWeight: "500",
                      }}
                    >Avaa linkki →</a>
                  ) : (
                    <p style={{ color: "var(--text-muted)" }}>Ei live demoa</p>
                  )}
                </div>

                <div className="tech-section">
                  <h3>Käytetyt Teknologiat</h3>
                  {isEditMode ? (
                    <div>
                      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                        <input
                          type="text"
                          value={editedProject.newTech || ""}
                          onChange={e => setEditedProject({ ...editedProject, newTech: e.target.value })}
                          placeholder="Lisää teknologia"
                          style={{ flex: 1, padding: "10px", backgroundColor: "var(--surface-glass)", border: "1px solid rgba(40, 61, 168, 0.24)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "14px" }}
                          onKeyDown={e => {
                            if (e.key === "Enter" && editedProject.newTech?.trim()) {
                              const tech = editedProject.newTech.trim();
                              const alreadyExists = editedProject.technologies.some(
                                t => t.toLowerCase() === tech.toLowerCase()
                              );
                              if (!alreadyExists) {
                                setEditedProject(prev => ({ ...prev, technologies: [...prev.technologies, tech], newTech: "" }));
                              } else {
                                setEditedProject(prev => ({ ...prev, newTech: "" }));
                              }
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const tech = editedProject.newTech?.trim();
                            const alreadyExists = tech && editedProject.technologies.some(
                              t => t.toLowerCase() === tech.toLowerCase()
                            );
                            if (tech && !alreadyExists) {
                              setEditedProject(prev => ({ ...prev, technologies: [...prev.technologies, tech], newTech: "" }));
                            } else {
                              setEditedProject(prev => ({ ...prev, newTech: "" }));
                            }
                          }}
                          style={{ padding: "10px 20px", backgroundColor: "rgba(76, 185, 68, 0.2)", color: "var(--color-success)", border: "1px solid rgba(76, 185, 68, 0.3)", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
                        >+ Lisää</button>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {editedProject.technologies.map((tech, idx) => (
                          <span key={tech} className="tech-badge" style={{ background: "#e0e7ff", color: "#1e293b", padding: "6px 12px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                            {tech}
                            <button onClick={() => setEditedProject(prev => ({ ...prev, technologies: prev.technologies.filter((t, i) => i !== idx) }))} style={{ background: "none", border: "none", color: "#ef4444", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="tech-list">
                      {normalizeTechnologies(selectedProject.technologies).map((tech) => (
                        <span key={tech} className="tech-badge">{tech}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="impact-section">
                  <h3>Vaikutus</h3>
                  {isEditMode ? (
                    <textarea
                      value={editedProject.impact}
                      onChange={(e) => setEditedProject({ ...editedProject, impact: e.target.value })}
                      placeholder="Projektin vaikutus"
                      style={{
                        width: "100%", minHeight: "72px", padding: "10px",
                        backgroundColor: "var(--surface-glass)", border: "1px solid rgba(40, 61, 168, 0.24)",
                        borderRadius: "8px", color: "var(--text-primary)", fontSize: "14px", lineHeight: "1.4",
                      }}
                    />
                  ) : (
                    <p>{selectedProject.impact}</p>
                  )}
                </div>

                <div className="demo-section" style={{ marginTop: "20px" }}>
                  <h3>GitHub</h3>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedProject?.github || ""}
                      onChange={(e) => setEditedProject({ ...editedProject, github: e.target.value })}
                      placeholder="GitHub URL"
                      style={{
                        width: "100%", padding: "10px", backgroundColor: "var(--surface-glass)",
                        border: "1px solid rgba(40, 61, 168, 0.24)", borderRadius: "8px",
                        color: "var(--text-primary)", fontSize: "14px", fontFamily: "monospace",
                      }}
                    />
                  ) : selectedProject?.github ? (
                    <a href={selectedProject.github} target="_blank" rel="noopener noreferrer"
                      style={{
                        display: "inline-block", color: "var(--color-primary)", textDecoration: "none",
                        padding: "8px 16px", backgroundColor: "rgba(40, 61, 168, 0.1)",
                        border: "1px solid rgba(40, 61, 168, 0.24)", borderRadius: "8px",
                        fontSize: "14px", fontWeight: "500",
                      }}
                    >Avaa GitHub →</a>
                  ) : (
                    <p style={{ color: "var(--text-muted)" }}>Ei GitHub-linkkiä</p>
                  )}
                </div>

                {isEditMode && (
                  <div className="edit-actions" style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      style={{
                        flex: 1, padding: "12px", backgroundColor: "rgba(76, 185, 68, 0.2)",
                        color: "var(--color-success)", border: "1px solid rgba(76, 185, 68, 0.3)",
                        borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600",
                      }}
                    >
                      {saving ? "Tallennetaan..." : "Tallenna Muutokset"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      style={{
                        flex: 1, padding: "12px", backgroundColor: "rgba(239, 68, 68, 0.2)",
                        color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600",
                      }}
                    >Peruuta</button>
                  </div>
                )}

                {!isEditMode && (
                  <div className="links-section">
                    {selectedProject.liveDemo && (
                      <a href={selectedProject.liveDemo} target="_blank" rel="noopener noreferrer" className="link-btn primary">
                        Live Demo
                      </a>
                    )}
                    {selectedProject.github && (
                      <a href={selectedProject.github} target="_blank" rel="noopener noreferrer" className="link-btn secondary">
                        GitHub
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
            </div>
       
  );
}
