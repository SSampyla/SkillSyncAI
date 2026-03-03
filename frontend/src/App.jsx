import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Portfolio from "./pages/Portfolio";
import Jobs from "./pages/Työhaut";
import AvoimetTyopaikat from "./pages/AvoimetTyopaikat";
import ProjectGallery from "./components/ProjectGallery";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/projects" element={<ProjectGallery />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/avoimet-tyopaikat" element={<AvoimetTyopaikat />} />
      </Routes>
    </Router>
  );
}

export default App;