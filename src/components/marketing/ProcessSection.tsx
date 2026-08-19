import { CreditCard, FileUp, LayoutGrid, Sparkles, ArrowRight } from "lucide-react";

interface ProcessSectionProps {
  onStart: () => void;
}

const steps = [
  {
    step: "01",
    title: "Kup dostęp",
    outcome: "Wybierasz pakiet dostosowany do mieszkania, domu lub porównania 3 lokali. Płatność BLIK, P24 lub kartą.",
    icon: CreditCard
  },
  {
    step: "02",
    title: "Wgraj plan domu",
    outcome: "Wgrywasz rzut w formacie PDF, JPG, PNG lub zdjęcie z telefonu. System kalibruje proporcje.",
    icon: FileUp
  },
  {
    step: "03",
    title: "Oznacz pomieszczenia i meble",
    outcome: "Obracasz igłę północy i rozmieszczasz na rzucie precyzyjne symbole łóżek, biurek, sof i drzwi.",
    icon: LayoutGrid
  },
  {
    step: "04",
    title: "Przeprowadź analizę Feng Shui",
    outcome: "Uruchamiasz analizę: otrzymujesz natychmiastowe wskazówki na rzucie oraz 12-stronicowy raport PDF.",
    icon: Sparkles
  }
];

export function ProcessSection({ onStart }: ProcessSectionProps) {
  return (
    <section className="process-section" id="jak-dziala" aria-label="Jak działa proces">
      <div className="marketing-container">
        <div className="section-heading">
          <span className="section-kicker">Prosty i przejrzysty proces</span>
          <h2>Od rzutu do gotowej ekspertyzy w 4 krokach</h2>
          <p>
            Kupujesz dostęp, przechodzisz do profesjonalnego studia planistycznego i wykonujesz
            analizę w skupieniu bez reklam i rozpraszaczy.
          </p>
        </div>

        <div className="process-steps-grid">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="process-step-card">
                <div className="step-number-badge">
                  <span>{item.step}</span>
                </div>
                <div className="step-icon-box">
                  <Icon size={24} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.outcome}</p>
              </div>
            );
          })}
        </div>

        <div className="process-cta-bar">
          <span>Gotowy, aby sprawdzić swoje wnętrze?</span>
          <button type="button" className="primary-button" onClick={onStart}>
            Rozpocznij teraz
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
