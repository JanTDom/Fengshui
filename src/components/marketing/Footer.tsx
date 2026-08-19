export function Footer() {
  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-brand-box">
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
          <p>
            Profesjonalna platforma analityczna łącząca tradycję Szkoły Form i Bagua z nowoczesną
            architekturą wnętrz, ergonomią i oświetleniem.
          </p>
        </div>

        <div className="footer-nav-col">
          <strong>Nawigacja</strong>
          <a href="#jak-dziala" onClick={(e) => { e.preventDefault(); scrollToId("jak-dziala"); }}>Jak działa proces</a>
          <a href="#metodologia" onClick={(e) => { e.preventDefault(); scrollToId("metodologia"); }}>Metodologia analizy</a>
          <a href="#raport" onClick={(e) => { e.preventDefault(); scrollToId("raport"); }}>Zawartość raportu PDF</a>
          <a href="#dla-kogo" onClick={(e) => { e.preventDefault(); scrollToId("dla-kogo"); }}>Zastosowanie dla kogo</a>
          <a href="#cennik" onClick={(e) => { e.preventDefault(); scrollToId("cennik"); }}>Cennik pakietów</a>
          <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToId("faq"); }}>Pytania i odpowiedzi</a>
        </div>

        <div className="footer-legal-col">
          <strong>Prywatność i transparentność</strong>
          <p>Pliki rzutów przetwarzane są poufnie w bezpiecznej infrastrukturze chmurowej.</p>
          <small>
            e-fengshui.pl jest usługą informacyjno-raportową. Nie stanowi gwarancji określonych
            zdarzeń losowych ani ekspertyzy konstrukcyjno-budowlanej.
          </small>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} e-fengshui.pl. Wszelkie prawa zastrzeżone.</span>
        <span>Wielometodowy silnik AI Feng Shui</span>
      </div>
    </footer>
  );
}
