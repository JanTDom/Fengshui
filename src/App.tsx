import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CloudUpload,
  Compass,
  FileText,
  Grid3X3,
  HelpCircle,
  Layers3,
  Lightbulb,
  LockKeyhole,
  Route,
  Save,
  ShieldCheck,
  WandSparkles
} from "lucide-react";
import {
  methods,
  pricePlans,
  propertyTypes,
  reportDeliverables,
  services,
  sourceColumns,
  type PricePlan,
  type PropertyKey
} from "./data";
import { hasSupabaseConfig } from "./lib/supabase";
import { AuditBuilder } from "./AuditBuilder";

const scoreByProperty: Record<PropertyKey, number> = {
  flat: 78,
  multi: 74,
  house: 72,
  business: 81
};

const fengShuiPillars = [
  {
    title: "Forma i przepływ",
    description:
      "Czytamy wejście, osie drzwi-okna, przejścia, osłonę miejsc stałego przebywania i naturalny ruch po planie.",
    icon: Route
  },
  {
    title: "Kierunki i orientacja",
    description:
      "Tam, gdzie użytkownik poda północ lub azymut, raport może uwzględnić warstwę kompasową i kierunki sektorów.",
    icon: Compass
  },
  {
    title: "Strefy i funkcje",
    description:
      "Nakładamy ramy Bagua ostrożnie: osobno dla lokalu, kondygnacji lub funkcji, z oznaczeniem poziomu pewności.",
    icon: Grid3X3
  },
  {
    title: "Praktyka mieszkania",
    description:
      "Tradycyjne wnioski łączymy z ergonomią, światłem, prywatnością, akustyką i realnym kosztem zmian.",
    icon: Lightbulb
  }
];

const propertyFaqs = [
  {
    question: "Czym właściwie jest Feng Shui?",
    answer:
      "Feng Shui to tradycyjny chiński system oceny relacji między człowiekiem, miejscem, kierunkami, otoczeniem i sposobem używania przestrzeni. W Plan Harmonii traktujemy go jako uporządkowaną metodę zadawania pytań o plan: gdzie wchodzi ruch, gdzie brakuje osłony, które strefy są przeciążone i jakie ustawienia są najbardziej logiczne dla codziennego życia."
  },
  {
    question: "Czy raport obiecuje zdrowie, pieniądze albo szczęście?",
    answer:
      "Nie. Raport nie gwarantuje zdarzeń życiowych i nie zastępuje decyzji prawnej, medycznej, finansowej, konstrukcyjnej ani projektowej. Jego wartość polega na tym, że pokazuje ryzyka układu, priorytety zmian i różnicę między wnioskiem tradycyjnym a praktycznym."
  },
  {
    question: "Jak Feng Shui pomaga przy zakupie nieruchomości?",
    answer:
      "Przed zakupem metoda pomaga porównać układy, wejście, rozkład funkcji, światło, prywatność, relację drzwi i okien, ustawienie miejsc snu lub pracy oraz koszt ewentualnych korekt. Zamiast mówić „kup” lub „nie kup”, raport pokazuje, co jest mocne, co wymaga ostrożności i jakie dane trzeba potwierdzić."
  },
  {
    question: "Co jeśli nie znam północy albo nie mam odczytu kompasu?",
    answer:
      "Wtedy raport nadal może wykonać analizę Formy, funkcji, przepływu, światła i ergonomii. Warstwy zależne od kierunków dostają niższą pewność albo są oznaczane jako wymagające uzupełnienia. To uczciwsze niż zgadywanie orientacji."
  },
  {
    question: "Jak działa analiza domu lub mieszkania wielopoziomowego?",
    answer:
      "Każda kondygnacja jest oceniana osobno, a potem razem. Szczególną uwagę dostają schody, wejście, funkcje pięter, relacja stref dziennych i nocnych oraz to, czy pionowy ruch nie dominuje nad miejscami odpoczynku, pracy albo przyjmowania gości."
  },
  {
    question: "Czy AI zastępuje konsultanta Feng Shui?",
    answer:
      "Nie w pełni. AI dobrze porządkuje dane, porównuje metody, pilnuje pytań kontrolnych i tworzy czytelny raport z planu. Przy dużej inwestycji, remoncie konstrukcyjnym, projekcie premium albo pracy z dokładnym Luo Pan warto potraktować raport jako przygotowanie do konsultacji eksperckiej."
  },
  {
    question: "Co jeśli różne szkoły Feng Shui dają inne wskazania?",
    answer:
      "Raport nie miesza reguł bez kontroli. Jeśli Forma, Kompas, Bagua albo profil użytkownika prowadzą do różnych priorytetów, pokazujemy konflikt, metodę, dane wejściowe i poziom pewności. Dzięki temu użytkownik widzi, dlaczego rekomendacja jest ostrożna albo mocna."
  },
  {
    question: "Czy to działa dla biur, gabinetów i lokali usługowych?",
    answer:
      "Tak, ale pytania są inne niż w mieszkaniu. Analiza obejmuje wejście klienta, widoczność recepcji, pozycję stanowisk pracy, zaplecze, ścieżkę obsługi, strefy koncentracji i miejsca, w których użytkownik podejmuje decyzje lub rozmawia z klientem."
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
        <a href="#audyt">Audyt lokalu</a>
        <a href="#uslugi">Usługi AI</a>
        <a href="#jak-dziala">Jak działa</a>
        <a href="#generator">Generator</a>
        <a href="#raport">Raport</a>
        <a href="#cennik">Cennik</a>
        <a href="#zrodla">Metodologia</a>
      </nav>
      <button className="header-cta" type="button" onClick={() => scrollToId("cennik")}>
        <LockKeyhole size={16} />
        Kup wejście
      </button>
    </header>
  );
}

