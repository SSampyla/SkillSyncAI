import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  return (
    <>
      <Navbar />
      <hr style={{ margin: "0", border: "none", height: "1px", background: "rgba(148, 163, 184, 0.2)" }} />
      
      <div className="home-container">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-icon">🤖</span>
              <span>Tekoäly-pohjainen osaamisen arviointi</span>
            </div>
            <h1 className="hero-title">
              <span className="gradient-text">SkillSync AI</span>
            </h1>
            <p className="hero-subtitle">
              Kuroa umpeen kuilu todellisen osaamisesi ja työmarkkinoiden vaatimusten välillä
            </p>
            <p className="hero-description">
              Tekoäly tulkkina opiskelijan osaamisen ja työnantajan tarpeiden välillä – 
              löydä täydellinen match ja vie urasi seuraavalle tasolle.
            </p>
            <div className="hero-buttons">
              <Link to="/portfolio" className="btn btn-primary">
                📁 Luo Portfolio
              </Link>
              <Link to="/avoimet-tyopaikat" className="btn btn-secondary">
                💼 Selaa Työpaikkoja
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card card-1">
              <div className="card-icon">🎓</div>
              <div className="card-text">Osaaminen</div>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">🤝</div>
              <div className="card-text">AI Match</div>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon">💼</div>
              <div className="card-text">Työpaikka</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <h2 className="section-title">Miten SkillSync AI toimii?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Osaamisen Analysointi</h3>
              <p>
                Tekoäly analysoi portfoliosi, projektisi ja taitosi automaattisesti – 
                ei enää tylsiä lomakkeita tai manuaalista datansyöttöä.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Älykäs Matching</h3>
              <p>
                Kehittynyt algoritmi vertaa osaamistasi työpaikkojen vaatimuksiin ja 
                löytää sinulle parhaat mahdollisuudet reaaliajassa.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Osaamispuutteiden Tunnistus</h3>
              <p>
                Näe selkeästi, mitä taitoja sinulta vielä puuttuu haluamaasi työhön ja 
                saa suosituksia kehittymiseen.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✍️</div>
              <h3>AI-generoidut Hakemukset</h3>
              <p>
                Luo räätälöityjä motivaatiokirjeitä ja hakemuksia sekunneissa – 
                tekoäly huolehtii että osaamisesi tulee esiin parhaalla tavalla.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Uran Kehitys</h3>
              <p>
                Seuraa omaa kehitystäsi, aseta tavoitteita ja näe miten osaamisesi 
                kasvaa ajan myötä.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Reaaliaikaiset Työpaikat</h3>
              <p>
                Pääsy ajankohtaisiin työpaikkailmoituksiin, jotka vastaavat 
                profiiliasi ja osaamistasi täydellisesti.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="benefits-section">
          <div className="benefits-content">
            <h2 className="section-title">Miksi valita SkillSync AI?</h2>
            <div className="benefits-list">
              <div className="benefit-item">
                <div className="benefit-number">01</div>
                <div className="benefit-text">
                  <h4>Säästä aikaa</h4>
                  <p>Automatisoi portfolion luominen ja hakemusten kirjoittaminen</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-number">02</div>
                <div className="benefit-text">
                  <h4>Paranna mahdollisuuksia</h4>
                  <p>Kohdenna hakemuksesi täydellisesti työnantajan tarpeisiin</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-number">03</div>
                <div className="benefit-text">
                  <h4>Kehity ammattilaisena</h4>
                  <p>Tunnista kehityskohteet ja saa räätälöityjä oppimissuosituksia</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-number">04</div>
                <div className="benefit-text">
                  <h4>Datavetoinen päätöksenteko</h4>
                  <p>Tee uravalintoja perustuen todelliseen dataan ja AI-analyysiin</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>Aloita matkasi tänään</h2>
            <p>Liity satoihin opiskelijoihin, jotka ovat jo löytäneet unelmiensa työpaikan SkillSync AI:n avulla</p>
            <div className="cta-buttons">
              <Link to="/portfolio" className="btn btn-primary btn-large">
                Luo Portfolio Nyt →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}