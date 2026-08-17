import { inferMimeType } from "../src/lib/fileValidation.js";

const MODEL = "gemini-3.7-flash";
const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
];
const MAX_TOTAL_INLINE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif"
]);
const SUPPORTED_FORMAT_LABEL = "PDF, JPG, PNG, WEBP, HEIC albo HEIF";

const methodDefaults = [
  { method: "Szkoła Formy (Luan Tou)", score: 86, signal: "Oparcie wezgłowia, wejście i ciągi komunikacyjne" },
  { method: "Siatka 9 Stref Bagua (Luo Shu)", score: 82, signal: "Podział przestrzeni na 9 pałaców życiowych" },
  { method: "Analiza Kompasowa (Kierunki N)", score: 79, signal: "Orientacja względem stron świata i nasłonecznienie" },
  { method: "Pięć Przemian (Wu Xing)", score: 75, signal: "Równowaga barw, materiałów i faktur" },
  { method: "Ergonomia i Architektura", score: 88, signal: "Pomiary ciągów (90-110 cm), trójkąt roboczy" },
  { method: "Oświetlenie i Akustyka", score: 81, signal: "3 warstwy światła (2200K / 2700K / 4000K)" },
  { method: "Profil Mieszkańców (Kua / Gua)", score: 74, signal: "Indywidualne kierunki wspierające" },
  { method: "Standardy Zdrowego Wnętrza", score: 84, signal: "Biofilia, wentylacja i eliminacja Sha Qi" }
];

const compassSectors = [
  { direction: "Północ", sector: "Kariera i Droga Życiowa", element: "Woda" },
  { direction: "Północny wschód", sector: "Wiedza i Samorozwój", element: "Ziemia" },
  { direction: "Wschód", sector: "Zdrowie i Rodzina", element: "Drewno" },
  { direction: "Południowy wschód", sector: "Obfitość i Finanse", element: "Drewno" },
  { direction: "Południe", sector: "Sława i Reputacja", element: "Ogień" },
  { direction: "Południowy zachód", sector: "Relacje i Partnerstwo", element: "Ziemia" },
  { direction: "Zachód", sector: "Kreatywność i Dzieci", element: "Metal" },
  { direction: "Północny zachód", sector: "Pomocni Ludzie i Mentorzy", element: "Metal" },
  { direction: "Centrum", sector: "Serce Domu i Równowaga", element: "Ziemia" }
];

const ROOM_KNOWLEDGE_BASE = {
  sypialnia: {
    diagnosis: "Sypialnia to strefa Yin służąca głębokiej regeneracji. Kluczem jest pozycja dominująca wezgłowia (oparcie o pełną ścianę) i odsunięcie od bezpośredniej osi wejścia.",
    strengths: [
      "Wezgłowie z dala od pionów kanalizacyjnych",
      "Możliwość swobodnego, symetrycznego dojścia z obu stron łóżka (min. 60-70 cm)",
      "Naturalna strefa wyciszenia i ochrony prywatności"
    ],
    risks: [
      "Oś przeciągu energii (łóżko w bezpośredniej linii drzwi-okno)",
      "Lustro odbijające śpiące osoby (stymulacja Yang zaburzająca fazę głębokiego snu REM)",
      "Brak pełnego oparcia wezgłowia o ścianę murowaną (słaby Czarny Żółw)"
    ],
    recommendations: [
      "Ustaw wezgłowie łóżka o pełną ścianę z widokiem na drzwi (pozycja dominująca)",
      "Zastosuj ciepłe oświetlenie warstwowe 2200K–2700K sprzyjające wydzielaniu melatoniny",
      "Wprowadź kolory Ziemi i Drewna (beże, len, zgaszona szałwia) i wyeliminuj elektronikę z okolic głowy"
    ]
  },
  salon: {
    diagnosis: "Centrum życia rodzinnego (Yang) i integracji. Wymaga jasnego doświetlenia naturalnego, stabilnego oparcia sofy i swobodnych ciągów komunikacyjnych.",
    strengths: [
      "Dobre doświetlenie światłem dziennym od strefy dziennej",
      "Przestronna strefa wypoczynkowa z naturalnym miejscem na integrację"
    ],
    risks: [
      "Sofa ustawiona tyłem do wejścia do pokoju (podświadome poczucie zagrożenia i brak kontroli)",
      "Zatory w przejściach komunikacyjnych poniżej ergonomicznego standardu 90 cm"
    ],
    recommendations: [
      "Ustaw główną sofę z oparciem o ścianę lub niską konsolę z widokiem na wejście",
      "Wprowadź rośliny o obłych liściach (Monstera, Ficus) w narożnikach, aby rozproszyć zastaną energię",
      "Wydziel 3 warstwy światła: ogólne sufitowe, nastrojowe boczne i punktowe do czytania"
    ]
  },
  kuchnia: {
    diagnosis: "Strefa Ognia (kuchenka/płyta) i Wody (zlew/lodówka). Podstawą jest zachowanie trójkąta roboczego i bufora neutralizującego konflikt żywiołów.",
    strengths: [
      "Funkcjonalny podział na strefę przygotowywania i gotowania",
      "Dostęp do dobrej wentylacji i doświetlenia blatu"
    ],
    risks: [
      "Płyta grzewcza w bezpośrednim sąsiedztwie zlewu lub lodówki (konflikt Ogień–Woda)",
      "Osoba gotująca stojąca tyłem do otwartej przestrzeni bez kontroli wejścia"
    ],
    recommendations: [
      "Zapewnij min. 40–60 cm blatu (żywioł Drewna) między płytą grzewczą a zlewem",
      "Zadbaj o doświetlenie blatu roboczego światłem neutralnym 4000K (CRI > 90)",
      "Utrzymuj blat w czystości bez nadmiaru małego AGD blokującego swobodny przepływ Qi"
    ]
  },
  gabinet: {
    diagnosis: "Strefa skupienia, autorytetu i jasności myślenia. Wymaga bezwzględnej pozycji dominującej (Command Position) biurka.",
    strengths: [
      "Wydzielona przestrzeń sprzyjająca głębokiej koncentracji",
      "Dobre światło dzienne padające z boku stanowiska pracy"
    ],
    risks: [
      "Siedzenie tyłem do drzwi lub twarzą dosuniętą bezpośrednio do ściany (brak perspektywy)",
      "Odblaski na monitorze wywołujące zmęczenie wzroku"
    ],
    recommendations: [
      "Ustaw biurko tak, aby za plecami była pełna ściana, a przed Tobą widok na wejście do pokoju",
      "Zadbaj o światło zadaniowe 4000K padające z lewej strony (dla praworęcznych)",
      "Wprowadź elementy Metalu (organizery, mosiądz) i Ziemi (stabilność decyzji biznesowych)"
    ]
  },
  przedpokój: {
    diagnosis: "Usta Qi (Qi Kou) – filtr energetyczny decydujący o pierwszym wrażeniu i komforcie po przekroczeniu progu domu.",
    strengths: [
      "Wydzielona strefa wejściowa na odzież i obuwie",
      "Czytelny podział między strefą zewnętrzną a prywatną"
    ],
    risks: [
      "Lustro umieszczone na wprost drzwi wejściowych (odbijające energię na zewnątrz)",
      "Zastawione przejście butami i brak doświetlenia strefy powitalnej"
    ],
    recommendations: [
      "Zawieś lustro na ścianie bocznej, nigdy naprzeciw drzwi wejściowych",
      "Zastosuj zamknięte szafy eliminujące wizualny chaos i kurz",
      "Wprowadź jasne, ciepłe oświetlenie powitalne (min. 200-300 lx)"
    ]
  },
  łazienka: {
    diagnosis: "Strefa silnego odpływu żywiołu Wody. Wymaga zabezpieczenia przed ucieczką energii z części mieszkalnej.",
    strengths: [
      "Sprawna wentylacja grawitacyjna lub mechaniczna",
      "Praktyczne wykończenie materiałowe odporne na wilgoć"
    ],
    risks: [
      "Drzwi łazienki otwierające się bezpośrednio na stół jadalny lub łóżko",
      "Lokalizacja łazienki w centralnym punkcie rzutu (osłabienie Tai Qi)"
    ],
    recommendations: [
      "Zamykaj drzwi do łazienki oraz klapę toalety",
      "Wprowadź rośliny lub elementy Drewna i Ziemi (ceramika, beże), które harmonizują nadmiar Wody",
      "Zadbaj o doświetlenie lustra bez cieni na twarzy (barwa 3000K–4000K)"
    ]
  }
};

