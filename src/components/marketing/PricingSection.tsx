import { Check } from "lucide-react";
import { pricePlans } from "../../data";

interface PricingSectionProps {
  onSelectPlan: (planId: string) => void;
}

export function PricingSection({ onSelectPlan }: PricingSectionProps) {
  return (
    <section className="mkt-pricing-section" id="cennik">
      <div className="mkt-container">
        <div className="mkt-section-head">
          <span className="mkt-kicker">Przejrzysty Cennik</span>
          <h2>Wybierz pakiet i odblokuj studio analizy</h2>
          <p>Płacisz raz za konkretną analizę lokalu. Natychmiastowy dostęp do generatora i eksportu PDF.</p>
        </div>

        <div className="mkt-pricing-grid">
          {pricePlans.map((plan) => (
            <article
              key={plan.id}
              className={`mkt-price-card ${plan.featured ? "featured" : ""}`}
            >
              {plan.featured ? <span className="mkt-plan-flag">Najczęściej wybierany</span> : null}
              <h3>{plan.title}</h3>
              <div className="mkt-price-val">
                <strong>{plan.price}</strong>
                {plan.period ? <small>{plan.period}</small> : null}
              </div>
              <p className="mkt-price-note">{plan.note}</p>
              <ul className="mkt-price-features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={plan.featured ? "mkt-btn-primary mkt-w-full" : "mkt-btn-secondary mkt-w-full"}
                onClick={() => onSelectPlan(plan.id)}
              >
                Wybierz pakiet i zacznij
              </button>
            </article>
          ))}
        </div>

        <div className="mkt-trust-bar">
          <span>🔒 Bezpieczne szyfrowanie SSL</span>
          <span>⚡ Odblokowanie studia natychmiast po zamówieniu</span>
          <span>🧾 Faktura VAT dla firm i biur projektowych</span>
        </div>
      </div>
    </section>
  );
}
