import Navbar from "../components/Navbar";
import { useState, useMemo } from "react";
import { jsPDF } from "jspdf";
import {
  searchJobs,
  generateCoverLetterDraft,
  generateEditedCvDraft,
} from "../services/api";
import { useAppliedJobs } from "../hooks/db/useAppliedJobs";
import "../styles/portfolio.css";
import { usePortfolio } from "../hooks/db/usePortfolio";
import { usePortfolioProjects } from "../hooks/db/usePortfolioProjects";
import { useNavigate } from "react-router-dom";

// const normalize = (value) => `${value ?? ""}`.trim().toLowerCase();

const parseKeywords = (rawInput) =>
  rawInput
    .split(/[,;\n]/)
    .map((k) => k.trim())
    .filter(Boolean);

const buildJobText = (job) => {
  const requiredSkills = Array.isArray(job.requiredSkills)
    ? job.requiredSkills.join(", ")
    : "";

  return [
    `Title: ${job.title || ""}`,
    `Company: ${job.company || ""}`,
    `Location: ${job.location || ""}`,
    `Type: ${job.type || ""}`,
    `Description: ${job.description || ""}`,
    `Required skills: ${requiredSkills}`,
  ].join("\n");
};

const normalizeTextValue = (value) => `${value ?? ""}`.trim();

const normalizeObjectList = (value, shape) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const normalizedEntry = {};

      Object.keys(shape).forEach((key) => {
        normalizedEntry[key] = normalizeTextValue(entry?.[key]);
      });

      return normalizedEntry;
    })
    .filter((entry) => Object.values(entry).some(Boolean));
};

const normalizeStructuredCv = (value) => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const contact = value.contact && typeof value.contact === "object" ? value.contact : {};

  const normalized = {
    fullName: normalizeTextValue(value.fullName),
    headline: normalizeTextValue(value.headline),
    contact: {
      address: normalizeTextValue(contact.address),
      postalCodeAndCity: normalizeTextValue(contact.postalCodeAndCity),
      phone: normalizeTextValue(contact.phone),
      email: normalizeTextValue(contact.email),
    },
    profile: normalizeTextValue(value.profile),
    workExperience: normalizeObjectList(value.workExperience, {
      organization: "",
      role: "",
      period: "",
      location: "",
      summary: "",
    }),
    education: normalizeObjectList(value.education, {
      degree: "",
      institution: "",
      period: "",
      details: "",
    }),
    languages: normalizeObjectList(value.languages, {
      language: "",
      level: "",
    }),
    hobbies: Array.isArray(value.hobbies)
      ? value.hobbies.map((item) => normalizeTextValue(item)).filter(Boolean)
      : [],
    references: normalizeObjectList(value.references, {
      name: "",
      title: "",
      phone: "",
      email: "",
    }),
  };

  const hasContent = normalized.fullName
    || normalized.headline
    || normalized.profile
    || normalized.workExperience.length
    || normalized.education.length
    || normalized.languages.length
    || normalized.hobbies.length
    || normalized.references.length
    || Object.values(normalized.contact).some(Boolean);

  return hasContent ? normalized : null;
};

const drawWrappedText = (doc, text, x, y, maxWidth, lineHeight, options = {}) => {
  const content = normalizeTextValue(text) || " ";
  const lines = doc.splitTextToSize(content, maxWidth);

  lines.forEach((line) => {
    doc.text(line, x, y, options);
    y += lineHeight;
  });

  return y;
};

