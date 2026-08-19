import { Navbar } from "./Navbar";
import { HeroSection } from "./HeroSection";
import { ProcessSection } from "./ProcessSection";
import { MethodologySection } from "./MethodologySection";
import { ReportShowcaseSection } from "./ReportShowcaseSection";
import { AudienceSection } from "./AudienceSection";
import { PricingSection } from "./PricingSection";
import { FaqSection } from "./FaqSection";
import { Footer } from "./Footer";
import { Sparkles, ArrowRight } from "lucide-react";

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
    <div className="landing-page-root">
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

        <section className="final-cta-clean">
          <div className="final-cta-inner">
            <span className="cta-icon-pill">
              <Sparkles size={20} />
            </span>
            <h2>Masz plan nieruchomości? Sprawdź go zanim zainwestujesz czas i pieniądze.</h2>
            <p>Wybierz pakiet i odblokuj natychmiastowy dostęp do Studia Planowania e-fengshui.pl.</p>
            <button
              className="primary-button large"
              type="button"
              onClick={() => onOpenCheckout("full")}
            >
              Rozpocznij audyt rzutu
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
