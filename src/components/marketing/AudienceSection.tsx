import { Building2, Check, ChevronRight, Home, Sparkles } from "lucide-react";

interface AudienceSectionProps {
  onSelectAudience: () => void;
}

const audienceCards = [
  {
    id: "buyers",
    title: "Kupujesz mieszkanie lub dom",
    tag: "Przed podpisaniem umowy",
    description: "Sprawdź, czy rzut deweloperski lub z rynku wtórnego nie ma ukrytych wad funkcjonalnych, których nie da się tanio naprawić.",
    points: [
      "Wykrycie brakujących stref w bryle lokalu",
      "Ocena doświetlenia i osi drzwi-okna",
      "Oszacowanie kosztu ewentualnych korekt"
    ],
    icon: Home
  },
  {
    id: "renovators",
    title: "Planujesz remont lub aranżację",
    tag: "Przed wejściem ekipy",
    description: "Ustaw meble w pozycjach dominujących (wezgłowie, biurko) i zaplanuj strefy snu, pracy oraz wypoczynku bez chaosu.",
    points: [
      "Pozycja dominująca dla łóżka i miejsca pracy",
      "Korekty bez wyburzania ścian nośnych",
      "Dobór 3 warstw oświetlenia i palet barw"
    ],
    icon: Sparkles
  },
  {
    id: "professionals",
    title: "Projektanci, architekci i agenci",
    tag: "Narzędzie B2B & Argumentacja",
    description: "Zyskaj elegancki, obiektywny raport audytowy jako merytoryczne uzasadnienie koncepcji dla inwestora lub klienta.",
    points: [
      "Gotowy PDF z rejestrem źródeł metod",
      "Weryfikacja ścian działowych vs nośnych",
      "Przejrzysty ranking przy porównaniu 3 lokali"
    ],
    icon: Building2
  }
];

export function AudienceSection({ onSelectAudience }: AudienceSectionProps) {
  return (
    <section className="audience-section" id="dla-kogo">
      <div className="section-heading">
        <span className="section-kicker">Zastosowanie</span>
        <h2>Dla kogo został stworzony e-fengshui.pl?</h2>
        <p>Precyzyjna analiza przestrzenna dopasowana do Twojego momentu decyzyjnego.</p>
      </div>

      <div className="audience-grid">
        {audienceCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.id} className="audience-card">
              <div className="audience-card-top">
                <Icon size={28} />
                <span className="audience-tag">{card.tag}</span>
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <ul className="audience-points">
                {card.points.map((pt) => (
                  <li key={pt}>
                    <Check size={16} />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="ghost-button"
                onClick={onSelectAudience}
              >
                Sprawdź swój plan
                <ChevronRight size={16} />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