const drawStructuredCvPdf = (doc, structuredCv) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const labelWidth = 120;
  const columnGap = 18;
  const contentX = margin + labelWidth + columnGap;
  const contentWidth = pageWidth - contentX - margin;
  let y = margin;

  const ensureSpace = (requiredHeight = 32) => {
    if (y + requiredHeight <= pageHeight - margin) {
      return;
    }

    doc.addPage();
    y = margin;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(structuredCv.fullName || "CV", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const contactLines = [
    structuredCv.contact.address,
    structuredCv.contact.postalCodeAndCity,
    structuredCv.contact.phone,
    structuredCv.contact.email,
  ].filter(Boolean);

  let contactY = margin;
  contactLines.forEach((line) => {
    doc.text(line, pageWidth - margin, contactY, { align: "right" });
    contactY += 14;
  });

  y += 22;
  if (structuredCv.headline) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(structuredCv.headline, margin, y);
    y += 22;
  }

  doc.setDrawColor(120, 120, 120);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  const drawSection = (label, drawContent, estimatedHeight = 72) => {
    ensureSpace(estimatedHeight);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(label, margin, y);

    const sectionStartY = y;
    let sectionY = y;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    sectionY = drawContent(sectionY);
    y = Math.max(sectionY, sectionStartY + 18) + 18;
  };

  if (structuredCv.profile) {
    drawSection("Profiili", (sectionY) => (
      drawWrappedText(doc, structuredCv.profile, contentX, sectionY, contentWidth, 15)
    ), 70);
  }

  if (structuredCv.workExperience.length) {
    drawSection("Työkokemus", (sectionY) => {
      structuredCv.workExperience.forEach((entry, index) => {
        if (index > 0) {
          ensureSpace(68);
          sectionY += 8;
        }

        doc.setFont("helvetica", "bold");
        doc.text(entry.organization || entry.role || "Työkokemus", contentX, sectionY);
        sectionY += 15;

        const meta = [entry.role, entry.period, entry.location].filter(Boolean).join(", ");
        if (meta) {
          doc.setFont("helvetica", "normal");
          sectionY = drawWrappedText(doc, meta, contentX, sectionY, contentWidth, 14);
        }

        if (entry.summary) {
          doc.setFont("helvetica", "normal");
          sectionY = drawWrappedText(doc, entry.summary, contentX, sectionY, contentWidth, 15);
        }
      });

      return sectionY;
    }, 120);
  }

  if (structuredCv.education.length) {
    drawSection("Koulutus", (sectionY) => {
      structuredCv.education.forEach((entry, index) => {
        if (index > 0) {
          ensureSpace(62);
          sectionY += 8;
        }

        doc.setFont("helvetica", "bold");
        doc.text(entry.degree || entry.institution || "Koulutus", contentX, sectionY);
        sectionY += 15;

        const meta = [entry.period, entry.institution].filter(Boolean).join(" | ");
        if (meta) {
          doc.setFont("helvetica", "normal");
          sectionY = drawWrappedText(doc, meta, contentX, sectionY, contentWidth, 14);
        }

        if (entry.details) {
          doc.setFont("helvetica", "normal");
          sectionY = drawWrappedText(doc, entry.details, contentX, sectionY, contentWidth, 15);
        }
      });

      return sectionY;
    }, 110);
  }

  if (structuredCv.languages.length) {
    drawSection("Kielitaito", (sectionY) => {
      doc.setFont("helvetica", "normal");
      structuredCv.languages.forEach((entry, index) => {
        const line = [entry.language, entry.level].filter(Boolean).join("    ");
        sectionY = drawWrappedText(doc, line, contentX, sectionY, contentWidth, 15);

        if (index < structuredCv.languages.length - 1) {
          sectionY += 2;
        }
      });

      return sectionY;
    }, 80);
  }

  if (structuredCv.hobbies.length) {
    drawSection("Harrastukset", (sectionY) => (
      drawWrappedText(doc, structuredCv.hobbies.join(", "), contentX, sectionY, contentWidth, 15)
    ), 60);
  }

  if (structuredCv.references.length) {
    drawSection("Suosittelijat", (sectionY) => {
      const columnWidth = (contentWidth - 16) / 3;
      const refsPerRow = 3;

      for (let index = 0; index < structuredCv.references.length; index += refsPerRow) {
        const row = structuredCv.references.slice(index, index + refsPerRow);
        ensureSpace(72);

        let rowBottom = sectionY;

        row.forEach((entry, columnIndex) => {
          const refX = contentX + columnIndex * (columnWidth + 8);
          let refY = sectionY;

          doc.setFont("helvetica", "bold");
          refY = drawWrappedText(doc, entry.name, refX, refY, columnWidth, 14);

          doc.setFont("helvetica", "normal");
          [entry.title, entry.phone, entry.email].filter(Boolean).forEach((line) => {
            refY = drawWrappedText(doc, line, refX, refY, columnWidth, 14);
          });

          rowBottom = Math.max(rowBottom, refY);
        });

        sectionY = rowBottom + 8;
      }

      return sectionY;
    }, 96);
  }
};

