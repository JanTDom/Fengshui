import { Compass, Grid3X3, Lightbulb, Route } from "lucide-react";

const fengShuiPillars = [
  {
    title: "Szkoła Formy (Luan Tou)",
    subtitle: "Oparcie, wejście i przepływ Qi",
    description: "Analiza pozycji bezpiecznej łóżka i biurka, eliminacja ostrych osi natarcia oraz naturalne ciągi komunikacyjne.",
    icon: Route
  },
  {
    title: "Siatka 9 Stref Bagua",
    subtitle: "Podział przestrzeni na strefy życia",
    description: "Precyzyjne nałożenie mapy 9 sektorów na plan lokalu z uwzględnieniem funkcji pomieszczeń i braków w bryle.",
    icon: Grid3X3
  },
  {
    title: "Kierunki i Kompas",
    subtitle: "Orientacja względem Północy",
    description: "Analiza stron świata, doświetlenia naturalnego i doboru żywiołów wspierających poszczególne strefy.",
    icon: Compass
  },
  {
    title: "Ergonomia i Architektura",
    subtitle: "Praktyczne kryteria komfortu",
    description: "Połączenie tradycji ze współczesną wiedzą o świetle, akustyce, prywatności i bezkosztowych zmianach.",
    icon: Lightbulb
  }
];

export function MethodologySection() {
  return (
    <section className="pillar-bar" id="metodologia" aria-label="Cztery filary analizy">
      <div className="pillar-bar-header">
        <span className="section-kicker">Rzetelna Metodologia</span>
        <h2>Jedna platforma, cztery zintegrowane filary oceny</h2>
        <p>
          Łączymy rygor klasycznych szkół Feng Shui z inżynierską precyzją nowoczesnej architektury wnętrz.
        </p>
      </div>
      <div className="pillar-grid">
        {fengShuiPillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <article key={pillar.title} className="pillar-card">
              <div className="pillar-icon-box">
                <Icon size={24} />
              </div>
              <h3>{pillar.title}</h3>
              <span className="pillar-sub">{pillar.subtitle}</span>
              <p>{pillar.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
