import { Compass, Eye, Grid, Sparkles } from "lucide-react";

const pillars = [
  {
    title: "Szkoła Formy (Luan Tou)",
    tag: "Oparcie, wejście i przepływ Qi",
    description: "Analiza pozycji bezpiecznej łóżka i biurka, eliminacja ostrych osi natarcia oraz naturalne ciągi komunikacyjne.",
    icon: Eye
  },
  {
    title: "Siatka 9 Stref Bagua",
    tag: "Podział przestrzeni na strefy życia",
    description: "Precyzyjne nałożenie mapy 9 sektorów na plan lokalu z uwzględnieniem funkcji pomieszczeń i braków w bryle.",
    icon: Grid
  },
  {
    title: "Kierunki i Kompas",
    tag: "Orientacja względem północy",
    description: "Analiza stron świata, doświetlenia naturalnego i doboru żywiołów wspierających poszczególne strefy.",
    icon: Compass
  },
  {
    title: "Ergonomia i Architektura",
    tag: "Praktyczne kryteria komfortu",
    description: "Połączenie tradycji ze współczesną wiedzą o świetle, akustyce, prywatności i bezkosztowych zmianach.",
    icon: Sparkles
  }
];

export function MethodologySection() {
  return (
    <section className="mkt-methodology-section" id="metodologia">
      <div className="mkt-container">
        <div className="mkt-section-head">
          <span className="mkt-kicker">Rzetelna Metodologia</span>
          <h2>Jedna platforma, cztery zintegrowane filary oceny</h2>
          <p>
            Łączymy rygor klasycznych szkół Feng Shui z inżynierską precyzją nowoczesnej architektury wnętrz.
          </p>
        </div>

        <div className="mkt-method-grid">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article key={pillar.title} className="mkt-method-card">
                <div className="mkt-method-icon">
                  <Icon size={22} />
                </div>
                <h3>{pillar.title}</h3>
                <span className="mkt-method-tag">{pillar.tag}</span>
                <p>{pillar.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