function ScoreRing({ value }: { value: number }) {
  return (
    <div
      className="score-ring"
      style={{
        background: `conic-gradient(var(--brass) ${value * 3.6}deg, var(--line) 0deg)`
      }}
      aria-label={`Wynik ${value} na 100`}
    >
      <div>
        <strong>{value}</strong>
        <span>/100</span>
      </div>
    </div>
  );
}

function FloorPlan({ propertyKey }: { propertyKey: PropertyKey }) {
  const isComplex = propertyKey === "multi" || propertyKey === "house";
  const isBusiness = propertyKey === "business";

  return (
    <div className={`floor-plan ${isBusiness ? "business-plan" : ""}`}>
      <div className="bagua-grid" aria-hidden="true" />
      <div className="plan-furniture bed" aria-hidden="true" />
      <div className="plan-furniture bath-fixture" aria-hidden="true" />
      <div className="plan-furniture counter" aria-hidden="true" />
      <div className="plan-furniture sofa" aria-hidden="true" />
      <div className="plan-furniture table" aria-hidden="true" />
      <div className="plan-furniture desk" aria-hidden="true" />
      <div className="plan-window window-north" aria-hidden="true" />
      <div className="plan-window window-east" aria-hidden="true" />
      <div className="plan-window window-south" aria-hidden="true" />
      <div className="plan-door door-entry" aria-hidden="true" />
      <div className="direction-tag tag-sw">Balkon SW</div>
      <div className="compass">
        <span>N</span>
        <strong>{propertyKey === "business" ? "96" : propertyKey === "house" ? "204" : "182"}°</strong>
      </div>
      <div className="room room-bedroom">
        <span>{isBusiness ? "Gabinet" : "Sypialnia"}</span>
        <small>NW</small>
      </div>
      <div className="room room-bath">
        <span>{isBusiness ? "Zaplecze" : "Łazienka"}</span>
        <small>N</small>
      </div>
      <div className="room room-kitchen">
        <span>{isBusiness ? "Recepcja" : "Kuchnia"}</span>
        <small>NE</small>
      </div>
      <div className="room room-living">
        <span>{isBusiness ? "Sala pracy" : "Salon"}</span>
        <small>W</small>
      </div>
      <div className="room room-dining">
        <span>{isBusiness ? "Klient" : "Jadalnia"}</span>
        <small>E</small>
      </div>
      <div className="room room-entry">
        <span>Wejście</span>
        <small>SE</small>
      </div>
      <div className="room room-study">
        <span>{isBusiness ? "Spotkania" : "Pokój"}</span>
        <small>S</small>
      </div>
      {isComplex ? (
        <div className="room room-stairs">
          <span>Schody</span>
          <small>pion Qi</small>
        </div>
      ) : null}
      <svg className="flow flow-one" viewBox="0 0 280 120" aria-hidden="true">
        <path d="M8 96 C 78 22, 158 20, 270 52" />
        <path className="flow-hot" d="M44 20 C 92 62, 160 86, 250 18" />
      </svg>
      <svg className="flow flow-two" viewBox="0 0 240 160" aria-hidden="true">
        <path d="M220 140 C 150 82, 110 42, 18 28" />
      </svg>
      <div className="floor-caption">
        {isComplex ? "Tryb wielopoziomowy: kondygnacje analizowane osobno i razem" : "Mapa planu z warstwami metod"}
      </div>
    </div>
  );
}

