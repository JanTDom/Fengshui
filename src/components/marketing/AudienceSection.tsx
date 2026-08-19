import { Check, Home, PenTool, Wrench } from "lucide-react";

interface AudienceSectionProps {
  onSelectAudience: () => void;
}

const audiences = [
  {
    title: "Kupujący mieszkanie lub dom",
    description: "Zanim podpiszesz umowę deweloperską lub przedwstępną, sprawdź układ ścian, strefy wejścia i potencjał energetyczny.",
    checklist: [
      "Ocena układu deweloperskiego",
      "Wykrycie brakujących stref Bagua",
      "Rekomendacja decyzyjna: kupić / negocjować"
    ],
    icon: Home
  },
  {
    title: "Osoby przed remontem i aranżacją",
    description: "Zoptymalizuj układ mebli, pozycję łóżka i biurka bez kosztownych wyburzeń i nietrafionych zakupów.",
    checklist: [
      "Pozycje bezpieczne dla domowników",
      "Dobór oświetlenia (2700K vs 4000K)",
      "Bezkosztowe korekty ustawień mebli"
    ],
    icon: Wrench
  },
  {
    title: "Architekci i projektanci wnętrz",
    description: "Wzbogać swoje koncepcje o audyt tradycyjnych zasad Formy i precyzyjne uzasadnienie kierunków funkcjonalnych.",
    checklist: [
      "Raport PDF do włączenia do projektu",
      "Analiza kompasowa i żywiołów Wu Xing",
      "Dodatkowa wartość merytoryczna dla klienta"
    ],
    icon: PenTool
  }
];

export function AudienceSection({ onSelectAudience }: AudienceSectionProps) {
  return (
    <section className="mkt-audience-section" id="dla-kogo">
      <div className="mkt-container">
        <div className="mkt-section-head">
          <span className="mkt-kicker">Dedykowane Rozwiązania</span>
          <h2>Dla kogo powstało e-fengshui.pl?</h2>
          <p>
            Stworzone dla każdego, kto podejmuje ważne decyzje dotyczące przestrzeni do życia i pracy.
          </p>
        </div>

        <div className="mkt-audience-grid">
          {audiences.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="mkt-audience-card">
                <div className="mkt-audience-icon">
                  <Icon size={24} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <ul className="mkt-checklist">
                  {item.checklist.map((point) => (
                    <li key={point}>
                      <Check size={16} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="mkt-btn-secondary"
                  onClick={onSelectAudience}
                >
                  Sprawdź swój lokal
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
