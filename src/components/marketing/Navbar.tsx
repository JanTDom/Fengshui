import { Compass, Sparkles, Layout } from "lucide-react";

interface NavbarProps {
  onOpenCheckout: (planId?: string) => void;
  onEnterWorkspaceDirectly?: () => void;
  hasActiveProject?: boolean;
}

export function Navbar({
  onOpenCheckout,
  onEnterWorkspaceDirectly,
  hasActiveProject
}: NavbarProps) {
  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <header className="marketing-navbar">
      <div className="marketing-container">
        <div className="navbar-inner">
          <div className="brand-logo-wrap" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="brand-crest">
              <Compass size={20} />
            </div>
            <div className="brand-text-block">
              <strong>E-FENGSHUI.PL</strong>
              <small>AI FENG SHUI & PLAN STUDIO</small>
            </div>
          </div>

          <nav aria-label="Nawigacja główna">
            <ul className="navbar-links">
              <li>
                <a href="#jak-dziala" onClick={(e) => { e.preventDefault(); scrollTo("jak-dziala"); }}>
                  Jak działa
                </a>
              </li>
              <li>
                <a href="#metodologia" onClick={(e) => { e.preventDefault(); scrollTo("metodologia"); }}>
                  Metodologia
                </a>
              </li>
              <li>
                <a href="#raport" onClick={(e) => { e.preventDefault(); scrollTo("raport"); }}>
                  Zawartość raportu
                </a>
              </li>
              <li>
                <a href="#dla-kogo" onClick={(e) => { e.preventDefault(); scrollTo("dla-kogo"); }}>
                  Dla kogo
                </a>
              </li>
              <li>
                <a href="#cennik" onClick={(e) => { e.preventDefault(); scrollTo("cennik"); }}>
                  Cennik
                </a>
              </li>
              <li>
                <a href="#faq" onClick={(e) => { e.preventDefault(); scrollTo("faq"); }}>
                  Q&A
                </a>
              </li>
            </ul>
          </nav>

          <div className="navbar-actions">
            {hasActiveProject && onEnterWorkspaceDirectly ? (
              <button
                type="button"
                className="nav-project-btn"
                onClick={onEnterWorkspaceDirectly}
              >
                <Layout size={16} />
                <span>Otwórz mój projekt</span>
              </button>
            ) : null}

            <button
              type="button"
              className="nav-cta-btn"
              onClick={() => onOpenCheckout("full")}
            >
              <Sparkles size={16} />
              <span>Rozpocznij analizę</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
