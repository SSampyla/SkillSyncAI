import { useMemo, useState, } from "react";
import Navbar from "./Navbar";
import "../styles/gallery.css";
import { usePortfolioProjects } from "../hooks/useDatabase";
import RequireProfile from "../components/RequireProfile";

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
    const {
        projects,
        loading,
        saving,
        error,
        createProject,
        updateProject,
        deleteProject
    } = usePortfolioProjects();

    // TAGIT
    const allTags = [
        "all",
        ...new Set(projects.flatMap(p => normalizeTechnologies(p.technologies)))
    ];

    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [filterTag, setFilterTag] = useState("all");
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedProject, setEditedProject] = useState(null);
    const [newImageUrl, setNewImageUrl] = useState("");

    const selectedProject = useMemo(
        () => projects.find((project) => project.id === selectedProjectId) || null,
        [projects, selectedProjectId]
    );

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
            technologies:
                typeof editedProject.technologies === "string"
                    ? parseTechnologies(editedProject.technologies)
                    : editedProject.technologies,
            images:
                editedProject.images.length > 0
                    ? editedProject.images.filter(Boolean)
                    : [PLACEHOLDER_IMAGE],
        };

        try {
            await updateProject(normalizedProject.id, normalizedProject);
            setIsEditMode(false);
            setEditedProject(null);
            setNewImageUrl("");
        } catch {
            alert("Tallennus epäonnistui");
        }
    };

    const cancelEdit = () => {
        setIsEditMode(false);
        setEditedProject(null);
        setNewImageUrl("");
    };

    const addNewProject = async () => {
        try {
            const newProject = await createProject(createEmptyProject());
            setFilterTag("all");
            openProject(newProject);
            startEdit(newProject);
        } catch {
            alert("Projektin luonti epäonnistui");
        }
    };

    const handleDeleteProject = async (projectId) => {
        const projectToDelete = projects.find((p) => p.id === projectId);
        if (!projectToDelete) return;

        const shouldDelete = window.confirm(
            `Poistetaanko projekti "${projectToDelete.title}" pysyvästi?`
        );
        if (!shouldDelete) return;

        try {
            await deleteProject(projectId);
            closeModal();
        } catch {
            alert("Poisto epäonnistui");
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

    const filteredProjects =
        filterTag === "all"
            ? projects
            : projects.filter((p) =>
                normalizeTechnologies(p.technologies).includes(filterTag)
            );

    return (
        <RequireProfile>
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

        {/* Modal for Project Details */}
        {selectedProject && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={closeModal}>X</button>

              {!isEditMode && (
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
                {(isEditMode ? editedProject.images : selectedProject.images).map((img, idx) => (
                  <div key={idx} className="modal-image-wrapper" style={{ position: "relative" }}>
                    <img src={img} alt={`${isEditMode ? editedProject.title : selectedProject.title} ${idx + 1}`} />
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
                      placeholder="YouTube embed URL (https://www.youtube.com/embed/...)"
                      style={{
                        width: "100%", padding: "10px", backgroundColor: "var(--surface-glass)",
                        border: "1px solid rgba(40, 61, 168, 0.24)", borderRadius: "8px",
                        color: "var(--text-primary)", fontSize: "14px", fontFamily: "monospace",
                      }}
                    />
                  ) : selectedProject?.video ? (
                    <div className="video-container">
                      <iframe src={selectedProject.video} title={`${selectedProject.title} demo`} allowFullScreen />
                    </div>
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
                    <input
                      type="text"
                      value={editedProject.technologies.join(", ")}
                      onChange={(e) => setEditedProject({ ...editedProject, technologies: parseTechnologies(e.target.value) })}
                      placeholder="Esim. React, Node.js, MongoDB"
                      style={{
                        width: "100%", padding: "10px", backgroundColor: "var(--surface-glass)",
                        border: "1px solid rgba(40, 61, 168, 0.24)", borderRadius: "8px",
                        color: "var(--text-primary)", fontSize: "14px",
                      }}
                    />
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
        </RequireProfile>
  );
}