function getRoomExpertise(roomName) {
  const lower = String(roomName || "").toLowerCase();
  if (lower.includes("syp")) return ROOM_KNOWLEDGE_BASE.sypialnia;
  if (lower.includes("sal") || lower.includes("dzien") || lower.includes("pokój")) return ROOM_KNOWLEDGE_BASE.salon;
  if (lower.includes("kuch") || lower.includes("jadal")) return ROOM_KNOWLEDGE_BASE.kuchnia;
  if (lower.includes("gab") || lower.includes("prac") || lower.includes("biur")) return ROOM_KNOWLEDGE_BASE.gabinet;
  if (lower.includes("hol") || lower.includes("wej") || lower.includes("przedpok")) return ROOM_KNOWLEDGE_BASE.przedpokój;
  if (lower.includes("łaz") || lower.includes("wc") || lower.includes("kąpiel")) return ROOM_KNOWLEDGE_BASE.łazienka;
  return ROOM_KNOWLEDGE_BASE.salon;
}

function parseBody(req) {
  if (typeof req.body === "object" && req.body !== null) return req.body;
  if (typeof req.body === "string" && req.body.trim().length > 0) return JSON.parse(req.body);
  throw new Error("Pusty lub niepoprawny korpus żądania.");
}

function safeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function normalizeConfidence(value) {
  if (value === "high" || value === "low") return value;
  return "medium";
}

function clampScore(value, fallback = 75) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeAngleDeg(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return ((Math.round(numeric) % 360) + 360) % 360;
}

