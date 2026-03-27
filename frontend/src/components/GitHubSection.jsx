import { useState } from "react";

export default function GitHubSection({
  username,
  onFetchRepos,
  onAnalyze
}) {
  const [loading, setLoading] = useState(null); // "repos" | "skills" | null

  const handleRepos = async () => {
    setLoading("repos");
    try {
      await onFetchRepos();
    } finally {
      setLoading(null);
    }
  };

  const handleAnalyze = async () => {
    setLoading("skills");
    try {
      await onAnalyze();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      style={{
        gridColumn: "1 / -1",
        paddingTop: "12px",
        borderTop: "1px solid var(--border-soft)"
      }}
    >
      <strong>GitHub 🐙</strong>

      <div style={{ marginTop: "6px" }}>
        {username ? (
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--color-primary)",
              textDecoration: "none",
              fontWeight: "500"
            }}
          >
            github.com/{username}
          </a>
        ) : (
          <span style={{ color: "var(--text-muted)" }}>
            Ei GitHub-profiilia
          </span>
        )}
      </div>

      {username && (
        <>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "4px"
            }}
          >
            Tuo projektit ja päivitä taidot GitHubista
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "10px"
            }}
          >
            <button
              onClick={handleRepos}
              disabled={loading !== null}
              style={{
                padding: "6px 14px",
                fontSize: "13px",
                backgroundColor: "var(--color-primary)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "default" : "pointer",
                fontWeight: "500",
                opacity: loading && loading !== "repos" ? 0.6 : 1
              }}
            >
              {loading === "repos" ? "Haetaan..." : "Tuo projektit "}
            </button>

            <button
              onClick={handleAnalyze}
              disabled={loading !== null}
              style={{
                padding: "6px 14px",
                fontSize: "13px",
                backgroundColor: "transparent",
                color: "var(--color-primary)",
                border: "1px solid var(--color-primary)",
                borderRadius: "6px",
                cursor: loading ? "default" : "pointer",
                fontWeight: "500",
                opacity: loading && loading !== "skills" ? 0.6 : 1
              }}
            >
              {loading === "skills" ? "Analysoidaan..." : "Päivitä taidot "}
            </button>
          </div>
        </>
      )}
    </div>
  );
}