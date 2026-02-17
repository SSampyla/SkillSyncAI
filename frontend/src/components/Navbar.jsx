import { Link } from "react-router-dom";
import "../styles/navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/portfolio">portfolio</Link>
      <Link to="/jobs">Työhaut</Link>
      <span className="settings">⚙️</span>
    </nav>
  );
}