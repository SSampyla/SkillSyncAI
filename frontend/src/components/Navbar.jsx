import { Link } from "react-router-dom";
import "../styles/navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/">Etusivu</Link>
      <Link to="/portfolio">Portfolio</Link>
      <Link to="/projects">Projektit</Link>
      <Link to="/avoimet-tyopaikat">Avoimet Työpaikat</Link>
      <Link to="/jobs">Työhaut</Link>
      <span className="settings">⚙️</span>
    </nav>
  );
}