import { Compass, Layout } from "lucide-react";

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
    <header className="mkt-navbar">
      <div className="mkt-container">
        <div className="mkt-navbar-inner">
          <div className="mkt-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="mkt-crest">
              <Compass size={20} />
            </div>
            <div className="mkt-brand-text">
              <strong>E-FENGSHUI.PL</strong>
              <small>AI FENG SHUI & PLAN STUDIO</small>
            </div>
          </div>

          <nav aria-label="Nawigacja główna">
            <ul className="mkt-nav-links">
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
              <li>
                <button
                  type="button"
                  className="mkt-nav-link-button"
                  onClick={() => onOpenCheckout("full")}
                >
                  Rozpocznij
                </button>
              </li>
            </ul>
          </nav>

          <div className="mkt-nav-actions">
            {hasActiveProject && onEnterWorkspaceDirectly ? (
              <button
                type="button"
                className="mkt-btn-secondary mkt-btn-compact"
                onClick={onEnterWorkspaceDirectly}
              >
                <Layout size={16} />
                <span>Otwórz mój projekt</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
