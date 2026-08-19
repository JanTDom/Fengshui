import { Navbar } from "./Navbar";
import { HeroSection } from "./HeroSection";
import { ProcessSection } from "./ProcessSection";
import { MethodologySection } from "./MethodologySection";
import { ReportShowcaseSection } from "./ReportShowcaseSection";
import { AudienceSection } from "./AudienceSection";
import { PricingSection } from "./PricingSection";
import { FaqSection } from "./FaqSection";
import { Footer } from "./Footer";
import { Sparkles, ArrowRight, ShieldCheck, Zap, Lock } from "lucide-react";
import "../../marketing.css";

interface LandingPageProps {
  onOpenCheckout: (planId?: string) => void;
  onEnterWorkspaceDirectly?: () => void;
  hasActiveProject?: boolean;
}

export function LandingPage({
  onOpenCheckout,
  onEnterWorkspaceDirectly,
  hasActiveProject
}: LandingPageProps) {
  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="mkt-page-root">
      <Navbar
        onOpenCheckout={onOpenCheckout}
        onEnterWorkspaceDirectly={onEnterWorkspaceDirectly}
        hasActiveProject={hasActiveProject}
      />

      <main>
        <HeroSection
          onStartAnalysis={() => onOpenCheckout("full")}
          onViewReportDetails={() => scrollToId("raport")}
        />

        <ProcessSection onStart={() => onOpenCheckout("full")} />

        <MethodologySection />

        <ReportShowcaseSection />

        <AudienceSection onSelectAudience={() => onOpenCheckout("full")} />

        <PricingSection onSelectPlan={(planId) => onOpenCheckout(planId)} />

        <FaqSection />

        {/* FULL-WIDTH LUXURY FINAL CTA SECTION */}
        <section className="mkt-final-fullbleed-section">
          <div className="mkt-container">
            <div className="mkt-final-content-box">
              <div className="mkt-final-crest-wrap">
                <Sparkles size={28} />
              </div>
              <h2>Masz plan nieruchomości? Sprawdź go zanim zainwestujesz czas i pieniądze.</h2>
              <p>
                Wybierz pakiet i odblokuj natychmiastowy dostęp do Studia Planowania e-fengshui.pl.
                Wgraj rzut, dopasuj meble i odbierz 12-stronicowy raport PDF.
              </p>
              <div className="mkt-final-cta-btn-wrap">
                <button
                  className="mkt-btn-primary mkt-btn-large-gold"
                  type="button"
                  onClick={() => onOpenCheckout("full")}
                >
                  <span>Rozpocznij audyt rzutu</span>
                  <ArrowRight size={20} />
                </button>
              </div>
              <div className="mkt-final-trust-row">
                <span><Zap size={15} /> Natychmiastowe odblokowanie</span>
                <span><Lock size={15} /> Płatności BLIK / P24</span>
                <span><ShieldCheck size={15} /> 100% Prywatności danych</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
