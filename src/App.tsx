import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  ChevronRight,
  Compass,
  FileCheck2,
  FileText,
  Grid3X3,
  HelpCircle,
  Home,
  Layers3,
  Lightbulb,
  LockKeyhole,
  Map,
  Moon,
  Route,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Users
} from "lucide-react";
import { pricePlans, propertyTypes, type PricePlan, type PropertyKey } from "./data";
import { hasSupabaseConfig } from "./lib/supabase";
import { AuditBuilder } from "./AuditBuilder";

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

const propertyFaqs = [
  {
    question: "Czym właściwie jest Feng Shui w Plan Harmonii?",
    answer:
      "Feng Shui to tradycyjny system oceny relacji między człowiekiem, orientacją stron świata a układem przestrzeni. W Plan Harmonii traktujemy go jako rygorystyczne narzędzie analizy architektonicznej: badamy wejście, osłonę miejsc odpoczynku, strefy dzienne/nocne, światło dzienne i ergonomię."
  },
  {
    question: "Czy raport obiecuje bogactwo, zdrowie albo magiczne efekty?",
    answer:
      "Absolutnie nie. Nasz produkt nie składa deterministycznych obietnic życiowych. Raport wskazuje realne ryzyka układu, priorytety zmian mebli oraz rozróżnia zalecenia tradycyjne od praktycznych zasad architektury i doświetlenia."
  },
  {
    question: "Co jeśli nie znam dokładnej północy ani kąta kompasu?",
    answer:
      "Nasz silnik nadal przeprowadzi pełną analizę Szkoły Formy (Luan Tou), wejścia, ciągów komunikacyjnych i ergonomii. Sekcje zależne od kompasu zostaną oznaczone z odpowiednim stopniem niepewności, co jest w 100% uczciwe."
  },
  {
    question: "W jakim formacie mogę wgrać plan nieruchomości?",
    answer:
      "Obsługujemy pliki PDF (np. rzuty od dewelopera), obrazy PNG, JPG, WEBP oraz zdjęcia z telefonów iPhone w formacie HEIC/HEIF do 10 MB."
  },
  {
    question: "Jak działa pakiet porównania 3 nieruchomości (179 zł)?",
    answer:
      "Wgrywasz 3 różne rzuty mieszkań, a silnik ocenia je w jednolitej skali 0–100 pkt pod kątem doświetlenia, ergonomii i łatwości adaptacji, generując tabelę decyzyjną ze wskazaniem zwycięskiego lokalu."
  }
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Header() {
  return (
    <header className="site-header" aria-label="Główna nawigacja">
      <a className="brand" href="#top" aria-label="Plan Harmonii">
        <span className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
        <span>
          <strong>Plan Harmonii</strong>
          <small>AI Feng Shui</small>
        </span>
      </a>
      <nav>
        <a href="#jak-dziala">Jak działa</a>
        <a href="#generator">Generator audytu</a>
        <a href="#co-zawiera-raport">Raport</a>
        <a href="#dla-kogo">Dla kogo</a>
        <a href="#cennik">Cennik</a>
        <a href="#faq">Q&A</a>
      </nav>
      <button className="header-cta" type="button" onClick={() => scrollToId("generator")}>
        <Sparkles size={16} />
        Rozpocznij audyt
      </button>
    </header>
  );
}

function HeroShowcaseCard() {
  return (
    <div className="hero-showcase-wrapper">
      <div className="hero-showcase-card">
        <div className="showcase-header">
          <div className="showcase-badge">
            <BadgeCheck size={16} />
            <span>Audyt Planu · Mieszkanie 64 m²</span>
          </div>
          <div className="showcase-score">
            <strong>82</strong>
            <span>/100 · Silny potencjał</span>
          </div>
        </div>

        <div className="showcase-visual">
          <img
            src="/assets/floor-plan-premium.webp"
            alt="Wizualizacja audytu rzutu mieszkania z siatką Bagua"
            className="showcase-plan-img"
            onError={(e) => {
              // Fallback if webp fails
              (e.currentTarget as HTMLImageElement).src = "/assets/floor-plan-premium.png";
            }}
          />
          <div className="showcase-overlay-bagua">
            <span className="bagua-tag tag-nw">NW · Gabinet</span>
            <span className="bagua-tag tag-s">S · Światło</span>
            <span className="bagua-tag tag-sw">SW · Sypialnia</span>
            <span className="bagua-tag tag-entry">Wejście SE</span>
          </div>
        </div>

        <div className="showcase-insights">
          <div className="insight-row">
            <div className="insight-icon good">
              <Check size={14} />
            </div>
            <div>
              <strong>Wezgłowie łóżka: Pozycja dominująca</strong>
              <small>Solidna ściana, brak okna za głową, pełna widoczność wejścia.</small>
            </div>
          </div>
          <div className="insight-row">
            <div className="insight-icon caution">
              <Compass size={14} />
            </div>
            <div>
              <strong>Biurko: Oś okno-drzwi do korekty</strong>
              <small>Zalecane obrócenie o 90° w celu uzyskania oparcia za plecami.</small>
            </div>
          </div>
        </div>

        <div className="showcase-footer">
          <span>Raport PDF · 12 stron analizy</span>
          <span className="showcase-pill">Gotowy w 60 sekund</span>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <div className="hero-eyebrow">
          <Sparkles size={16} />
          <span>Wielometodowy silnik AI & Architektura Wnętrz</span>
        </div>
        <h1>Sprawdź układ nieruchomości zanim podejmiesz kosztowną decyzję</h1>
        <p>
          Wgraj rzut mieszkania, domu lub biura (PDF/PNG/JPG). Sztuczna inteligencja łączy tradycyjną
          Szkołę Formy, siatkę 9 stref Bagua i orientację kompasową z nowoczesną ergonomią, światłem
          i akustyką.
        </p>
        <div className="hero-actions">
          <button className="primary-button hero-main-btn" type="button" onClick={() => scrollToId("generator")}>
            Rozpocznij audyt rzutu
            <ArrowRight size={18} />
          </button>
          <button className="secondary-button" type="button" onClick={() => scrollToId("co-zawiera-raport")}>
            Co zawiera raport PDF
            <FileText size={18} />
          </button>
        </div>
        <div className="hero-trust-strip">
          <div className="trust-item">
            <ShieldCheck size={18} />
            <span>Zero pseudonauki i pustych obietnic</span>
          </div>
          <div className="trust-divider" />
          <div className="trust-item">
            <FileCheck2 size={18} />
            <span>Płatne raporty od 39 zł</span>
          </div>
        </div>
      </div>
      <HeroShowcaseCard />
    </section>
  );
}

function PillarTrustBar() {
  return (
    <section className="pillar-bar" id="jak-dziala" aria-label="Cztery filary analizy Plan Harmonii">
      <div className="pillar-bar-header">
        <span className="section-kicker">Metodologia</span>
        <h2>Jedna platforma, cztery zintegrowane filary oceny</h2>
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

function ReportShowcaseSection() {
  return (
    <section className="report-showcase-section" id="co-zawiera-raport">
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
    </section>
  );
}

function AudienceSection() {
  return (
    <section className="audience-section" id="dla-kogo">
      <div className="section-heading">
        <span className="section-kicker">Zastosowanie</span>
        <h2>Dla kogo został stworzony Plan Harmonii?</h2>
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
                onClick={() => scrollToId("generator")}
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

function Pricing({
  selectedPlan,
  setSelectedPlan
}: {
  selectedPlan: string;
  setSelectedPlan: (value: string) => void;
}) {
  return (
    <section className="pricing-section" id="cennik">
      <div className="section-heading">
        <span className="section-kicker">Cennik</span>
        <h2>Przejrzyste pakiety bez ukrytych opłat</h2>
        <p>Płacisz za konkretny raport. Natychmiastowy dostęp do generatora i eksportu PDF.</p>
      </div>

      <div className="pricing-grid-clean">
        {pricePlans.map((plan) => (
          <article
            key={plan.id}
            className={`price-card-clean ${plan.id === selectedPlan ? "selected" : ""} ${
              plan.featured ? "featured" : ""
            }`}
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
              onClick={() => {
                setSelectedPlan(plan.id);
                scrollToId("generator");
              }}
            >
              Wybierz i przejdź do audytu
            </button>
          </article>
        ))}
      </div>

      <div className="payment-trust-bar">
        <span>🔒 Bezpieczne szyfrowanie SSL</span>
        <span>⚡ PDF dostępny natychmiast po analizie</span>
        <span>🧾 Faktura VAT dla firm i biur projektowych</span>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="faq-section" id="faq">
      <div className="section-heading">
        <span className="section-kicker">Częste pytania</span>
        <h2>Wszystko, co warto wiedzieć przed audytem</h2>
      </div>
      <div className="faq-list-clean">
        {propertyFaqs.map((item) => (
          <details key={item.question} className="faq-item">
            <summary>
              <span>{item.question}</span>
              <ChevronRight className="faq-chevron" size={18} />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="final-cta-clean">
      <div className="final-cta-inner">
        <span className="cta-icon-pill">
          <Sparkles size={20} />
        </span>
        <h2>Masz plan nieruchomości? Sprawdź go zanim zainwestujesz czas i pieniądze.</h2>
        <p>Wgraj plik rzutu i w 60 sekund otrzymaj obiektywną analizę przestrzenną.</p>
        <button className="primary-button large" type="button" onClick={() => scrollToId("generator")}>
          Rozpocznij audyt teraz
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-brand-box">
          <a className="brand" href="#top" aria-label="Plan Harmonii">
            <span className="brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            <span>
              <strong>Plan Harmonii</strong>
              <small>AI Feng Shui</small>
            </span>
          </a>
          <p>
            Profesjonalna platforma analityczna łącząca tradycję Szkoły Form i Bagua z nowoczesną
            architekturą wnętrz, ergonomią i oświetleniem.
          </p>
        </div>
        <div className="footer-nav-col">
          <strong>Nawigacja</strong>
          <a href="#jak-dziala">Jak działa metoda</a>
          <a href="#generator">Generator audytu</a>
          <a href="#co-zawiera-raport">Zawartość raportu</a>
          <a href="#dla-kogo">Dla kogo</a>
          <a href="#cennik">Cennik pakietów</a>
          <a href="#faq">Pytania i odpowiedzi</a>
        </div>
        <div className="footer-legal-col">
          <strong>Prywatność i bezpieczeństwo</strong>
          <p>Pliki rzutów przetwarzane są poufnie w bezpiecznej infrastrukturze chmurowej.</p>
          <small>
            Plan Harmonii jest usługą informacyjno-raportową. Nie stanowi gwarancji określonych
            zdarzeń życiowych ani ekspertyzy budowlanej.
          </small>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Plan Harmonii. Wszelkie prawa zastrzeżone.</span>
        <span>Wielometodowy silnik AI Feng Shui</span>
      </div>
    </footer>
  );
}

export default function App() {
  const [propertyKey, setPropertyKey] = useState<PropertyKey>("flat");
  const [selectedPlan, setSelectedPlan] = useState("full");

  const supabaseStatus = useMemo(
    () => (hasSupabaseConfig ? "System gotowy" : "Tryb demo"),
    []
  );

  useEffect(() => {
    if (!window.location.hash) return;
    window.requestAnimationFrame(() => {
      scrollToId(window.location.hash.slice(1));
    });
  }, []);

  return (
    <div className="app">
      <Header />
      <main>
        <Hero />
        <PillarTrustBar />
        <AuditBuilder
          propertyKey={propertyKey}
          setPropertyKey={setPropertyKey}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
        />
        <ReportShowcaseSection />
        <AudienceSection />
        <Pricing selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />
        <FaqSection />
        <FinalCta />
      </main>
      <div className="tech-status" aria-label="Status techniczny">
        {supabaseStatus}
      </div>
      <Footer />
    </div>
  );
}
