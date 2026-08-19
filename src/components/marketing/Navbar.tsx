import { Sparkles } from "lucide-react";

interface NavbarProps {
  onOpenCheckout: (planId?: string) => void;
  onEnterWorkspaceDirectly?: () => void;
  hasActiveProject?: boolean;
}

export function Navbar({ onOpenCheckout, onEnterWorkspaceDirectly, hasActiveProject }: NavbarProps) {
  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <header className="site-header" aria-label="Główna nawigacja">
      <a className="brand" href="#top" aria-label="e-fengshui.pl">
        <span className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
        <span>
          <strong>e-fengshui.pl</strong>
          <small>AI Feng Shui & Plan Studio</small>
        </span>
      </a>

      <nav className="desktop-nav">
        <a href="#jak-dziala" onClick={(e) => { e.preventDefault(); scrollToId("jak-dziala"); }}>Jak działa</a>
        <a href="#metodologia" onClick={(e) => { e.preventDefault(); scrollToId("metodologia"); }}>Metodologia</a>
        <a href="#raport" onClick={(e) => { e.preventDefault(); scrollToId("raport"); }}>Zawartość raportu</a>
        <a href="#dla-kogo" onClick={(e) => { e.preventDefault(); scrollToId("dla-kogo"); }}>Dla kogo</a>
        <a href="#cennik" onClick={(e) => { e.preventDefault(); scrollToId("cennik"); }}>Cennik</a>
        <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToId("faq"); }}>Q&A</a>
      </nav>

      <div className="header-actions">
        {hasActiveProject && onEnterWorkspaceDirectly ? (
          <button
            type="button"
            className="secondary-button compact-btn"
            onClick={onEnterWorkspaceDirectly}
          >
            Otwórz mój projekt
          </button>
        ) : null}
        <button
          className="header-cta"
          type="button"
          onClick={() => onOpenCheckout("full")}
        >
          <Sparkles size={16} />
          <span>Rozpocznij analizę</span>
        </button>
      </div>
    </header>
  );
}