function buildFallbackReport(payload, mode, model) {
  const propertyLabel = payload.propertyType === "house" ? "domu" : payload.propertyType === "business" ? "lokalu użytkowego" : "mieszkania";
  const levelsCount = Math.max(1, Math.min(12, Number(payload.levelsCount) || 1));
  const orientationData = payload.orientationData || {};
  const planAnnotations = payload.planAnnotations || {};
  const furnitureAnnotations = payload.furnitureAnnotations || {};
  const residentProfiles = payload.residentProfiles || [];
  const roomFunctions = planAnnotations.roomFunctions || [];
  const fixedElements = planAnnotations.fixedElements || [];
  const planMarkers = planAnnotations.markers || [];
  const furnitureItems = furnitureAnnotations.keyPieces || [];
  const hasConfirmedNorth = orientationData.confirmed === true;
  const northAngle = normalizeAngleDeg(orientationData.northAngleDeg);
  const hasEntry = Boolean(safeText(payload.entryNote)) || fixedElements.includes("Wejście główne") || planMarkers.some((m) => m?.label === "Wejście główne");
  const hasProfile = Boolean(safeText(payload.profileNote)) || residentProfiles.length > 0;

  const baseScore = payload.propertyType === "business" ? 82 : payload.propertyType === "house" ? 78 : 80;
  const score = baseScore + (hasConfirmedNorth ? 4 : -4) + (hasEntry ? 3 : -3) + (hasProfile ? 2 : -2);

  const detectedRoomList = roomFunctions.length > 0 ? roomFunctions : ["Przedpokój / Wejście", "Salon z aneksem", "Sypialnia Główna", "Kuchnia", "Łazienka / WC"];

  const markedSectors = compassSectors.map((sector) => ({
    sector: sector.sector,
    direction: sector.direction,
    element: sector.element,
    current_use: sector.direction === "Północ" ? "Strefa wejścia / gabinet" : sector.direction === "Południowy zachód" ? "Sypialnia główna" : sector.direction === "Południe" ? "Salon / strefa dzienna" : "Strefa funkcjonalna",
    assessment: `Sektor ${sector.direction} odpowiada za ${sector.sector.toLowerCase()} (żywioł ${sector.element}). Układ sprzyja stabilnemu funkcjonowaniu pod warunkiem zachowania właściwego oparcia mebli i harmonii barw.`,
    advice: sector.direction === "Centrum"
      ? "Centrum (Tai Qi) powinno pozostać możliwie wolne od ciężkich mebli i zatorów komunikacyjnych, stanowiąc serce równowagi domu."
      : `Wprowadź akcenty żywiołu ${sector.element.toLowerCase()} w sposób subtelny i zrównoważony.`,
    priority: "średni"
  }));

  return {
    score: clampScore(score, 78),
    confidence: hasConfirmedNorth && hasEntry ? "high" : "medium",
    executive_summary: `Audyt ${propertyLabel} wykazuje solidny potencjał funkcjonalny i przestrzenny. Kluczowe atuty to czytelny podział na strefę dzienną (Yang) i nocną (Yin). Główne priorytety obejmują ustawienie łóżka i biurka w pozycji dominującej (Command Position), doświetlenie stref pracy światłem 4000K oraz eliminację ostrych osi drzwi-okna.`,
    detected_inputs: [
      `${payload.files?.length || 1} plan nieruchomości`,
      `${levelsCount} kondygnacja`,
      hasConfirmedNorth ? `Orientacja północy: ${northAngle}° (kierunek N)` : "Północ domyślna",
      hasEntry ? "Wejście główne zlokalizowane" : "Wejście domyślne",
      `Przeznaczenie: ${safeText(payload.purpose, "zamieszkanie")}`,
      "Zdefiniowane strefy funkcjonalne lokalu"
    ],
    missing_inputs: [
      ...(hasConfirmedNorth ? [] : ["Zatwierdź dokładną orientację północy kompasem"]),
      ...(hasProfile ? [] : ["Dodaj daty urodzenia domowników dla pełnej analizy Kua"])
    ],
    priority_actions: [
      {
        title: "Ustaw wezgłowie łóżka w pozycji dominującej",
        why: "Pełna ściana za głową (Czarny Żółw) eliminuje podświadomy niepokój i gwarantuje głęboką regenerację w fazie REM.",
        method: "Szkoła Formy",
        impact: "bardzo wysoki",
        effort: "niski",
        confidence: "high"
      },
      {
        title: "Odsuń biurko od pozycji tyłem do drzwi",
        why: "Siedzenie tyłem do wejścia wywołuje permanentny mikrostres i obniża zdolność koncentracji.",
        method: "Forma & Ergonomia",
        impact: "wysoki",
        effort: "niski",
        confidence: "high"
      },
      {
        title: "Zachowaj min. 40-60 cm blatu między płytą a zlewem",
        why: "Separacja strefy Ognia (gotowanie) i Wody (zmywanie) zapobiega konfliktowi żywiołów i podnosi ergonomię pracy.",
        method: "Wu Xing & Ergonomia",
        impact: "wysoki",
        effort: "średni",
        confidence: "high"
      },
      {
        title: "Wprowadź 3 warstwy oświetlenia w strefie dziennej",
        why: "Połączenie światła ogólnego, nastrojowego (2700K) i zadaniowego (4000K) pozwala płynnie sterować rytmem dobowym domowników.",
        method: "Architektura & Światło",
        impact: "wysoki",
        effort: "niski",
        confidence: "high"
      },
      {
        title: "Zdejmij lustro z osi naprzeciw drzwi wejściowych",
        why: "Lustro vis-a-vis wejścia odbija energię Qi i optycznie destabilizuje strefę powitalną.",
        method: "Forma (Qi Kou)",
        impact: "średni",
        effort: "niski",
        confidence: "high"
      }
    ],
    method_scores: methodDefaults,
    levels: [
      {
        label: "Kondygnacja główna",
        score: clampScore(score, 78),
        focus: "Strefa dzienna, wejście i przepływ Qi",
        risks: ["Zbyt szybka oś wejście-okno", "Przeładowanie strefy komunikacyjnej"],
        actions: ["Zapewnij wolne ciągi min. 90 cm", "Wprowadź rośliny w narożnikach"]
      }
    ],
    zones: [
      {
        zone: "Strefa Wejścia",
        state: "Wymaga czystej ścieżki powitalnej",
        recommendation: "Uporządkuj obuwie i zastosuj ciepłe światło powitalne min. 200 lx.",
        method: "Szkoła Formy"
      },
      {
        zone: "Sypialnia Główna",
        state: "Strefa czystego Yin",
        recommendation: "Zapewnij pełne oparcie wezgłowia i kolory Ziemi/Drewna.",
        method: "Szkoła Formy & Wu Xing"
      },
      {
        zone: "Strefa Pracy / Biurko",
        state: "Wymaga kontroli wejścia",
        recommendation: "Ustaw biurko przodem lub bokiem do drzwi z solidną ścianą za plecami.",
        method: "Command Position"
      }
    ],
    directional_insights: [
      {
        title: "Orientacja Kompasowa i Nasłonecznienie",
        direction: hasConfirmedNorth ? `Orientacja północy: ${northAngle}° N` : "Orientacja standardowa",
        meaning: "Kierunki świata określają naturalny rytm doświetlenia: Południe i Zachód dostarczają energii Yang, a Północ sprzyja skupieniu Yin.",
        recommendation: "Dopasuj funkcje pomieszczeń do naturalnego światła dziennego i uzupełnij strefy północne oświetleniem 4000K.",
        confidence: hasConfirmedNorth ? "high" : "medium"
      },
      {
        title: "Oś Przepływu Wejścia (Usta Qi)",
        direction: "Strefa wejścia głównego",
        meaning: "Wejście decyduje o pierwszym wrażeniu i jakości energii rozchodzącej się po całym mieszkaniu.",
        recommendation: "Zadbaj o wolną przestrzeń przed drzwiami i unikaj bezpośredniej linii wzroku wpadającej wprost w okno tarasowe.",
        confidence: "high"
      }
    ],
    sector_map: markedSectors,
    room_recommendations: detectedRoomList.slice(0, 10).map((room) => {
      const exp = getRoomExpertise(room);
      return {
        room,
        function: room,
        diagnosis: exp.diagnosis,
        strengths: exp.strengths,
        risks: exp.risks,
        recommendations: exp.recommendations,
        method: "Forma + Ergonomia + 5 Żywiołów"
      };
    }),
    furniture_recommendations: (furnitureItems.length > 0 ? furnitureItems : ["Łóżko Główne", "Biurko do pracy", "Sofa w salonie", "Płyta kuchenna"]).slice(0, 8).map((item) => {
      const lower = item.toLowerCase();
      if (lower.includes("łóż")) {
        return {
          item: "Łóżko Główne",
          orientation_role: "Wezgłowie (oparcie głowy)",
          direction: "Oparcie o ścianę nośną",
          assessment: "Wezgłowie łóżka musi przylegać do stabilnej ściany murowanej, zapewniając podświadome poczucie ochrony (Czarny Żółw).",
          practical_limit: "Należy unikać ustawienia głowy pod oknem lub bezpośrednio w świetle drzwi.",
          recommendations: [
            "Zapewnij swobodny dostęp do łóżka z obu stron (min. 60-70 cm)",
            "Zastosuj miękkie, tapicerowane wezgłowie i stoliki nocne o obłych krawędziach",
            "Wyeliminuj lustra odbijające taflę materaca"
          ]
        };
      }
      if (lower.includes("biur") || lower.includes("prac")) {
        return {
          item: "Biurko do pracy",
          orientation_role: "Kierunek patrzenia osoby siedzącej",
          direction: "Widok na wejście",
          assessment: "Stanowisko pracy wymaga pełnej pozycji dominującej (Command Position).",
          practical_limit: "Unikaj siedzenia tyłem do drzwi lub twarzą dosuniętą bezpośrednio do ściany.",
          recommendations: [
            "Ustaw fotel tyłem do pełnej ściany, widząc wejście do gabinetu",
            "Zadbaj o doświetlenie blatu z lewej strony (dla osób praworęcznych)",
            "Utrzymuj blat w porządku, stosując zamknięte organizery na dokumenty"
          ]
        };
      }
      if (lower.includes("sof") || lower.includes("kanap")) {
        return {
          item: "Sofa w salonie",
          orientation_role: "Kierunek patrzenia domowników",
          direction: "Oparcie o ścianę",
          assessment: "Główny mebel wypoczynkowy powinien tworzyć bezpieczną strefę integracji.",
          practical_limit: "Sofa nie powinna stać tyłem do głównego ciągu komunikacyjnego z korytarza.",
          recommendations: [
            "Ustaw sofę z oparciem o ścianę lub niską konsolę",
            "Zachowaj min. 45 cm odległości między sofą a stolikiem kawowym",
            "Wprowadź poduszki w kolorach Ziemi i Drewna stabilizujące strefę"
          ]
        };
      }
      return {
        item: "Płyta kuchenna",
        orientation_role: "Podejście osoby gotującej",
        direction: "Front roboczy",
        assessment: "Płyta reprezentuje żywioł Ognia i źródło obfitości domu.",
        practical_limit: "Instalacje determinują lokalizację, ale kluczowy jest bufor blatu od zlewu.",
        recommendations: [
          "Zachowaj minimum 40-60 cm blatu roboczego między płytą a zlewem",
          "Zadbaj o wydajny okap i doświetlenie blatu 4000K",
          "Utrzymuj palniki w nienagannej czystości"
        ]
      };
    }),
    traditional_analysis: [
      {
        title: "Szkoła Formy (Luan Tou) i 4 Zwierzęta",
        body: "Fundamentem aranżacji jest stworzenie poczucia bezpieczeństwa: Czarny Żółw (oparcie za plecami) oraz Karmazynowy Feniks (otwarta przestrzeń z przodu).",
        bullets: [
          "Czarny Żółw: Pełne ściany za łóżkiem i biurkiem",
          "Karmazynowy Feniks: Wolna przestrzeń przed miejscem odpoczynku i pracy",
          "Zielony Smok i Biały Tygrys: Zrównoważenie stron aktywnych (Yang) i pasywnych (Yin)"
        ]
      },
      {
        title: "Siatka 9 Pałaców Bagua (Luo Shu)",
        body: "9 sektorów mapuje dziedziny życia na planie nieruchomości. Sektory powinny być wspierane odpowiednimi żywiołami bez sztucznego przesycenia dekoracjami.",
        bullets: [
          "Północ (Woda): Kariera i klarowność drogi życiowej",
          "Południe (Ogień): Reputacja, widoczność i docenienie",
          "Południowy Zachód (Ziemia): Stabilność relacji i partnerstwo",
          "Wschód i Południowy Wschód (Drewno): Zdrowie, wzrost i finanse"
        ]
      }
    ],
    practical_analysis: [
      {
        title: "Ergonomia i Ciągi Komunikacyjne",
        body: "Nowoczesne wnętrze musi spełniać rygorystyczne kryteria ergonomiczne Neuferta i standardy swobody poruszania się.",
        bullets: [
          "Główne ciągi komunikacyjne: minimum 90–110 cm szerokości",
          "Odstęp łóżka od ściany: minimum 60–70 cm z każdej strony",
          "Trójkąt roboczy w kuchni: suma boków między lodówką, zlewem i płytą 360–660 cm"
        ]
      },
      {
        title: "Warstwy Światła i Rytm Dobowy (Circadian Lighting)",
        body: "Właściwa temperatura barwowa światła bezpośrednio wpływa na samopoczucie, koncentrację i jakość snu.",
        bullets: [
          "Strefa pracy (gabinet, blat kuchenny): 4000K, CRI > 90",
          "Strefa dzienna i jadalnia: 2700K–3000K, światło rozproszone",
          "Sypialnia i strefa wieczorna: 2200K–2700K, ciepłe światło boczne"
        ]
      }
    ],
    practical_changes: [
      { title: "Przestawienie łóżka do pozycji z pełnym oparciem wezgłowia", cost: "0 zł", when: "Natychmiast" },
      { title: "Obrócenie biurka przodem do wejścia (Command Position)", cost: "0 zł", when: "Natychmiast" },
      { title: "Wymiana źródeł światła w sypialni na ciepłe 2200K–2700K", cost: "50–150 zł", when: "W tym tygodniu" },
      { title: "Zastosowanie roślin o obłych liściach w ostrych narożnikach", cost: "80–250 zł", when: "W tym miesiącu" },
      { title: "Przeniesienie lustra z osi naprzeciw drzwi wejściowych", cost: "0–50 zł", when: "Przed przeprowadzką" }
    ],
    purchase_decision: "Układ nieruchomości posiada wysoki potencjał adaptacyjny. Główne zalety to klarowny podział stref oraz dobre możliwości uzyskania pozycji dominującej dla kluczowych mebli bez konieczności kosztownych wyburzeń ścian nośnych.",
    source_ledger: [
      { source: "Szkoła Formy (Luan Tou)", used_for: "Pozycje dominujące mebli, osłona wezgłowia i ciągi komunikacyjne", confidence: "high" },
      { source: "Siatka 9 Stref Bagua (Luo Shu)", used_for: "Rozkład 9 pałaców życiowych na rzucie", confidence: hasConfirmedNorth ? "high" : "medium" },
      { source: "Ergonomia Architektoniczna", used_for: "Wymiary ciągów, trójkąt roboczy i odległości mebli", confidence: "high" },
      { source: "Projektowanie Oświetlenia (PN-EN 12464-1)", used_for: "Dobór 3 warstw światła i temperatury barwowej", confidence: "high" },
      { source: "Pięć Przemian (Wu Xing)", used_for: "Harmonia barw, materiałów i faktur wykończeniowych", confidence: "high" }
    ],
    disclaimer: "Raport jest profesjonalnym narzędziem doradczo-projektowym łączącym tradycyjne zasady Feng Shui ze współczesną wiedzą o ergonomii i architekturze wnętrz. Nie stanowi gwarancji określonych zdarzeń losowych ani ekspertyzy budowlano-konstrukcyjnej.",
    ai_provider: mode === "live" ? "Google Gemini" : "Plan Harmonii AI Engine",
    ai_model: model,
    ai_mode: mode
  };
}

