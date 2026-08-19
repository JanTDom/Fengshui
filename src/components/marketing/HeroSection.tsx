import { ArrowRight, BadgeCheck, Check, Compass, FileCheck2, FileText, Layers, ShieldCheck, Sparkles } from "lucide-react";

interface HeroSectionProps {
  onStartAnalysis: () => void;
  onViewReportDetails: () => void;
}

export function HeroSection({ onStartAnalysis, onViewReportDetails }: HeroSectionProps) {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <div className="hero-eyebrow">
          <Sparkles size={16} />
          <span>Wielometodowy Silnik AI & Architektura Wnętrz</span>
        </div>
        <h1>Sprawdź swój dom według zasad Feng Shui</h1>
        <p>
          Wgraj rzut mieszkania lub domu (PDF, PNG, JPG). Inteligentna platforma łączy klasyczną
          Szkołę Formy (Luan Tou), siatkę 9 stref Bagua i orientację kompasową ze współczesną
          ergonomią, doświetleniem i bezkosztowymi korektami mebli.
        </p>

        <div className="hero-actions">
          <button
            className="primary-button hero-main-btn"
            type="button"
            onClick={onStartAnalysis}
          >
            <span>Rozpocznij analizę Feng Shui</span>
            <ArrowRight size={18} />
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={onViewReportDetails}
          >
            <span>Zobacz przykładowy raport</span>
            <FileText size={18} />
          </button>
        </div>

        <div className="hero-trust-strip">
          <div className="trust-item">
            <ShieldCheck size={18} />
            <span>Zero pseudonauki i magicznych obietnic</span>
          </div>
          <div className="trust-divider" />
          <div className="trust-item">
            <FileCheck2 size={18} />
            <span>Profesjonalny raport PDF od 39 zł</span>
          </div>
        </div>
      </div>

      <div className="hero-showcase-wrapper">
        <div className="hero-showcase-card">
          <div className="showcase-header">
            <div className="showcase-badge">
              <BadgeCheck size={16} />
              <span>Studio Planowania Przestrzennego</span>
            </div>
            <div className="showcase-score">
              <strong>84</strong>
              <span>/100 · Silna harmonia</span>
            </div>
          </div>

          <div className="showcase-visual">
            <div className="mockup-plan-container">
              <div className="mockup-plan-grid" />
              <div className="mockup-walls">
                {/* Visual room layout diagram */}
                <div className="mockup-room room-living">
                  <span className="room-label">Salon z aneksem (S / SE)</span>
                  <div className="mockup-furniture sofa-placed">
                    <span className="furn-dot" />
                    <span>Sofa wypoczynkowa</span>
                  </div>
                </div>
                <div className="mockup-room room-bed">
                  <span className="room-label">Sypialnia (SW)</span>
                  <div className="mockup-furniture bed-placed">
                    <span className="furn-dot good" />
                    <span>Łóżko w pozycji dominującej</span>
                  </div>
                </div>
                <div className="mockup-room room-office">
                  <span className="room-label">Gabinet (NW)</span>
                  <div className="mockup-furniture desk-placed">
                    <span className="furn-dot good" />
                    <span>Biurko z oparciem</span>
                  </div>
                </div>
              </div>
              <div className="mockup-compass-indicator">
                <Compass size={18} />
                <span>N 0°</span>
              </div>
              <div className="mockup-bagua-badge">
                <Layers size={14} />
                <span>Siatka 9 Stref Bagua</span>
              </div>
            </div>
          </div>

          <div className="showcase-insights">
            <div className="insight-row">
              <div className="insight-icon good">
                <Check size={14} />
              </div>
              <div>
                <strong>Pozycja dominująca wezgłowia (SW)</strong>
                <small>Solidne oparcie ściany nośnej, bezpieczna oś wzroku na wejście do sypialni.</small>
              </div>
            </div>
            <div className="insight-row">
              <div className="insight-icon good">
                <Sparkles size={14} />
              </div>
              <div>
                <strong>Osobisty profil Kua dopasowany do strefy pracy</strong>
                <small>Kierunek biurka wspiera skupienie i witalność (Sheng Qi).</small>
              </div>
            </div>
          </div>

          <div className="showcase-footer">
            <span>Podgląd interfejsu aplikacji roboczej</span>
            <span className="showcase-pill">Dostęp natychmiastowy po zakupie</span>
          </div>
        </div>
      </div>
    </section>
  );
}