export default function AvoimetTyopaikat() {
  // --- DATA HOOK ---
  // Haetaan tallennetut työpaikat ja tallennusfunktio hookista
  const { jobs: appliedJobs = [], saveJob, saving, loading } = useAppliedJobs();
  const { portfolio } = usePortfolio();
  const { projects } = usePortfolioProjects();
  const appliedIds = useMemo(() => {
    // console.log("DEBUG: appliedJobs kanta-data:", appliedJobs);
    return new Set(appliedJobs.map(j => String(j.id || j._id))); // Huomioidaan myös mahdolliset _id -kentät
  }, [appliedJobs]);

  // --- HAKUKRITEERIT JA TILAT ---
  const [searchCriteria, setSearchCriteria] = useState({
    jobTitle: "",
    location: "",
    keywords: []
  });

  const [availableJobs, setAvailableJobs] = useState([]);
  const [searched, setSearched] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [searchError, setSearchError] = useState(null);
  // const [searchMeta, setSearchMeta] = useState({ responseTime: null, sources: [] });


  // Kustomoinnin tilat
  const [customizationJob, setCustomizationJob] = useState(null);
  const [applicantText, setApplicantText] = useState("Kirjoita tähän oma osaamisprofiilisi...");
  const [cvText, setCvText] = useState("Kirjoita tähän nykyinen CV-luonnos...");
  const [coverLetterDraft, setCoverLetterDraft] = useState("");
  const [editedCvDraft, setEditedCvDraft] = useState("");
  const [editedCvStructured, setEditedCvStructured] = useState(null);
  const [draftLoading, setDraftLoading] = useState({ coverLetter: false, cv: false });
  const [draftError, setDraftError] = useState("");
  const [selectedDraftTarget, setSelectedDraftTarget] = useState("coverLetter");

  // --- TOIMINNALLISUUDET ---

  const openCustomizationPanel = (job, draftTarget = "coverLetter") => {
    setCustomizationJob(job);
    setSelectedDraftTarget(draftTarget);
    setCoverLetterDraft("");
    setEditedCvDraft("");
    setEditedCvStructured(null);
    setDraftError("");
  };

  const closeCustomizationPanel = () => {
    setCustomizationJob(null);
    setSelectedDraftTarget("coverLetter");
    setEditedCvStructured(null);
    setDraftError("");
    };

    const navigate = useNavigate();
    const startInterview = (job) => {
        const jobText = buildJobText(job);

        navigate("/interview", {
            state: {
                jobText: jobText
            }
        });
    };

  // Rakentaa portfoliosta ja projekteista lisäkontekstin LLM:lle
  const buildPortfolioContext = (portfolio, projects) => {
    const parts = [];

    if (portfolio) {
      // Profiili + vahvuudet
      if (portfolio.summary) parts.push(`Profiili: ${portfolio.summary}`);

      if (portfolio.profileSummary?.whyMe?.length) {
        parts.push(`Vahvuudet:\n${portfolio.profileSummary.whyMe.join("\n")}`);
      }
      if (portfolio.profileSummary?.lookingFor?.length) {
        parts.push(`Etsin:\n${portfolio.profileSummary.lookingFor.join("\n")}`);
      }

      // Työkokemus + saavutukset
      if (portfolio.experience?.length) {
        const exp = portfolio.experience
          .map(e => {
            const header = `${e.title ?? ""} @ ${e.company ?? ""} (${e.period ?? ""})`;
            const desc = e.description ? `\n  ${e.description}` : "";
            const achievements = e.achievements?.length
              ? `\n  Saavutukset: ${e.achievements.join(", ")}`
              : "";
            return header + desc + achievements;
          })
          .filter(Boolean)
          .join("\n\n");
        if (exp) parts.push(`Työkokemus:\n${exp}`);
      }

      // Koulutus + kurssit
      if (portfolio.education?.length) {
        const edu = portfolio.education
          .map(e => {
            const header = `${e.degree ?? ""} — ${e.institution ?? ""} (${e.year ?? e.period ?? ""})`;
            const relevant = e.relevant?.length
              ? `\n  Kurssit: ${e.relevant.join(", ")}`
              : "";
            return header + relevant;
          })
          .filter(Boolean)
          .join("\n\n");
        if (edu) parts.push(`Koulutus:\n${edu}`);
      }

      // Sertifikaatit
      if (portfolio.certifications?.length) {
        parts.push(`Sertifikaatit: ${portfolio.certifications.join(", ")}`);
      }
    }

    // Projektit
    if (projects?.length) {
      const proj = projects
        .map(p => {
          const header = `${p.title ?? ""}${p.category ? " [" + p.category + "]" : ""}`;
          const desc = p.description ?? "";
          const tech = p.technologies?.length ? `Teknologiat: ${p.technologies.join(", ")}` : "";
          const impact = p.impact ? `Vaikutus: ${p.impact}` : "";
          const status = p.status ? `Status: ${p.status}` : "";
          return [header, desc, tech, impact, status].filter(Boolean).join(" | ");
        })
        .filter(Boolean)
        .join("\n");
      if (proj) parts.push(`Projektit:\n${proj}`);
    }

    return parts.length ? `\n\n--- PORTFOLIO ---\n${parts.join("\n\n")}` : "";
  };

  const createCoverLetter = async () => {
    if (!customizationJob) return;
    if (!applicantText.trim()) {
      setDraftError("Lisää ensin oma osaamisprofiili saatekirjettä varten.");
      return;
    }

    setDraftError("");
    setDraftLoading((prev) => ({ ...prev, coverLetter: true }));

    try {
      const enrichedApplicantText = applicantText.trim()
        + buildPortfolioContext(portfolio, projects);

      const response = await generateCoverLetterDraft({
        jobText: buildJobText(customizationJob),
        applicantText: enrichedApplicantText,
        language: "Finnish",
        matchData: {
          matchedKeywords: customizationJob.matchedSkills || customizationJob.requiredSkills || [],
        },
      });
      setCoverLetterDraft(response.coverLetter || "Saatekirjeluonnosta ei saatu muodostettua.");
    } catch (err) {
      setDraftError(`Saatekirjeen luonti epäonnistui: ${err.message}`);
    } finally {
      setDraftLoading((prev) => ({ ...prev, coverLetter: false }));
    }
  };

  const createEditedCv = async () => {
    if (!customizationJob) return;
    if (!cvText.trim()) {
      setDraftError("Lisää ensin CV-teksti, jotta räätälöinti voidaan tehdä.");
      return;
    }

    setDraftError("");
    setDraftLoading((prev) => ({ ...prev, cv: true }));

    try {
      const enrichedCvText = cvText.trim()
        + buildPortfolioContext(portfolio, projects);

      const response = await generateEditedCvDraft({
        jobText: buildJobText(customizationJob),
        cvText: enrichedCvText,
        language: "Finnish",
      });
      setEditedCvDraft(response.editedCV || "CV-luonnosta ei saatu muodostettua.");
      setEditedCvStructured(normalizeStructuredCv(response.structuredCV));
    } catch (err) {
      setDraftError(`CV:n räätälöinti epäonnistui: ${err.message}`);
    } finally {
      setDraftLoading((prev) => ({ ...prev, cv: false }));
    }
  };

  const downloadDraftAsPdf = (draftType) => {
    const isCoverLetter = draftType === "coverLetter";
    const draftText = isCoverLetter ? coverLetterDraft : editedCvDraft;
    const canUseStructuredCv = !isCoverLetter && editedCvStructured;

    if (!draftText.trim()) {
      setDraftError("Ei ladattavaa sisältöä. Luo luonnos ensin.");
      return;
    }

    const fileName = isCoverLetter ? "saatekirje-luonnos.pdf" : "cv-luonnos.pdf";
    const heading = isCoverLetter ? "Saatekirjeluonnos" : "Räätälöity CV-luonnos";

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 44;
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    if (canUseStructuredCv) {
      drawStructuredCvPdf(doc, editedCvStructured);
      doc.save(fileName);
      return;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(heading, margin, y);
    y += 26;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const paragraphs = draftText.replace(/\r\n/g, "\n").split("\n");
    paragraphs.forEach((paragraph) => {
      const printableParagraph = paragraph.trim().length ? paragraph : " ";
      const lines = doc.splitTextToSize(printableParagraph, maxWidth);

      lines.forEach((line) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 16;
      });

      y += 4;
    });

    doc.save(fileName);
  };

  // Hae työpaikkoja
  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError(null);

    const criteria = {
      ...searchCriteria,
      jobTitle: searchCriteria.jobTitle.trim(),
      location: searchCriteria.location.trim(),
      keywords: keywordInput.split(/[,;\n]/).map(k => k.trim()).filter(Boolean),
    };

    try {
      const data = await searchJobs(criteria);
      setAvailableJobs(data.jobs || []);
      setSearched(true);
    } catch (err) {
      console.error("Haku epäonnistui:", err);
      setSearchError("Työpaikkojen haku epäonnistui. Tarkista yhteys taustapalveluun.");
      setAvailableJobs([]);
    } finally {
    }
  };

  const applyForJob = async (job) => {
    if (loading || saving) return;

    const alreadyApplied = appliedJobs.some(a => String(a.id) === String(job.id));
    if (alreadyApplied) {
      console.log("Tämä työpaikka on jo haettu (tietokannassa).");
      return;
    }

    try {
      await saveJob(String(job.id), job);
    } catch (err) {
      console.error("Tallennus epäonnistui:", err);
    }
  };

  // Funktio ympyräkaavion piirtämiseen
  const renderPieChart = (compatibility, recommended) => {
    const angle = Math.min((compatibility / 100) * 360, 359.999); // jesari fix clamp: 0-360, koska 360 deg tarkoittaa 0.
    const largeArc = angle > 180 ? 1 : 0;

    const x1 = 75 + 60 * Math.cos((0 * Math.PI) / 180);
    const y1 = 75 + 60 * Math.sin((0 * Math.PI) / 180);
    const x2 = 75 + 60 * Math.cos((angle * Math.PI) / 180);
    const y2 = 75 + 60 * Math.sin((angle * Math.PI) / 180);

    let color = "#FF6B6B";
    if (recommended) {
      color = "var(--color-success)";
    } else if (compatibility >= 60) {
      color = "#FFC107";
    }

    return (
      <svg width="150" height="150" viewBox="0 0 150 150" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}>
        {/* Taustakehä */}
        <circle cx="75" cy="75" r="60" fill="var(--border-soft-72)" opacity="0.5" />

        {/* Yhteensopivuuskehä */}
        <path
          d={`M 75 75 L ${x1} ${y1} A 60 60 0 ${largeArc} 1 ${x2} ${y2} Z`}
          fill={color}
          opacity="0.8"
        />

        {/* Keskellä oleva teksti */}
        <circle cx="75" cy="75" r="42" fill="var(--surface-card)" />
        <text x="75" y="70" fontSize="28" fontWeight="bold" textAnchor="middle" fill={color}>
          {compatibility}%
        </text>
        <text x="75" y="88" fontSize="10" textAnchor="middle" fill="var(--text-secondary)">
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
          <h1 style={{ marginBottom: "10px", color: "var(--text-primary)", fontSize: "2.5rem" }}>Avoimet Työpaikat</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "10px", fontSize: "1.1rem" }}>
            Löydä sinulle sopivia työpaikkoja
          </p>

          {/* Hakumuoto */}
          <form onSubmit={handleSearch} style={{ marginBottom: "30px", padding: "20px", backgroundColor: "rgba(40, 61, 168, 0.10)", borderRadius: "16px", border: "1px solid rgba(40, 61, 168, 0.24)" }}>
            <h3 style={{ color: "var(--text-primary)", marginTop: 0 }}>Automaattinen Haku</h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", color: "var(--text-secondary)", marginBottom: "5px", fontSize: "0.9rem", fontWeight: "500" }}>
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
                    backgroundColor: "var(--surface-glass)",
                    border: "1px solid var(--border-soft-82)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: "0.95rem"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-secondary)", marginBottom: "5px", fontSize: "0.9rem", fontWeight: "500" }}>
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
                    backgroundColor: "var(--surface-glass)",
                    border: "1px solid var(--border-soft-82)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: "0.95rem"
                  }}
                />
              </div>

            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", color: "var(--text-secondary)", marginBottom: "5px", fontSize: "0.9rem", fontWeight: "500" }}>
                Avainsanat (pilkulla erotettu)
              </label>
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => {
                  setKeywordInput(e.target.value);
                  setSearchCriteria({
                    ...searchCriteria,
                    keywords: parseKeywords(e.target.value),
                  });
                }}
                placeholder="esim. React, JavaScript, TypeScript"
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "var(--surface-glass)",
                  border: "1px solid var(--border-soft-82)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  fontSize: "0.95rem"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 30px",
                background: loading ? "var(--border-soft-82)" : "linear-gradient(135deg, var(--color-primary), var(--color-primary-strong))",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: loading ? "wait" : "pointer",
                transition: "all 0.3s ease",
                boxShadow: loading ? "none" : "0 4px 12px rgba(40, 61, 168, 0.24)"
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(40, 61, 168, 0.32)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(40, 61, 168, 0.24)";
                }
              }}
            >
              {loading ? "Haetaan..." : "Hae työpaikkoja"}
            </button>
          </form>

          {searchError && (
            <div style={{ marginBottom: "20px", padding: "16px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "10px", color: "#ef4444", textAlign: "center" }}>
              <p style={{ margin: 0, fontWeight: "500" }}>{searchError}</p>
            </div>
          )}

          {!searched && !loading && (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "var(--text-secondary)",
              fontSize: "1.1rem"
            }}>
              <p>Käytä hakumuotoa etsiäksesi sinulle sopivia työpaikkoja</p>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "10px" }}>
                Haku käy läpi Duunitori, LinkedIn ja yritysten omat sivut
              </p>
            </div>
          )}

          {searched && availableJobs.length === 0 && (
            <p style={{ color: "#ef4444", fontSize: "1.1rem", textAlign: "center", padding: "20px" }}>
              Ei löytynyt työpaikkoja annettujen kriteerien perusteella.
            </p>
          )}


          {availableJobs.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "8px" }}>
                Löytyi {availableJobs.length} työpaikkaa
              </p>
            </div>
          )}

          {availableJobs.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
              gap: "24px",
              width: "100%"
            }}>
              {availableJobs.map((job) => {
                const jobIdStr = String(job.id);
                const isApplied = appliedIds.has(jobIdStr);
                return (
                  <div
                    key={job.id}
                    style={{
                      padding: "24px",
                      border: "1px solid var(--border-soft-72)",
                      borderRadius: "16px",
                      backgroundColor: "var(--surface-glass)",
                      backdropFilter: "blur(10px)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      transition: "all 0.3s ease",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <h3 style={{ margin: "0 0 10px 0", color: "var(--color-primary)", fontSize: "1.4rem" }}>{job.title}</h3>

                    <p style={{ margin: "0 0 15px 0", fontSize: "16px", color: "var(--text-secondary)" }}>
                      <strong>{job.company}</strong> • {job.location}
                    </p>

                    <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        backgroundColor: job.source === "LinkedIn" ? "rgba(0, 102, 153, 0.2)" : "rgba(40, 61, 168, 0.16)",
                        color: job.source === "LinkedIn" ? "#06b6d4" : "var(--color-primary)",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "500"
                      }}>
                        {job.source}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", marginBottom: "15px" }}>
                      <div style={{ flexShrink: 0 }}>
                        {renderPieChart(job.compatibility, job.recommended)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", color: "var(--text-muted)" }}>
                          {/* PALKKA: Näytetään vain jos se on olemassa ja järkevä */}
                          {job.salary && job.salary !== "Ei ilmoitettu" && <span>💰 {job.salary}</span>}
                          <span>Tyyppi: {job.type}</span>
                          <span>Julkaistu: {job.posted}</span>
                          {job.recommended && <span style={{ color: "var(--color-success)", fontWeight: "600" }}>Suositeltu sinulle</span>}
                        </div>
                      </div>
                    </div>

                    {/* KUVAUS: Leikattu siististi 3 riviin */}
                    <p style={{
                      color: "var(--text-secondary)",
                      marginBottom: "15px",
                      lineHeight: "1.5",
                      fontSize: "0.95rem",
                      display: "-webkit-box",
                      WebkitLineClamp: "3",
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      height: "4.5em"
                    }}>
                      {job.description}
                    </p>

                    {/* TAIDOT: Nyt mahtuu noin 3 riviä taitoja */}
                    <div style={{ marginBottom: "15px", flexGrow: 1 }}>
                      <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "var(--text-primary)" }}>Vaaditut Taidot:</h4>
                      <div style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        height: "105px",
                        overflow: "hidden",
                        alignContent: "flex-start"
                      }}>
                        {job.requiredSkills.map((skill) => {
                          const isMatched = job.matchedSkills.includes(skill);
                          return (
                            <span
                              key={skill}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: isMatched ? "rgba(76, 185, 68, 0.2)" : "rgba(239, 68, 68, 0.2)",
                                color: isMatched ? "var(--color-success)" : "#ef4444",
                                border: `1px solid ${isMatched ? "rgba(76, 185, 68, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "500",
                                whiteSpace: "nowrap",
                                lineHeight: "1.2"
                              }}
                            >
                              {isMatched ? "Sopii: " : "Puuttuu: "}
                              {skill}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* AI-NAPIT */}
                    <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                      <button
                        onClick={() => {
                          setCustomizationJob(job);
                          setSelectedDraftTarget("coverLetter");
                        }}
                        style={{
                          flex: 1,
                          padding: "10px",
                          backgroundColor: "rgba(40, 61, 168, 0.08)",
                          color: "var(--color-primary)",
                          border: "1px solid rgba(40, 61, 168, 0.2)",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(40, 61, 168, 0.15)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(40, 61, 168, 0.08)"}
                      >
                        AI-Saatekirje
                      </button>

                      <button
                        onClick={() => {
                          setCustomizationJob(job);
                          setSelectedDraftTarget("cv");
                        }}
                        style={{
                          flex: 1,
                          padding: "10px",
                          backgroundColor: "rgba(52, 199, 89, 0.08)",
                          color: "var(--color-success)",
                          border: "1px solid rgba(52, 199, 89, 0.2)",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(52, 199, 89, 0.15)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(52, 199, 89, 0.08)"}
                      >
                        Räätälöi CV
                      </button>
                    </div>

                    <button
                      onClick={() => applyForJob(job)}
                      disabled={isApplied || saving}
                      style={{
                        width: "100%",
                        padding: "12px 24px",
                        background: isApplied ? "var(--border-soft-82)" : "linear-gradient(135deg, var(--color-primary), var(--color-primary-strong))",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: isApplied ? "not-allowed" : "pointer"
                      }}
                    >
                      {isApplied ? "Hakemus lähetetty" : "Hae työpaikkaa"}
                        </button>
                        <div>
                            <button
                                onClick={() => startInterview(job)}
                                style={{
                                    width: "100%",
                                    padding: "12px 24px",
                                    background: isApplied ? "var(--border-soft-82)" : "linear-gradient(135deg, var(--color-primary), var(--color-primary-strong))",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "10px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    cursor: isApplied ? "not-allowed" : "pointer"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.15)"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.08)"}
                            >
                                Kokeile työhaaastattelua
                            </button></div>
                  </div>
                );
              })}
            </div>
          )}

          {customizationJob && (
            <div
              onClick={closeCustomizationPanel}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(2, 6, 23, 0.75)",
                zIndex: 2000,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "20px",
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "min(920px, 100%)",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  backgroundColor: "var(--surface-soft)",
                  border: "1px solid var(--border-soft-78)",
                  borderRadius: "16px",
                  padding: "24px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                  <div>
                    <h3 style={{ margin: 0, color: "var(--text-primary)" }}>AI-räätälöinti: {customizationJob.title}</h3>
                    <p style={{ margin: "6px 0 0 0", color: "var(--text-muted)", fontSize: "14px" }}>
                      Luo työpaikkakohtainen saatekirjeluonnos ja CV-luonnos tämän ilmoituksen painotusten mukaan.
                    </p>
                    <p style={{ margin: "6px 0 0 0", color: "var(--text-secondary)", fontSize: "13px", fontWeight: "600" }}>
                      Avattu: {selectedDraftTarget === "coverLetter" ? "Saatekirje" : "CV"}
                    </p>
                  </div>
                  <button
                    onClick={closeCustomizationPanel}
                    style={{
                      border: "1px solid var(--border-soft-90)",
                      background: "transparent",
                      color: "var(--text-secondary)",
                      borderRadius: "8px",
                      padding: "8px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Sulje
                  </button>
                </div>

                {selectedDraftTarget === "coverLetter" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px", marginBottom: "14px" }}>
                      <label style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: "600" }}>
                        Oma osaamisprofiili (saatekirjeen pohja)
                      </label>
                      <textarea
                        value={applicantText}
                        onChange={(e) => setApplicantText(e.target.value)}
                        style={{
                          width: "100%",
                          minHeight: "140px",
                          borderRadius: "10px",
                          border: "1px solid var(--border-soft-82)",
                          backgroundColor: "var(--surface-input)",
                          color: "var(--text-primary)",
                          padding: "12px",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                      <button
                        onClick={createCoverLetter}
                        disabled={draftLoading.coverLetter}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "10px",
                          border: "none",
                          background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-strong))",
                          color: "white",
                          cursor: draftLoading.coverLetter ? "wait" : "pointer",
                          fontWeight: "600",
                        }}
                      >
                        {draftLoading.coverLetter ? "Luodaan saatekirjettä..." : "Luo saatekirjeluonnos"}
                      </button>

                      <button
                        onClick={() => downloadDraftAsPdf("coverLetter")}
                        disabled={!coverLetterDraft.trim()}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid rgba(40, 61, 168, 0.35)",
                          backgroundColor: !coverLetterDraft.trim() ? "rgba(51, 65, 85, 0.45)" : "rgba(40, 61, 168, 0.12)",
                          color: !coverLetterDraft.trim() ? "var(--text-muted)" : "var(--color-primary)",
                          cursor: !coverLetterDraft.trim() ? "not-allowed" : "pointer",
                          fontWeight: "600",
                        }}
                      >
                        Lataa saatekirje PDF
                      </button>
                    </div>
                  </>
                )}

                {selectedDraftTarget === "cv" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px", marginBottom: "14px" }}>
                      <label style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: "600" }}>
                        Nykyinen CV-teksti (CV-räätälöintiä varten)
                      </label>
                      <textarea
                        value={cvText}
                        onChange={(e) => setCvText(e.target.value)}
                        style={{
                          width: "100%",
                          minHeight: "180px",
                          borderRadius: "10px",
                          border: "1px solid var(--border-soft-82)",
                          backgroundColor: "var(--surface-input)",
                          color: "var(--text-primary)",
                          padding: "12px",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                      <button
                        onClick={createEditedCv}
                        disabled={draftLoading.cv}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "10px",
                          border: "none",
                          background: "linear-gradient(135deg, var(--color-success), #2ea54b)",
                          color: "white",
                          cursor: draftLoading.cv ? "wait" : "pointer",
                          fontWeight: "600",
                        }}
                      >
                        {draftLoading.cv ? "Räätälöidään CV:tä..." : "Räätälöi CV-luonnos"}
                      </button>

                      <button
                        onClick={() => downloadDraftAsPdf("cv")}
                        disabled={!editedCvDraft.trim()}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid rgba(52, 199, 89, 0.4)",
                          backgroundColor: !editedCvDraft.trim() ? "rgba(51, 65, 85, 0.45)" : "rgba(52, 199, 89, 0.14)",
                          color: !editedCvDraft.trim() ? "var(--text-muted)" : "var(--color-success)",
                          cursor: !editedCvDraft.trim() ? "not-allowed" : "pointer",
                          fontWeight: "600",
                        }}
                      >
                        Lataa CV PDF
                      </button>
                    </div>
                  </>
                )}

                {draftError && (
                  <p style={{ margin: "0 0 14px 0", color: "#f87171", fontSize: "14px" }}>
                    {draftError}
                  </p>
                )}

                {selectedDraftTarget === "coverLetter" && coverLetterDraft && (
                  <div style={{ marginBottom: "14px" }}>
                    <h4 style={{ margin: "0 0 8px 0", color: "var(--text-primary)" }}>Saatekirjeluonnos</h4>
                    <textarea
                      value={coverLetterDraft}
                      onChange={(e) => setCoverLetterDraft(e.target.value)}
                      style={{
                        width: "100%",
                        minHeight: "180px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-soft-90)",
                        backgroundColor: "var(--surface-input)",
                        color: "var(--text-primary)",
                        padding: "12px",
                      }}
                    />
                  </div>
                )}

                {selectedDraftTarget === "cv" && editedCvDraft && (
                  <div style={{ display: "grid", gap: "14px" }}>
                    <h4 style={{ margin: "0 0 8px 0", color: "var(--text-primary)" }}>Räätälöity CV-luonnos</h4>

                    {editedCvStructured && (
                      <div style={{
                        padding: "18px",
                        borderRadius: "18px",
                        border: "1px solid rgba(148, 163, 184, 0.22)",
                        background: "linear-gradient(180deg, rgba(245, 241, 232, 0.92), rgba(235, 229, 214, 0.88))",
                        overflowX: "auto",
                      }}>
                        <div style={{
                          width: "100%",
                          maxWidth: "760px",
                          margin: "0 auto",
                          backgroundColor: "#fffdf8",
                          color: "#111827",
                          borderRadius: "6px",
                          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)",
                          padding: "34px 38px 30px",
                          fontFamily: '"Georgia", "Times New Roman", serif',
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "24px", alignItems: "flex-start" }}>
                            <div style={{ flex: "1 1 auto" }}>
                              <div style={{ fontSize: "34px", fontWeight: "700", lineHeight: 1.05, marginBottom: "10px" }}>
                                {editedCvStructured.fullName || "Nimetön hakija"}
                              </div>
                              {editedCvStructured.headline && (
                                <div style={{ fontSize: "16px", lineHeight: 1.4 }}>{editedCvStructured.headline}</div>
                              )}
                            </div>

                            <div style={{ minWidth: "180px", textAlign: "right", fontSize: "13px", lineHeight: 1.5 }}>
                              {[editedCvStructured.contact.address, editedCvStructured.contact.postalCodeAndCity, editedCvStructured.contact.phone, editedCvStructured.contact.email]
                                .filter(Boolean)
                                .map((line) => (
                                  <div key={line}>{line}</div>
                                ))}
                            </div>
                          </div>

                          <div style={{ height: "1px", backgroundColor: "rgba(15, 23, 42, 0.28)", margin: "26px 0 30px" }} />

                          {[
                            editedCvStructured.profile && {
                              title: "Profiili",
                              content: (
                                <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.65 }}>
                                  {editedCvStructured.profile}
                                </p>
                              ),
                            },
                            editedCvStructured.workExperience.length > 0 && {
                              title: "Työkokemus",
                              content: (
                                <div style={{ display: "grid", gap: "20px" }}>
                                  {editedCvStructured.workExperience.map((entry, index) => (
                                    <div key={`${entry.organization}-${entry.role}-${index}`}>
                                      <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "4px" }}>
                                        {entry.organization || entry.role}
                                      </div>
                                      <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
                                        {[entry.role, entry.period, entry.location].filter(Boolean).join(", ")}
                                      </div>
                                      {entry.summary && (
                                        <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.65 }}>{entry.summary}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ),
                            },
                            editedCvStructured.education.length > 0 && {
                              title: "Koulutus",
                              content: (
                                <div style={{ display: "grid", gap: "18px" }}>
                                  {editedCvStructured.education.map((entry, index) => (
                                    <div key={`${entry.degree}-${entry.institution}-${index}`}>
                                      <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "4px" }}>
                                        {entry.degree || entry.institution}
                                      </div>
                                      <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: entry.details ? "8px" : 0 }}>
                                        {[entry.period, entry.institution].filter(Boolean).join(" | ")}
                                      </div>
                                      {entry.details && (
                                        <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.65 }}>{entry.details}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ),
                            },
                            editedCvStructured.languages.length > 0 && {
                              title: "Kielitaito",
                              content: (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "6px 18px", fontSize: "14px", lineHeight: 1.6 }}>
                                  {editedCvStructured.languages.map((entry, index) => (
                                    <div key={`${entry.language}-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                                      <span>{entry.language}</span>
                                      <span>{entry.level}</span>
                                    </div>
                                  ))}
                                </div>
                              ),
                            },
                            editedCvStructured.hobbies.length > 0 && {
                              title: "Harrastukset",
                              content: (
                                <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.65 }}>
                                  {editedCvStructured.hobbies.join(", ")}
                                </p>
                              ),
                            },
                            editedCvStructured.references.length > 0 && {
                              title: "Suosittelijat",
                              content: (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "18px 24px" }}>
                                  {editedCvStructured.references.map((entry, index) => (
                                    <div key={`${entry.name}-${index}`} style={{ fontSize: "13px", lineHeight: 1.55 }}>
                                      <div style={{ fontWeight: "700" }}>{entry.name}</div>
                                      {entry.title && <div>{entry.title}</div>}
                                      {entry.phone && <div>{entry.phone}</div>}
                                      {entry.email && <div>{entry.email}</div>}
                                    </div>
                                  ))}
                                </div>
                              ),
                            },
                          ].filter(Boolean).map((section) => (
                            <div key={section.title} style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "16px", marginBottom: "28px" }}>
                              <div style={{ fontSize: "16px", fontWeight: "700" }}>{section.title}</div>
                              <div>{section.content}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <textarea
                      value={editedCvDraft}
                      onChange={(e) => setEditedCvDraft(e.target.value)}
                      style={{
                        width: "100%",
                        minHeight: "220px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-soft-90)",
                        backgroundColor: "var(--surface-input)",
                        color: "var(--text-primary)",
                        padding: "12px",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}