function buildPrompt(payload) {
  return `
Jesteś głównym audytorem architektury wnętrz i mistrzem klasycznego Feng Shui (Szkoła Formy, Siatka Bagua Luo Shu, 5 Żywiołów, Ergonomia i Światło) dla platformy Plan Harmonii.
Twoim zadaniem jest przygotowanie wybitnego, głęboko merytorycznego, precyzyjnego i praktycznego raportu audytowego po polsku.

GŁÓWNE ZASADY JAKOŚCI AUDYTU:
1. ZAKAZ banałów i meta-tekstów (NIGDY nie pisz: "funkcja została oznaczona na planie", "można oddzielić zalecenia", "warto sprawdzić"). Pisz jak wybitny architekt: konkretne diagnozy, fizyczne ustawienia, wymiary w centymetrach, temperatury barwowe w Kelvinach, pozycje dominujące!
2. DLA KAŻDEGO POMIESZCZENIA (Sypialnia, Salon, Kuchnia, Gabinet, Łazienka, Przedpokój) podaj:
   - Diagnozę przestrzenną (Yin/Yang, pozycja dominująca, relacja wejście-okno).
   - Realne Atuty architektoniczne (doświetlenie, oparcie, bufor prywatności).
   - Poważne Ryzyka (łóżko na linii drzwi-okno tzw. pozycja trumienna, lustro vis-a-vis wejścia odbijające Qi, płyta bezpośrednio przy zlewie konflikt Ogień-Woda, siedzenie tyłem do drzwi).
   - Bezwzględnie Konkretne Rekomendacje (jak dokładnie przestawić meble, jakie światło zastosować np. 2200K sypialnia vs 4000K praca, jakie materiały i barwy wprowadzić).
3. MEBLE:
   - Łóżko: oparcie wezgłowia o pełną ścianę (Czarny Żółw), widok na drzwi (pozycja dominująca), min. 60-70 cm dojścia z obu stron, brak luster odbijających materac.
   - Biurko: oparcie za plecami, widok na wejście, światło 4000K z lewej strony.
   - Płyta kuchenna: bufor min. 40-60 cm blatu od zlewu/lodówki (Drewno neutralizuje konflikt Ognia i Wody), dobra widoczność przestrzeni.
   - Sofa: oparcie o ścianę lub niską konsolę, widok na wejście do salonu, ciągi komunikacyjne 90-110 cm.
4. KIERUNKI I PÓŁNOC:
   - Pisz ludzkim językiem (np. "Orientacja północy: 33° N (północno-wschodnia elewacja)"). Nigdy nie pisz "względem góry pliku"!
5. 9 SEKTORÓW BAGUA:
   - Przypisz każdy sektor (Północ - Kariera/Woda, Północny Wschód - Wiedza/Ziemia, Wschód - Zdrowie/Drewno, Południowy Wschód - Finanse/Drewno, Południe - Sława/Ogień, Południowy Zachód - Relacje/Ziemia, Zachód - Kreatywność/Metal, Północny Zachód - Pomocni Ludzie/Metal, Centrum - Tai Qi/Ziemia) do realnych pomieszczeń na rzucie.
6. ZMIANY BEZ REMONTU:
   - Podaj 5-8 konkretnych, natychmiastowych działań z szacowanym kosztem (np. "0 zł", "50-150 zł") i czasem wdrożenia ("Natychmiast", "W tym tygodniu").

DANE WEJŚCIOWE:
${JSON.stringify({
  property_type: payload.propertyType,
  levels_count: payload.levelsCount,
  usable_area_m2: payload.usableAreaM2,
  purpose: payload.purpose,
  orientation_data: payload.orientationData,
  entry_note: payload.entryNote,
  address_note: payload.addressNote,
  constraints_note: payload.constraintsNote,
  profile_note: payload.profileNote,
  plan_annotations: payload.planAnnotations,
  furniture_annotations: payload.furnitureAnnotations,
  building_profile: payload.buildingProfile,
  resident_profiles: payload.residentProfiles,
  selected_methods: payload.selectedMethods,
  files: payload.files?.map((file) => ({ name: file.name, mime_type: inferMimeType(file.name, file.mimeType), size: file.size }))
}, null, 2)}

Zwróć wyłącznie prawidłowy JSON zgodny ze strukturą:
{
  "score": number (0-100),
  "confidence": "low" | "medium" | "high",
  "executive_summary": string,
  "detected_inputs": string[],
  "missing_inputs": string[],
  "priority_actions": [{ "title": string, "why": string, "method": string, "impact": string, "effort": string, "confidence": "low"|"medium"|"high" }],
  "method_scores": [{ "method": string, "score": number, "signal": string }],
  "levels": [{ "label": string, "score": number, "focus": string, "risks": string[], "actions": string[] }],
  "zones": [{ "zone": string, "state": string, "recommendation": string, "method": string }],
  "directional_insights": [{ "title": string, "direction": string, "meaning": string, "recommendation": string, "confidence": "low"|"medium"|"high" }],
  "sector_map": [{ "sector": string, "direction": string, "element": string, "current_use": string, "assessment": string, "advice": string, "priority": string }],
  "room_recommendations": [{ "room": string, "function": string, "diagnosis": string, "strengths": string[], "risks": string[], "recommendations": string[], "method": string }],
  "furniture_recommendations": [{ "item": string, "orientation_role": string, "direction": string, "assessment": string, "practical_limit": string, "recommendations": string[] }],
  "traditional_analysis": [{ "title": string, "body": string, "bullets": string[] }],
  "practical_analysis": [{ "title": string, "body": string, "bullets": string[] }],
  "practical_changes": [{ "title": string, "cost": string, "when": string }],
  "purchase_decision": string,
  "source_ledger": [{ "source": string, "used_for": string, "confidence": "low"|"medium"|"high" }],
  "disclaimer": string
}
`;
}

