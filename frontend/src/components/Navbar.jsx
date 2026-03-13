import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/navbar.css";

export default function Navbar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = savedTheme || (prefersDark ? "dark" : "light");

    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  }, []);

  const applyTheme = (nextTheme) => {
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    setIsDrawerOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/">Etusivu</Link>
        <Link to="/portfolio">Portfolio</Link>
        <Link to="/projects">Projektit</Link>
        <Link to="/avoimet-tyopaikat">Avoimet Työpaikat</Link>
        <Link to="/jobs">Työhaut</Link>

        <button
          type="button"
          className="settings-btn"
          aria-label="Avaa teema-asetukset"
          aria-expanded={isDrawerOpen}
          onClick={() => setIsDrawerOpen((prev) => !prev)}
        >
          ⚙️
        </button>
      </nav>

      {isDrawerOpen && (
        <button
          type="button"
          className="drawer-backdrop"
          aria-label="Sulje teema-asetukset"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      <aside className={`theme-drawer ${isDrawerOpen ? "open" : ""}`}>
        <h4>Teema</h4>
        <p>Valitse käyttöliittymän taustatila</p>

        <div className="theme-options">
          <button
            type="button"
            className={`theme-option-btn ${theme === "light" ? "active" : ""}`}
            onClick={() => applyTheme("light")}
          >
            Light mode
          </button>

          <button
            type="button"
            className={`theme-option-btn ${theme === "dark" ? "active" : ""}`}
            onClick={() => applyTheme("dark")}
          >
            Dark mode
          </button>
        </div>
      </aside>
    </>
  );
}