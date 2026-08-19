import { Compass, ShieldCheck, Award, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-container">
        <div className="mkt-footer-grid">
          <div className="mkt-footer-brand">
            <div className="mkt-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <div className="mkt-crest">
                <Compass size={22} />
              </div>
              <div className="mkt-brand-text">
                <strong style={{ color: "#ffffff" }}>E-FENGSHUI.PL</strong>
                <small>AI FENG SHUI & PLAN STUDIO</small>
              </div>
            </div>
            <p>
              Inżynierska platforma łącząca klasyczne Feng Shui (Luan Tou, Siatka Bagua, Kua)
              z nowoczesną architekturą wnętrz, ergonomią i automatycznym generatorem profesjonalnych ekspertyz PDF.
            </p>
            <div className="mkt-footer-badges">
              <span className="mkt-footer-badge"><Lock size={14} /> Szyfrowanie SSL</span>
              <span className="mkt-footer-badge"><Award size={14} /> Jakość Architektoniczna</span>
            </div>
          </div>

          <div className="mkt-footer-links-wrap">
            <div className="mkt-footer-col">
              <h4>Metodologia</h4>
              <ul>
                <li><a href="#metodologia">Szkoła Formy (Luan Tou)</a></li>
                <li><a href="#metodologia">Siatka 9 Stref Bagua</a></li>
                <li><a href="#metodologia">Kierunki i Kompas N</a></li>
                <li><a href="#metodologia">Ergonomia i Światło</a></li>
                <li><a href="#metodologia">Kalkulator Liczby Kua</a></li>
              </ul>
            </div>

            <div className="mkt-footer-col">
              <h4>Produkt & Narzędzia</h4>
              <ul>
                <li><a href="#jak-dziala">Jak działa proces</a></li>
                <li><a href="#raport">Zawartość raportu PDF</a></li>
                <li><a href="#cennik">Cennik pakietów</a></li>
                <li><a href="#dla-kogo">Dla Kupujących i Inwestorów</a></li>
                <li><a href="#dla-kogo">Dla Projektantów Wnętrz</a></li>
              </ul>
            </div>

            <div className="mkt-footer-col">
              <h4>Zaufanie & Prawo</h4>
              <ul>
                <li><a href="#faq">Polityka prywatności</a></li>
                <li><a href="#faq">Regulamin świadczenia usług</a></li>
                <li><a href="#faq">Zgoda konsumencka</a></li>
                <li><a href="#faq">Płatności BLIK / P24</a></li>
                <li><a href="mailto:kontakt@e-fengshui.pl">Kontakt i wsparcie</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mkt-footer-bottom">
          <div className="mkt-footer-legal">
            <p>© {new Date().getFullYear()} e-fengshui.pl. Wszelkie prawa zastrzeżone.</p>
            <p className="mkt-footer-sublegal">
              Plan Harmonii i e-fengshui.pl stanowią zaawansowane narzędzie informacyjno-doradcze oparte na tradycyjnych zasadach wiedzy przestrzennej Feng Shui oraz współczesnej ergonomii.
            </p>
          </div>
          <div className="mkt-footer-safe-tag">
            <ShieldCheck size={16} />
            <span>100% Bezpieczna Płatność</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
