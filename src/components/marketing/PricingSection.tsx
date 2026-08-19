import { Check, ShieldCheck, Zap } from "lucide-react";
import { pricePlans } from "../../data";

interface PricingSectionProps {
  onSelectPlan: (planId: string) => void;
}

export function PricingSection({ onSelectPlan }: PricingSectionProps) {
  return (
    <section className="pricing-section" id="cennik">
      <div className="section-heading">
        <span className="section-kicker">Przejrzysty Cennik</span>
        <h2>Wybierz pakiet i odblokuj studio analizy</h2>
        <p>Płacisz raz za konkretną analizę lokalu. Natychmiastowy dostęp do generatora i eksportu PDF.</p>
      </div>

      <div className="pricing-grid-clean">
        {pricePlans.map((plan) => (
          <article
            key={plan.id}
            className={`price-card-clean ${plan.featured ? "featured" : ""}`}
          >
            {plan.featured ? <span className="clean-plan-flag">Najczęściej wybierany</span> : null}
            <h3>{plan.title}</h3>
            <div className="clean-plan-price">
              <strong>{plan.price}</strong>
              {plan.period ? <small>{plan.period}</small> : null}
            </div>
            <p className="clean-plan-note">{plan.note}</p>
            <ul className="clean-plan-features">
              {plan.features.map((feature) => (
                <li key={feature}>
                  <Check size={16} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={plan.featured ? "primary-button full-width" : "secondary-button full-width"}
              onClick={() => onSelectPlan(plan.id)}
            >
              Wybierz pakiet i zacznij
            </button>
          </article>
        ))}
      </div>

      <div className="payment-trust-bar">
        <span>🔒 Bezpieczne szyfrowanie SSL</span>
        <span>⚡ Odblokowanie studia natychmiast po zamówieniu</span>
        <span>🧾 Faktura VAT dla firm i biur projektowych</span>
      </div>
    </section>
  );
}
