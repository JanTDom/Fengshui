import { useState } from "react";
import { ChevronDown, HelpCircle, Mail } from "lucide-react";

const faqs = [
  {
    q: "W jakim formacie mogę wgrać plan mieszkania lub domu?",
    a: "Obsługujemy pliki PDF (np. rzut deweloperski, projekt budowlany lub aranżacyjny), pliki graficzne PNG, JPG, WEBP oraz wyraźne zdjęcia rzutu wykonane smartfonem. System automatycznie dopasowuje proporcje."
  },
  {
    q: "Czy muszę znać dokładny kąt północy przed rozpoczęciem?",
    a: "Nie. Możesz skorzystać z oznaczenia róży wiatrów na rzucie deweloperskim lub dopasować kierunek intuicyjną igłą magnetyczną w naszym edytorze z dokładnością do 1 stopnia."
  },
  {
    q: "Co jeśli w rzucie deweloperskim brakuje umeblowania?",
    a: "W dedykowanym Studio Planowania możesz w kilka sekund nanieść i obrócić precyzyjne symbole łóżek, biurek, sof, stołów, szaf i drzwi, aby przetestować optymalne warianty."
  },
  {
    q: "Jak szybko po zakupie otrzymam raport i dostęp?",
    a: "Dostęp do Studia Planowania otrzymujesz natychmiast po opłaceniu (BLIK, Przelewy24, karta). Po oznaczeniu mebli klikasz 'ANALIZUJ FENG SHUI' i pobierasz gotowy raport PDF w ok. 15 sekund."
  },
  {
    q: "Czy audyt wymaga kupowania figurek, dzwonków lub chińskich amuletów?",
    a: "Zdecydowanie nie. Opieramy się na klasycznej Szkole Formy (Luan Tou), siatce Bagua oraz nowoczesnej architekturze wnętrz, ergonomii, naturalnym doświetleniu i psychologii przestrzeni."
  },
  {
    q: "Czy otrzymam fakturę VAT za zamówiony raport?",
    a: "Tak, wystawiamy pełne faktury VAT dla firm i jednoosobowych działalności gospodarczych (architektów, projektantów wnętrz, pośredników nieruchomości i inwestorów)."
  }
];

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  function toggleIdx(idx: number) {
    setOpenIdx(openIdx === idx ? null : idx);
  }

  return (
    <section className="mkt-faq-section" id="faq">
      <div className="mkt-container">
        <div className="mkt-section-head">
          <span className="mkt-kicker">Często Zadawane Pytania</span>
          <h2>Wszystko, co warto wiedzieć przed analizą</h2>
          <p>
            Przejrzyste zasady działania, wymagania techniczne i metodologia platformy e-fengshui.pl.
          </p>
        </div>

        <div className="mkt-faq-accordion-list">
          {faqs.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <article
                key={item.q}
                className={`mkt-faq-item ${isOpen ? "open" : ""}`}
                onClick={() => toggleIdx(idx)}
              >
                <button
                  type="button"
                  className="mkt-faq-question-btn"
                  aria-expanded={isOpen}
                >
                  <div className="mkt-faq-q-left">
                    <HelpCircle size={18} className="mkt-faq-q-icon" />
                    <span>{item.q}</span>
                  </div>
                  <ChevronDown size={18} className={`mkt-faq-arrow ${isOpen ? "rotated" : ""}`} />
                </button>
                {isOpen ? (
                  <div className="mkt-faq-answer-body">
                    <p>{item.a}</p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        <div className="mkt-faq-help-box">
          <Mail size={20} />
          <div>
            <strong>Masz nietypowy układ lokalu lub dodatkowe pytania?</strong>
            <span> Napisz do nas na <a href="mailto:kontakt@multinewsroom.pl">kontakt@multinewsroom.pl</a> — odpowiadamy w ciągu 24h.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
