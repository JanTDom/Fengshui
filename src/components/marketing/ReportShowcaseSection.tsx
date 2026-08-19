import { BadgeCheck, FileText, Lightbulb, Map, ShieldCheck } from "lucide-react";

const reportFeatures = [
  {
    title: "Diagnoza pokój po pokoju",
    description: "Każda strefa (salon, sypialnia, kuchnia, gabinet) otrzymuje ocenę potencjału, listę atutów i konkretne korekty mebli.",
    icon: FileText
  },
  {
    title: "Mapa 9 stref na Twoim rzucie",
    description: "Graficzna nakładka siatki Bagua obrócona zgodnie z rzeczywistą orientacją północy Twojego mieszkania.",
    icon: Map
  },
  {
    title: "Lista zmian bez remontu",
    description: "Zestawienie natychmiastowych działań: przestawienie biurka, zmiana żarówek, dodanie roślin i tkanin akustycznych.",
    icon: Lightbulb
  },
  {
    title: "Rejestr źródeł i poziomów pewności",
    description: "Pełna transparentność — wiesz dokładnie, które wnioski wynikają ze Szkoły Formy, a które z ergonomii i światła.",
    icon: BadgeCheck
  }
];

export function ReportShowcaseSection() {
  return (
    <section className="report-showcase-section" id="raport">
      <div className="section-heading">
        <span className="section-kicker">Zawartość raportu</span>
        <h2>Dokument decyzyjny o jakości wydawniczej</h2>
        <p>
          Otrzymujesz elegancki, uporządkowany raport PDF gotowy do druku lub omówienia z architektem,
          inwestorem czy partnerem.
        </p>
      </div>

      <div className="deliverables-grid">
        {reportFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title} className="deliverable-card">
              <div className="deliverable-icon">
                <Icon size={26} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          );
        })}
      </div>

      <div className="report-security-badge">
        <ShieldCheck size={20} />
        <div>
          <strong>Prywatność i ochrona danych:</strong>
          <span> Twoje rzuty i dane domowników są przetwarzane w szyfrowanej infrastrukturze i nie są publicznie udostępniane.</span>
        </div>
      </div>
    </section>
  );
}