function ProductConsole({
  propertyKey,
  setPropertyKey
}: {
  propertyKey: PropertyKey;
  setPropertyKey: (value: PropertyKey) => void;
}) {
  const [fileName, setFileName] = useState("plan-mieszkania.pdf");
  const [activeMethodIds, setActiveMethodIds] = useState(methods.map((method) => method.name));
  const activeProperty = propertyTypes.find((property) => property.key === propertyKey)!;
  const score = scoreByProperty[propertyKey] + Math.max(0, activeMethodIds.length - methods.length);

  function toggleMethod(name: string) {
    setActiveMethodIds((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name]
    );
  }

  return (
    <section className="console" id="audyt" aria-label="Konsola audytu AI Feng Shui">
      <div className="console-sidebar">
        <div className="console-title">
          <strong>Nowy audyt</strong>
          <span>{activeProperty.title} · AI Feng Shui</span>
        </div>
        <label className="upload-box">
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.heif,application/pdf,image/png,image/jpeg,image/webp,image/heic,image/heif"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) setFileName(file.name);
            }}
          />
          <CloudUpload size={32} />
          <strong>Wgraj plan</strong>
          <span>{fileName} · PDF/JPG/PNG/WEBP/HEIC</span>
        </label>
        <div className="field-group">
          <span className="field-label">Typ nieruchomości</span>
          <div className="property-switch" role="group" aria-label="Typ nieruchomości">
            {propertyTypes.map((property) => (
              <button
                key={property.key}
                className={property.key === propertyKey ? "selected" : ""}
                type="button"
                onClick={() => setPropertyKey(property.key)}
              >
                <strong>{property.title}</strong>
                <span>{property.short}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="field-group">
          <span className="field-label">Metody AI</span>
          <div className="method-checks">
            {methods.slice(0, 6).map((method) => (
              <label key={method.name}>
                <input
                  type="checkbox"
                  checked={activeMethodIds.includes(method.name)}
                  onChange={() => toggleMethod(method.name)}
                />
                <span>{method.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="console-main">
        <div className="console-toolbar">
          <div className="console-tabs" aria-label="Etapy audytu">
            <button type="button" className="active">
              Plan
            </button>
            <button type="button">Analiza</button>
            <button type="button">Rekomendacje</button>
            <button type="button">Raport</button>
          </div>
          <div className="view-toggles" aria-label="Warstwy widoku">
            <button type="button" className="selected">
              2D
            </button>
            <button type="button">3D</button>
            <button type="button">Qi</button>
          </div>
        </div>
        <FloorPlan propertyKey={propertyKey} />
      </div>
      <aside className="console-report" aria-label="Podgląd raportu">
        <div className="report-top">
          <span>Wynik ogólny</span>
          <ScoreRing value={score} />
          <strong>{propertyKey === "business" ? "Silny potencjał użytkowy" : "Dobry potencjał"}</strong>
        </div>
        <div className="score-list">
          {methods.slice(0, 6).map((method) => (
            <div key={method.name}>
              <span>{method.name}</span>
              <meter min="0" max="100" value={method.score} />
              <strong>{method.score}</strong>
            </div>
          ))}
        </div>
        <div className="report-scope">
          <span>Zakres</span>
          <p>{activeProperty.scope}</p>
        </div>
        <button className="ghost-button" type="button" onClick={() => scrollToId("raport")}>
          Zobacz szczegóły
        </button>
      </aside>
    </section>
  );
}

function Hero({
  propertyKey,
  setPropertyKey
}: {
  propertyKey: PropertyKey;
  setPropertyKey: (value: PropertyKey) => void;
}) {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <h1>AI Feng Shui, które czyta plan i wskazuje decyzje</h1>
        <p>
          Wgraj plan mieszkania, domu, biura albo lokalu. Wielometodowy silnik AI analizuje układ,
          kierunki, strefy, kondygnacje, przepływ, światło i profil użytkownika, a potem tworzy
          raport z priorytetami zmian.
        </p>
        <div className="hero-actions">
          <button className="primary-button" type="button" onClick={() => scrollToId("cennik")}>
            Kup wejście do audytu
            <ArrowRight size={18} />
          </button>
          <button className="secondary-button" type="button" onClick={() => scrollToId("raport")}>
            Zobacz przykładowy raport
            <FileText size={18} />
          </button>
        </div>
        <div className="price-signal">
          <span>wejścia od</span>
          <strong>39 zł</strong>
        </div>
        <div className="hero-proof">
          <ShieldCheck size={18} />
          <span>Każda rekomendacja pokazuje metodę, dane wejściowe i poziom pewności.</span>
        </div>
      </div>
      <ProductConsole propertyKey={propertyKey} setPropertyKey={setPropertyKey} />
    </section>
  );
}

function ServiceRail() {
  return (
    <section className="service-rail" id="uslugi" aria-label="Usługi AI Feng Shui">
      {services.map((service) => {
        const Icon = service.icon;
        return (
          <article key={service.id}>
            <Icon size={34} />
            <h2>{service.title}</h2>
            <p>{service.description}</p>
          </article>
        );
      })}
    </section>
  );
}

function FengShuiExplainer() {
  return (
    <section className="fengshui-explainer" id="jak-dziala">
      <div className="explainer-header">
        <div>
          <span className="section-kicker">Jak działa metoda</span>
          <h2>Czym jest Feng Shui w analizie nieruchomości?</h2>
        </div>
        <p>
          To nie jest dekorowanie wnętrza symbolami. W kontekście mieszkania, domu albo lokalu Feng
          Shui jest sposobem czytania planu: relacji wejścia, kierunków, stref, przepływu, światła,
          funkcji i codziennych miejsc, w których człowiek śpi, pracuje, odpoczywa albo podejmuje
          decyzje.
        </p>
      </div>

      <div className="explainer-layout">
        <div className="explainer-panel">
          <strong>Nasze podejście</strong>
          <p>
            AI nie udaje mistrza z intuicją. Porównuje metody, oznacza dane, których brakuje, i
            oddziela warstwę tradycyjną od praktycznej: ergonomii, światła, prywatności, akustyki i
            kosztu zmian. Dzięki temu raport jest użyteczny przed zakupem, najmem, remontem albo
            ustawieniem funkcji.
          </p>
          <div className="explainer-proof">
            <ShieldCheck size={20} />
            <span>Każdy wniosek ma metodę, dane wejściowe i poziom pewności.</span>
          </div>
        </div>

        <div className="principle-grid" aria-label="Główne warstwy analizy">
          {fengShuiPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article key={pillar.title} className="principle-card">
                <Icon size={25} />
                <h3>{pillar.title}</h3>
                <p>{pillar.description}</p>
              </article>
            );
          })}
        </div>
      </div>

      <div className="qa-block" id="faq">
        <div className="qa-heading">
          <HelpCircle size={28} />
          <div>
            <span className="section-kicker">Q&A</span>
            <h2>Najczęstsze pytania przed analizą planu</h2>
          </div>
        </div>
        <div className="qa-list">
          {propertyFaqs.map((item) => (
            <details key={item.question}>
              <summary>
                <span>{item.question}</span>
                <ChevronRight className="qa-icon" size={18} />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
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
  const activePlan = pricePlans.find((plan) => plan.id === selectedPlan)!;

  return (
    <section className="pricing-section" id="cennik">
      <div className="section-heading">
        <h2>Wybierz wejście do audytu</h2>
        <p>
          Płacisz za konkretny raport lub pakiet wejść. Bez abonamentu w produktach jednorazowych,
          bez ukrytych dopłat za PDF.
        </p>
      </div>
      <div className="pricing-layout">
        <div className="pricing-grid">
          {pricePlans.map((plan) => (
            <PriceCard
              key={plan.id}
              plan={plan}
              selected={plan.id === selectedPlan}
              onSelect={() => setSelectedPlan(plan.id)}
            />
          ))}
        </div>
        <aside className="checkout-panel">
          <span>Wybrane wejście</span>
          <h3>{activePlan.title}</h3>
          <div className="checkout-price">
            {activePlan.price}
            {activePlan.period ? <small>{activePlan.period}</small> : null}
          </div>
          <p>{activePlan.note}</p>
          <button type="button" className="primary-button" onClick={() => scrollToId("generator")}>
            Przygotuj audyt
            <ChevronRight size={18} />
          </button>
          <div className="mini-device" aria-label="Podgląd raportu na telefonie">
            <div className="device-notch" />
            <div className="device-screen">
              <span>Plan Harmonii</span>
              <strong>78/100</strong>
              <small>Raport AI Feng Shui</small>
              <div className="device-bars">
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
          <small>
            Płatność przechodzi przez bezpieczny krok online; po opłaceniu użytkownik trafia do
            formularza audytu.
          </small>
        </aside>
      </div>
      <div className="payment-trust">
        <span>Bezpieczne płatności online</span>
        <span>PDF dostępny od razu po analizie</span>
        <span>Faktura VAT dla firm</span>
      </div>
    </section>
  );
}

function PriceCard({
  plan,
  selected,
  onSelect
}: {
  plan: PricePlan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article className={`price-card ${selected ? "selected" : ""} ${plan.featured ? "featured" : ""}`}>
      {plan.featured ? <span className="plan-flag">Najpopularniejszy</span> : null}
      <h3>{plan.title}</h3>
      <div className="plan-price">
        {plan.price}
        {plan.period ? <small>{plan.period}</small> : null}
      </div>
      <p>{plan.note}</p>
      <ul>
        {plan.features.map((feature) => (
          <li key={feature}>
            <Check size={16} />
            {feature}
          </li>
        ))}
      </ul>
      <button type="button" onClick={onSelect}>
        Wybierz
      </button>
    </article>
  );
}

function ReportSection({ propertyKey }: { propertyKey: PropertyKey }) {
  const property = propertyTypes.find((item) => item.key === propertyKey)!;

  return (
    <section className="report-section" id="raport">
      <div className="report-copy">
        <span className="section-kicker">Raport</span>
        <h2>Dokument, który zostaje po sesji AI</h2>
        <p>
          Raport zaczyna się od decyzji: co w układzie działa, co wymaga korekty i które zmiany
          mają największy sens. Dla domu i mieszkań wielopoziomowych AI rozdziela kondygnacje,
          a potem pokazuje relację między nimi.
        </p>
        <div className="focus-list">
          {property.reportFocus.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
      <div className="deliverables">
        {reportDeliverables.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title}>
              <Icon size={26} />
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SourcesSection() {
  return (
    <section className="sources-section" id="zrodla">
      <div className="sources-intro">
        <div>
          <span className="section-kicker">Metodologia</span>
          <h2>Skąd AI czerpie wiedzę</h2>
        </div>
        <p>
          Silnik Plan Harmonii pracuje na uporządkowanej bibliotece metod: klasyczne szkoły Feng
          Shui, współczesne standardy konsultacji, analiza planów, ergonomia wnętrz i jawne reguły
          oceny. Każda rekomendacja ma metodę, poziom pewności i zakres zastosowania.
        </p>
      </div>
      <div className="source-layout">
        <div className="source-grid">
          {sourceColumns.map((source) => (
            <article key={source.title}>
              <h3>{source.title}</h3>
              <p>{source.detail}</p>
              <ul>
                {source.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <aside className="source-ledger">
          <h3>Nie czarna skrzynka</h3>
          <p>Każda rekomendacja pokazuje metodę, poziom pewności i dane wejściowe.</p>
          <div className="ledger-card">
            <span>Raport - fragment</span>
            <strong>Przenieś biurko tak, aby mieć oparcie i widok na wejście.</strong>
            <div className="method-tags">
              <span>Forma</span>
              <span>Kompas</span>
              <span>Bagua</span>
            </div>
            <dl>
              <div>
                <dt>Pewność</dt>
                <dd>wysoka</dd>
              </div>
              <div>
                <dt>Dane wymagane</dt>
                <dd>północ, wejście, funkcja pokoju</dd>
              </div>
              <div>
                <dt>Zakres</dt>
                <dd>mieszkania, domy, biura do 500 m2</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
      <div className="source-library">
        <strong>Biblioteka źródeł</strong>
        <span>Kompas szkoły Luo Pan i 24 góry</span>
        <span>Xuan Kong i cykle czasu</span>
        <span>San He oraz relacja formy i kierunku</span>
        <span>San Yuan, lata i okresy</span>
        <span>Nowoczesne standardy konsultacji</span>
        <span>Ergonomia wnętrz i światło</span>
      </div>
      <div className="industry-standard">
        <ShieldCheck size={34} />
        <div>
          <strong>Standard pracy: plan + orientacja + kontekst użytkownika + jasne ograniczenia.</strong>
          <p>
            AI porządkuje i porównuje metody, ale nie obiecuje skutków życiowych. To narzędzie
            decyzyjne i raportowe, nie wyrok o domu ani człowieku.
          </p>
        </div>
      </div>
      <div className="method-commitment">
        <Save size={20} />
        <span>Źródła i założenia zostają zapisane przy raporcie.</span>
        <WandSparkles size={20} />
        <span>AI porównuje metody, a nie miesza reguł bez kontroli.</span>
      </div>
    </section>
  );
}

function MethodStrip() {
  return (
    <section className="method-strip">
      <div className="section-heading compact">
        <h2>Jedna platforma, wiele metod</h2>
        <p>
          Silnik zestawia metody obok siebie, zamiast mieszać je bez kontroli. Gdy szkoły wskazują
          różne priorytety, raport pokazuje różnicę i powód rekomendacji.
        </p>
      </div>
      <div className="method-grid">
        {methods.map((method) => {
          const Icon = method.icon;
          return (
            <article key={method.name}>
              <Icon size={28} />
              <h3>{method.name}</h3>
              <p>{method.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="final-cta">
      <div>
        <h2>Masz plan nieruchomości? Sprawdź go zanim zainwestujesz czas i pieniądze.</h2>
        <p>
          Zacznij od szybkiego skanu albo kup pełny raport. Dla domów i układów wielopoziomowych
          system poprosi o kondygnacje, wejścia, schody i kontekst otoczenia.
        </p>
      </div>
      <button className="primary-button" type="button" onClick={() => scrollToId("cennik")}>
        Kup wejście
        <ArrowRight size={18} />
      </button>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="brand footer-brand">
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
      </div>
      <p>
        Plan Harmonii jest usługą informacyjno-raportową. Nie stanowi porady prawnej, medycznej,
        konstrukcyjnej ani gwarancji określonych zdarzeń życiowych.
      </p>
      <div className="footer-links">
        <a href="#zrodla">Metodologia</a>
        <a href="#faq">Q&A</a>
        <a href="#cennik">Cennik</a>
        <a href="#raport">Raport</a>
      </div>
    </footer>
  );
}

export default function App() {
  const [propertyKey, setPropertyKey] = useState<PropertyKey>("flat");
  const [selectedPlan, setSelectedPlan] = useState("full");
  const supabaseStatus = useMemo(
    () => (hasSupabaseConfig ? "Supabase gotowy" : "Supabase do podłączenia"),
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
        <Hero propertyKey={propertyKey} setPropertyKey={setPropertyKey} />
        <ServiceRail />
        <FengShuiExplainer />
        <Pricing selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />
        <AuditBuilder
          propertyKey={propertyKey}
          setPropertyKey={setPropertyKey}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
        />
        <MethodStrip />
        <ReportSection propertyKey={propertyKey} />
        <SourcesSection />
        <FinalCta />
      </main>
      <div className="tech-status" aria-label="Status techniczny">
        {supabaseStatus}
      </div>
      <Footer />
    </div>
  );
}
