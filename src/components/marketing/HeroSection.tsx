import { ArrowRight, BadgeCheck, Check, Compass, FileCheck2, FileText, Layers, ShieldCheck, Sparkles } from "lucide-react";

interface HeroSectionProps {
  onStartAnalysis: () => void;
  onViewReportDetails: () => void;
}

export function HeroSection({ onStartAnalysis, onViewReportDetails }: HeroSectionProps) {
  return (
    <section className="mkt-hero" id="top">
      <div className="mkt-container">
        <div className="mkt-hero-grid">
          <div className="mkt-hero-copy">
            <div className="mkt-eyebrow">
              <Sparkles size={16} />
              <span>Wielometodowy Silnik AI & Architektura Wnętrz</span>
            </div>
            <h1 className="mkt-hero-title">Sprawdź swój dom według zasad Feng Shui</h1>
            <p className="mkt-hero-lead">
              Wgraj rzut mieszkania lub domu (PDF, PNG, JPG). Inteligentna platforma łączy klasyczną
              Szkołę Formy (Luan Tou), siatkę 9 stref Bagua i orientację kompasową ze współczesną
              ergonomią, doświetleniem i bezkosztowymi korektami mebli.
            </p>

            <div className="mkt-hero-actions">
              <button
                className="mkt-btn-primary"
                type="button"
                onClick={onStartAnalysis}
              >
                <span>Rozpocznij analizę Feng Shui</span>
                <ArrowRight size={18} />
              </button>
              <button
                className="mkt-btn-secondary"
                type="button"
                onClick={onViewReportDetails}
              >
                <span>Zobacz przykładowy raport</span>
                <FileText size={18} />
              </button>
            </div>

            <div className="mkt-trust-strip">
              <div className="mkt-trust-item">
                <ShieldCheck size={18} />
                <span>Zero pseudonauki i magicznych obietnic</span>
              </div>
              <div className="mkt-trust-divider" />
              <div className="mkt-trust-item">
                <FileCheck2 size={18} />
                <span>Profesjonalny raport PDF od 39 zł</span>
              </div>
            </div>
          </div>

          <div className="mkt-showcase-card">
            <div className="mkt-showcase-head">
              <div className="mkt-showcase-badge">
                <BadgeCheck size={16} />
                <span>Studio Planowania Przestrzennego</span>
              </div>
              <div className="mkt-score-pill">
                <strong>84</strong>
                <span>/100 · Silna harmonia</span>
              </div>
            </div>

            <div className="mkt-plan-stage">
              <div className="mkt-cad-plan-diagram">
                {/* 9 Bagua Zones Background Grid */}
                <div className="mkt-bagua-grid-overlay">
                  <div className="mkt-bagua-cell"><span>SE · Bogactwo</span></div>
                  <div className="mkt-bagua-cell"><span>S · Sława</span></div>
                  <div className="mkt-bagua-cell"><span>SW · Relacje</span></div>
                  <div className="mkt-bagua-cell"><span>E · Zdrowie</span></div>
                  <div className="mkt-bagua-cell"><span>Tai Ji · Centrum</span></div>
                  <div className="mkt-bagua-cell"><span>W · Dzieci</span></div>
                  <div className="mkt-bagua-cell"><span>NE · Wiedza</span></div>
                  <div className="mkt-bagua-cell"><span>N · Kariera</span></div>
                  <div className="mkt-bagua-cell"><span>NW · Pomocni</span></div>
                </div>

                {/* Rooms Layout */}
                <div className="mkt-cad-rooms">
                  <div className="mkt-cad-room mkt-room-living">
                    <span className="mkt-room-tag">Salon z aneksem (S / SE)</span>
                    <div className="mkt-cad-item">
                      <span className="mkt-item-dot" />
                      <span>Sofa wypoczynkowa</span>
                    </div>
                  </div>
                  <div className="mkt-cad-room">
                    <span className="mkt-room-tag">Sypialnia (SW)</span>
                    <div className="mkt-cad-item">
                      <span className="mkt-item-dot" />
                      <span>Łóżko (ściana nośna)</span>
                    </div>
                  </div>
                  <div className="mkt-cad-room">
                    <span className="mkt-room-tag">Gabinet (NW)</span>
                    <div className="mkt-cad-item">
                      <span className="mkt-item-dot" />
                      <span>Biurko dowodzenia</span>
                    </div>
                  </div>
                </div>

                {/* Overlays */}
                <div className="mkt-compass-floating">
                  <Compass size={14} />
                  <span>N 0°</span>
                </div>
                <div className="mkt-bagua-badge-floating">
                  <Layers size={13} />
                  <span>Siatka 9 Stref Bagua</span>
                </div>
              </div>
            </div>

            <div className="mkt-showcase-insights">
              <div className="mkt-insight-row">
                <div className="mkt-insight-icon">
                  <Check size={13} />
                </div>
                <div>
                  <strong>Pozycja dominująca wezgłowia (SW)</strong>
                  <small>Solidne oparcie ściany nośnej, bezpieczna oś wzroku na wejście do sypialni.</small>
                </div>
              </div>
              <div className="mkt-insight-row">
                <div className="mkt-insight-icon">
                  <Sparkles size={13} />
                </div>
                <div>
                  <strong>Osobisty profil Kua dopasowany do strefy pracy</strong>
                  <small>Kierunek biurka wspiera skupienie i witalność (Sheng Qi).</small>
                </div>
              </div>
            </div>

            <div className="mkt-showcase-footer">
              <span>Podgląd interfejsu aplikacji roboczej</span>
              <span className="mkt-footer-pill">Dostęp natychmiastowy po zakupie</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
