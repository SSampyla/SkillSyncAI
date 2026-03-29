import { usePortfolio } from "../hooks/useDatabase";
import { useNavigate } from "react-router-dom";

export default function RequireProfile({ children }) {
    const { portfolio, loading } = usePortfolio();
    const navigate = useNavigate();

    const hasProfile =
        portfolio &&
        portfolio.name &&
        portfolio.email;

    if (loading) return null;

    if (!hasProfile) {
        return (
            <div className="require-profile-fullscreen">
                <div className="require-profile-card">

                    <div className="require-profile-icon">👤</div>

                    <h1>Luo profiili ensin</h1>

                    <p>
                        Tarvitset profiilin nähdäksesi projektit ja tuodaksesi GitHub-repoja.
                    </p>

                    <button
                        className="require-profile-btn"
                        onClick={() => navigate("/")}
                    >
                        Etusivulle →
                    </button>

                </div>
            </div>
        );
    }

    return children;
}