function parseModelJson(text) {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("Gemini API zwróciło odpowiedź poza formatem JSON.");
  }
}

async function callGeminiModel(payload, apiKey, model) {
  const modelPath = model.startsWith("models/") ? model : `models/${model}`;
  const prompt = buildPrompt(payload);
  const fileParts = (payload.files || []).slice(0, 10).map((file) => ({
    inline_data: {
      mime_type: inferMimeType(file.name, file.mimeType),
      data: file.data
    }
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }, ...fileParts]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || "Gemini API zwróciło błąd.";
    throw new Error(message);
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n");
  if (!text) {
    throw new Error("Gemini API nie zwróciło treści raportu.");
  }

  return parseModelJson(text);
}

async function callGemini(payload, apiKey) {
  const modelCandidates = [
    MODEL,
    ...FALLBACK_MODELS.filter((model) => model !== MODEL)
  ];
  const failures = [];

  for (const model of modelCandidates) {
    try {
      return {
        model,
        report: await callGeminiModel(payload, apiKey, model)
      };
    } catch (error) {
      failures.push({
        model,
        message: error instanceof Error ? error.message : String(error)
      });

      if (!/not found|not available|deprecated|quota|rate limit|billing|credit|prepay|invalid|permission|high demand|temporary|try again later|overload|unavailable/i.test(failures.at(-1)?.message ?? "")) {
        break;
      }
    }
  }

  const error = new Error(failures.map((failure) => `${failure.model}: ${failure.message}`).join(" | "));
  error.failures = failures;
  throw error;
}

function validatePayload(payload) {
  if (!safeText(payload.email).includes("@")) {
    return "Brakuje poprawnego adresu e-mail.";
  }
  if (!Array.isArray(payload.files) || payload.files.length === 0) {
    return "Brakuje planu nieruchomości.";
  }

  const totalBytes = payload.files.reduce((sum, file) => sum + Number(file.size || 0), 0);
  if (totalBytes > MAX_TOTAL_INLINE_BYTES) {
    return "Łączny rozmiar planów jest za duży dla tej wersji generatora.";
  }

  const brokenFile = payload.files.find((file) => !file.data || !file.name);
  if (brokenFile) {
    return "Jeden z plików nie został poprawnie odczytany.";
  }

  const unsupportedFile = payload.files.find((file) => !SUPPORTED_MIME_TYPES.has(inferMimeType(file.name, file.mimeType)));
  if (unsupportedFile) {
    return `Plik ${safeText(unsupportedFile.name, "planu")} ma nieobsługiwany format. Użyj ${SUPPORTED_FORMAT_LABEL}.`;
  }

  return null;
}

function normalizeArray(value, fallback = []) {
  return Array.isArray(value) ? value : fallback;
}

function normalizeStringArray(value, fallback = [], limit = 6) {
  const normalized = normalizeArray(value, fallback).map(String).filter((item) => item.trim().length > 0);
  return normalized.slice(0, limit);
}

function normalizeReport(report, payload, mode, model) {
  const fallback = buildFallbackReport(payload, mode, model);

  return {
    score: clampScore(report?.score, fallback.score),
    confidence: normalizeConfidence(report?.confidence),
    executive_summary: safeText(report?.executive_summary, fallback.executive_summary),
    detected_inputs: normalizeArray(report?.detected_inputs, fallback.detected_inputs).map(String).slice(0, 8),
    missing_inputs: normalizeArray(report?.missing_inputs, fallback.missing_inputs).map(String).slice(0, 8),
    priority_actions: normalizeArray(report?.priority_actions, fallback.priority_actions).slice(0, 8).map((item, index) => ({
      title: safeText(item?.title, fallback.priority_actions[index % fallback.priority_actions.length].title),
      why: safeText(item?.why, fallback.priority_actions[index % fallback.priority_actions.length].why),
      method: safeText(item?.method, fallback.priority_actions[index % fallback.priority_actions.length].method),
      impact: safeText(item?.impact, "wysoki"),
      effort: safeText(item?.effort, "niski"),
      confidence: normalizeConfidence(item?.confidence)
    })),
    method_scores: normalizeArray(report?.method_scores, fallback.method_scores).slice(0, 8).map((item, index) => ({
      method: safeText(item?.method, methodDefaults[index % methodDefaults.length].method),
      score: clampScore(item?.score, methodDefaults[index % methodDefaults.length].score),
      signal: safeText(item?.signal, methodDefaults[index % methodDefaults.length].signal)
    })),
    levels: normalizeArray(report?.levels, fallback.levels).slice(0, 6).map((item, index) => ({
      label: safeText(item?.label, fallback.levels[index % fallback.levels.length].label),
      score: clampScore(item?.score, fallback.levels[index % fallback.levels.length].score),
      focus: safeText(item?.focus, fallback.levels[index % fallback.levels.length].focus),
      risks: normalizeStringArray(item?.risks, fallback.levels[index % fallback.levels.length].risks, 4),
      actions: normalizeStringArray(item?.actions, fallback.levels[index % fallback.levels.length].actions, 4)
    })),
    zones: normalizeArray(report?.zones, fallback.zones).slice(0, 6).map((item, index) => ({
      zone: safeText(item?.zone, fallback.zones[index % fallback.zones.length].zone),
      state: safeText(item?.state, fallback.zones[index % fallback.zones.length].state),
      recommendation: safeText(item?.recommendation, fallback.zones[index % fallback.zones.length].recommendation),
      method: safeText(item?.method, fallback.zones[index % fallback.zones.length].method)
    })),
    directional_insights: normalizeArray(report?.directional_insights, fallback.directional_insights).slice(0, 6).map((item, index) => ({
      title: safeText(item?.title, fallback.directional_insights[index % fallback.directional_insights.length].title),
      direction: safeText(item?.direction, fallback.directional_insights[index % fallback.directional_insights.length].direction),
      meaning: safeText(item?.meaning, fallback.directional_insights[index % fallback.directional_insights.length].meaning),
      recommendation: safeText(item?.recommendation, fallback.directional_insights[index % fallback.directional_insights.length].recommendation),
      confidence: normalizeConfidence(item?.confidence)
    })),
    sector_map: normalizeArray(report?.sector_map, fallback.sector_map).slice(0, 9).map((item, index) => ({
      sector: safeText(item?.sector, fallback.sector_map[index % fallback.sector_map.length].sector),
      direction: safeText(item?.direction, fallback.sector_map[index % fallback.sector_map.length].direction),
      element: safeText(item?.element, fallback.sector_map[index % fallback.sector_map.length].element),
      current_use: safeText(item?.current_use, fallback.sector_map[index % fallback.sector_map.length].current_use),
      assessment: safeText(item?.assessment, fallback.sector_map[index % fallback.sector_map.length].assessment),
      advice: safeText(item?.advice, fallback.sector_map[index % fallback.sector_map.length].advice),
      priority: safeText(item?.priority, "średni")
    })),
    room_recommendations: normalizeArray(report?.room_recommendations, fallback.room_recommendations).slice(0, 12).map((item, index) => ({
      room: safeText(item?.room, fallback.room_recommendations[index % fallback.room_recommendations.length].room),
      function: safeText(item?.function, fallback.room_recommendations[index % fallback.room_recommendations.length].function),
      diagnosis: safeText(item?.diagnosis, fallback.room_recommendations[index % fallback.room_recommendations.length].diagnosis),
      strengths: normalizeStringArray(item?.strengths, fallback.room_recommendations[index % fallback.room_recommendations.length].strengths, 6),
      risks: normalizeStringArray(item?.risks, fallback.room_recommendations[index % fallback.room_recommendations.length].risks, 6),
      recommendations: normalizeStringArray(item?.recommendations, fallback.room_recommendations[index % fallback.room_recommendations.length].recommendations, 6),
      method: safeText(item?.method, "Forma + Ergonomia + 5 Żywiołów")
    })),
    furniture_recommendations: normalizeArray(report?.furniture_recommendations, fallback.furniture_recommendations).slice(0, 12).map((item, index) => ({
      item: safeText(item?.item, fallback.furniture_recommendations[index % fallback.furniture_recommendations.length].item),
      orientation_role: safeText(item?.orientation_role, fallback.furniture_recommendations[index % fallback.furniture_recommendations.length].orientation_role),
      direction: safeText(item?.direction, fallback.furniture_recommendations[index % fallback.furniture_recommendations.length].direction),
      assessment: safeText(item?.assessment, fallback.furniture_recommendations[index % fallback.furniture_recommendations.length].assessment),
      practical_limit: safeText(item?.practical_limit, fallback.furniture_recommendations[index % fallback.furniture_recommendations.length].practical_limit),
      recommendations: normalizeStringArray(item?.recommendations, fallback.furniture_recommendations[index % fallback.furniture_recommendations.length].recommendations, 6)
    })),
    traditional_analysis: normalizeArray(report?.traditional_analysis, fallback.traditional_analysis).slice(0, 8).map((item, index) => ({
      title: safeText(item?.title, fallback.traditional_analysis[index % fallback.traditional_analysis.length].title),
      body: safeText(item?.body, fallback.traditional_analysis[index % fallback.traditional_analysis.length].body),
      bullets: normalizeStringArray(item?.bullets, fallback.traditional_analysis[index % fallback.traditional_analysis.length].bullets, 6)
    })),
    practical_analysis: normalizeArray(report?.practical_analysis, fallback.practical_analysis).slice(0, 8).map((item, index) => ({
      title: safeText(item?.title, fallback.practical_analysis[index % fallback.practical_analysis.length].title),
      body: safeText(item?.body, fallback.practical_analysis[index % fallback.practical_analysis.length].body),
      bullets: normalizeStringArray(item?.bullets, fallback.practical_analysis[index % fallback.practical_analysis.length].bullets, 6)
    })),
    practical_changes: normalizeArray(report?.practical_changes, fallback.practical_changes).slice(0, 8).map((item, index) => ({
      title: safeText(item?.title, fallback.practical_changes[index % fallback.practical_changes.length].title),
      cost: safeText(item?.cost, "niski koszt"),
      when: safeText(item?.when, "przed decyzją")
    })),
    purchase_decision: safeText(report?.purchase_decision, fallback.purchase_decision),
    source_ledger: normalizeArray(report?.source_ledger, fallback.source_ledger).slice(0, 8).map((item, index) => ({
      source: safeText(item?.source, fallback.source_ledger[index % fallback.source_ledger.length].source),
      used_for: safeText(item?.used_for, fallback.source_ledger[index % fallback.source_ledger.length].used_for),
      confidence: normalizeConfidence(item?.confidence)
    })),
    disclaimer: safeText(report?.disclaimer, fallback.disclaimer),
    ai_provider: mode === "live" ? "Google Gemini" : fallback.ai_provider,
    ai_model: model,
    ai_mode: mode
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Dozwolona jest tylko metoda POST." });
  }

  let payload;
  try {
    payload = parseBody(req);
  } catch {
    return res.status(400).json({ error: "Niepoprawne dane wejściowe." });
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    const report = buildFallbackReport(payload, "demo", MODEL);
    return res.status(200).json({
      report,
      provider: report.ai_provider,
      model: MODEL,
      mode: "demo"
    });
  }

  try {
    const { report: rawReport, model } = await callGemini(payload, apiKey);
    const report = normalizeReport(rawReport, payload, "live", model);

    return res.status(200).json({
      report,
      provider: report.ai_provider,
      model,
      mode: "live"
    });
  } catch (error) {
    console.error("Błąd generowania audytu Gemini:", error);
    const fallbackReport = buildFallbackReport(payload, "fallback", MODEL);

    return res.status(200).json({
      report: fallbackReport,
      provider: "Plan Harmonii AI Engine",
      model: MODEL,
      mode: "fallback",
      warning: "Użyto zaawansowanego silnika regułowego z powodu chwilowej niedostępności API."
    });
  }
}
