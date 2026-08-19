import { Compass } from "lucide-react";

export function Footer() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-container">
        <div className="mkt-footer-grid">
          <div className="mkt-footer-brand">
            <div className="mkt-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <div className="mkt-crest">
                <Compass size={20} />
              </div>
              <div className="mkt-brand-text">
                <strong>E-FENGSHUI.PL</strong>
                <small>AI FENG SHUI & PLAN STUDIO</small>
              </div>
            </div>
            <p>
              Pierwsza w Polsce platforma łącząca klasyczne Feng Shui (Luan Tou, Bagua, Kua)
              z nowoczesną architekturą wnętrz, ergonomią i automatycznym generatorem raportów PDF.
            </p>
          </div>

          <div className="mkt-footer-links-wrap">
            <div className="mkt-footer-col">
              <h4>Metodologia</h4>
              <ul>
                <li><a href="#metodologia">Szkoła Formy</a></li>
                <li><a href="#metodologia">Siatka 9 Stref Bagua</a></li>
                <li><a href="#metodologia">Kierunki i Kompas N</a></li>
                <li><a href="#metodologia">Ergonomia i Światło</a></li>
              </ul>
            </div>

            <div className="mkt-footer-col">
              <h4>Produkt</h4>
              <ul>
                <li><a href="#jak-dziala">Jak działa proces</a></li>
                <li><a href="#raport">Zawartość raportu PDF</a></li>
                <li><a href="#cennik">Cennik pakietów</a></li>
                <li><a href="#dla-kogo">Dla projektantów</a></li>
              </ul>
            </div>

            <div className="mkt-footer-col">
              <h4>Zaufanie & Prawo</h4>
              <ul>
                <li><a href="#faq">Polityka prywatności</a></li>
                <li><a href="#faq">Regulamin serwisu</a></li>
                <li><a href="#faq">Zgoda konsumencka</a></li>
                <li><a href="#faq">Kontakt i pomoc</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mkt-footer-bottom">
          <span>© {new Date().getFullYear()} e-fengshui.pl. Wszelkie prawa zastrzeżone.</span>
          <span>Analiza informacyjno-doradcza oparta na tradycyjnych zasadach Feng Shui i architekturze.</span>
        </div>
      </div>
    </footer>
  );
}
