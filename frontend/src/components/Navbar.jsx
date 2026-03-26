import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import { isDemoMode } from "../demo/useDemoMode";

export default function Navbar() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        return savedTheme || (prefersDark ? "dark" : "light");
    });

    const navigate = useNavigate();

    // ✅ vain DOM päivitys täällä
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    const applyTheme = (nextTheme) => {
        setTheme(nextTheme);
        localStorage.setItem("theme", nextTheme);
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
                    onClick={() => setIsDrawerOpen(prev => !prev)}
                >
                    ⚙️
                </button>

                {isDemoMode() && (
                    <div className="demo-controls">
                        <span className="demo-badge">DEMO</span>

                        <button
                            className="demo-exit-btn"
                            onClick={() => {
                                localStorage.removeItem("demoMode");
                                navigate("/");
                            }}
                        >
                            Poistu
                        </button>
                    </div>
                )}
            </nav>

            {isDrawerOpen && (
                <button
                    className="drawer-backdrop"
                    onClick={() => setIsDrawerOpen(false)}
                />
            )}

            <aside className={`theme-drawer ${isDrawerOpen ? "open" : ""}`}>
                <h4>Teema</h4>
                <p>Valitse käyttöliittymän taustatila</p>

                <div className="theme-options">
                    <button onClick={() => applyTheme("light")}>
                        Light mode
                    </button>
                    <button onClick={() => applyTheme("dark")}>
                        Dark mode
                    </button>
                </div>
            </aside>
        </>
    );
}