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

export function inferMimeType(fileName, fallback = "") {
  const extension = String(fileName || "").split(".").pop()?.toLowerCase();

  if (extension === "pdf") return "application/pdf";
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "webp") return "image/webp";
  if (extension === "heic") return "image/heic";
  if (extension === "heif") return "image/heif";

  return fallback;
}

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
    diagnosis: "Strefa czystego Yin. Wymaga całkowitego wyciszenia, ochrony przed przeciągami energii i solidnego oparcia wezgłowia o pełną ścianę nośną (Czarny Żółw).",
    strengths: [
      "Możliwość zachowania min. 65 cm swobodnego dojścia z obu stron łóżka (równowaga relacyjna)",
      "Wezgłowie z dala od hałaśliwych pionów kanalizacyjnych i windy",
      "Brak belek stropowych i ciężkich szafek wiszących bezpośrednio nad głową"
    ],
    risks: [
      "Łóżko w bezpośredniej osi drzwi-okno (tzw. tunel Chong Qi wywołujący płytki sen)",
      "Lustro odbijające taflę materaca (nadmierna stymulacja Yang zaburzająca fazę REM)",
      "Ostre krawędzie szafek nocnych celujące w głowę (tzw. zatrute strzały Sha Qi)"
    ],
    recommendations: [
      "Dosuń wezgłowie łóżka do pełnej ściany, zachowując widok na drzwi, ale poza ich osią",
      "Zainstaluj ciepłe oświetlenie nocne 2200K–2700K (brak pasma niebieskiego)",
      "Wprowadź naturalne tekstylia (len, wełna) i barwy Ziemi (beż, piasek, terakota)"
    ]
  },
  salon: {
    diagnosis: "Główne centrum Yang i przestrzeń integracji. Wymaga wyrazistego centrum, jasnego światła dziennego i stabilnego podparcia strefy wypoczynkowej.",
    strengths: [
      "Naturalne doświetlenie słoneczne od strony południowej/zachodniej",
      "Przestronność umożliwiająca zachowanie swobodnych ciągów komunikacyjnych min. 90–110 cm",
      "Możliwość wydzielenia strefy jadalnej bez kolizji ze strefą TV"
    ],
    risks: [
      "Sofa ustawiona tyłem do wejścia (wywołująca podświadomy mikrostres i brak kontroli)",
      "Zatory meblowe blokujące swobodne dojście do okna balkonowego",
      "Brak wyrazistego punktu centralnego sprzyjającego skupieniu uwagi domowników"
    ],
    recommendations: [
      "Ustaw główną sofę z oparciem o ścianę lub niską konsolę z roślinami",
      "Wprowadź 3 warstwy oświetlenia: sufitowe ogólne, lampę 2700K do czytania i nastrojowe kinkiety",
      "Umieść w narożnikach rośliny o miękkich, obłych liściach (Monstera, Ficus elastica) neutralizujące Sha Qi"
    ]
  },
  kuchnia: {
    diagnosis: "Serce metabolizmu i dobrobytu domu. Kluczowym zadaniem jest rozdzielenie żywiołu Ognia (płyta) od Wody (zlew) oraz zachowanie trójkąta roboczego.",
    strengths: [
      "Logiczny ciąg technologiczny: lodówka -> zlew -> blat roboczy -> płyta grzewcza",
      "Dostęp do wydajnej wentylacji i dobrego doświetlenia blatu"
    ],
    risks: [
      "Płyta grzewcza stykająca się bezpośrednio ze zlewem (konflikt Ogień–Woda niszczący równowagę)",
      "Osoba gotująca stojąca tyłem do wejścia do kuchni (poczucie zaskoczenia)",
      "Przeładowanie blatów drobnym AGD blokujące przepływ Qi"
    ],
    recommendations: [
      "Zapewnij minimum 40–60 cm blatu z drewna lub kompozytu między płytą a zlewem (Drewno łączy żywioły)",
      "Zainstaluj oświetlenie podszafkowe 4000K o wysokim współczynniku oddawania barw (CRI > 90)",
      "Zamontuj subtelny panel ze stali szczotkowanej lub lustro ułatwiające widok na wejście podczas gotowania"
    ]
  },
  gabinet: {
    diagnosis: "Strefa skupienia, autorytetu i jasności decyzji biznesowych. Wymaga bezwzględnej pozycji dowodzenia (Command Position).",
    strengths: [
      "Wydzielona przestrzeń chroniąca przed domowym hałasem",
      "Dobre doświetlenie światłem dziennym padającym z boku stanowiska pracy"
    ],
    risks: [
      "Siedzenie tyłem do drzwi (brak poczucia bezpieczeństwa i permanentny spadek koncentracji)",
      "Biurko dosunięte bezpośrednio do ściany (brak perspektywy i uczucie klaustrofobii)",
      "Odblaski promieni słonecznych na monitorze powodujące szybkie zmęczenie wzroku"
    ],
    recommendations: [
      "Ustaw fotel z oparciem o pełną ścianę i widokiem na drzwi (pozycja dominująca)",
      "Zadbaj o lampę zadaniową 4000K z regulacją natężenia światła",
      "Wprowadź akcenty Metalu (organizery, mosiądz) i Ziemi sprzyjające stabilności finansowej"
    ]
  },
  przedpokój: {
    diagnosis: "Usta Qi (Qi Kou) – pierwszy filtr energetyczny. Decyduje o pierwszym wrażeniu i jakości energii rozprowadzanej do reszty mieszkania.",
    strengths: [
      "Czytelne wydzielenie strefy wejściowej zatrzymującej brud i obuwie",
      "Dobre proporcje umożliwiające montaż szafy wnękowej"
    ],
    risks: [
      "Lustro zawieszone na wprost drzwi wejściowych (odbijające energię z powrotem na klatkę)",
      "Wąskie przejście poniżej 90 cm zastawione butami",
      "Bezpośrednia linia wzroku z wejścia wpadająca wprost do toalety lub na płytę kuchenną"
    ],
    recommendations: [
      "Przenieś lustro na ścianę boczną pod kątem 90° do drzwi wejściowych",
      "Zamknij obuwie i okrycia w szafie wnękowej, eliminując chaos wizualny",
      "Zastosuj jasne, ciepłe oświetlenie powitalne min. 250 lx"
    ]
  },
  łazienka: {
    diagnosis: "Strefa silnego odpływu żywiołu Wody. Wymaga zabezpieczenia przed ucieczką energii życiowej z części mieszkalnej.",
    strengths: [
      "Sprawna wentylacja grawitacyjna lub mechaniczna",
      "Wysokiej jakości ceramika i szczelna armatura zapobiegająca stratom wody"
    ],
    risks: [
      "Drzwi łazienki otwierające się bezpośrednio na stół w jadalni lub wezgłowie łóżka",
      "Lokalizacja łazienki w centrum geometrycznym rzutu (osłabienie serca domu Tai Qi)"
    ],
    recommendations: [
      "Zamykaj drzwi łazienki oraz klapę toalety po każdym użyciu",
      "Wprowadź elementy Ziemi (ceramika, beże) i Drewna (rośliny, bambus), które równoważą nadmiar Wody",
      "Zadbaj o neutralne oświetlenie lustra 3000K–4000K bez cieni pod oczami"
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

function calculateKuaNode(birthDateStr, gender = "male") {
  if (!birthDateStr) return null;
  const date = new Date(birthDateStr);
  if (isNaN(date.getTime())) return null;

  let year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (month === 1 || (month === 2 && day < 4)) {
    year -= 1;
  }

  const lastTwoDigits = year % 100;
  let sum = Math.floor(lastTwoDigits / 10) + (lastTwoDigits % 10);
  while (sum > 9) {
    sum = Math.floor(sum / 10) + (sum % 10);
  }

  const isFemale = String(gender).toLowerCase().includes("fem") || String(gender).toLowerCase().includes("kob") || String(gender).toLowerCase().includes("k");
  const isPost2000 = year >= 2000;

  let kua = 0;
  if (!isFemale) {
    kua = isPost2000 ? (9 - sum) : (10 - sum);
    while (kua <= 0) kua += 9;
    while (kua > 9) kua -= 9;
    if (kua === 5) kua = 2;
  } else {
    kua = isPost2000 ? (sum + 6) : (sum + 5);
    while (kua > 9) {
      kua = Math.floor(kua / 10) + (kua % 10);
    }
    if (kua === 5) kua = 8;
  }

  const KUA_INFO = {
    1: { element: "Woda", trigram: "Kan (坎)", group: "Grupa Wschodnia", fav: ["Południowy Wschód (Sheng Chi)", "Wschód (Tian Yi)", "Południe (Yan Nian)", "Północ (Fu Wei)"], unfav: ["Zachód (Jue Ming)", "Północny Wschód (Wu Gui)", "Północny Zachód (Liu Sha)", "Południowy Zachód (Huo Hai)"], bed: "Głowa na Wschód (Zdrowie) lub Południowy Wschód (Witalność). Unikać wezgłowia na Zachód." },
    2: { element: "Ziemia", trigram: "Kun (坤)", group: "Grupa Zachodnia", fav: ["Północny Wschód (Sheng Chi)", "Zachód (Tian Yi)", "Północny Zachód (Yan Nian)", "Południowy Zachód (Fu Wei)"], unfav: ["Północ (Jue Ming)", "Południowy Wschód (Wu Gui)", "Południe (Liu Sha)", "Wschód (Huo Hai)"], bed: "Głowa na Zachód (Zdrowie) lub Północny Wschód (Sukces). Unikać wezgłowia na Północ." },
    3: { element: "Drewno", trigram: "Zhen (震)", group: "Grupa Wschodnia", fav: ["Południe (Sheng Chi)", "Północ (Tian Yi)", "Południowy Wschód (Yan Nian)", "Wschód (Fu Wei)"], unfav: ["Zachód (Jue Ming)", "Północny Zachód (Wu Gui)", "Północny Wschód (Liu Sha)", "Południowy Zachód (Huo Hai)"], bed: "Głowa na Północ (Zdrowie) lub Południe (Witalność). Chronić strefę głowy przed kierunkami zachodnimi." },
    4: { element: "Drewno", trigram: "Xun (巽)", group: "Grupa Wschodnia", fav: ["Północ (Sheng Chi)", "Południe (Tian Yi)", "Wschód (Yan Nian)", "Południowy Wschód (Fu Wei)"], unfav: ["Północny Wschód (Jue Ming)", "Południowy Zachód (Wu Gui)", "Zachód (Liu Sha)", "Północny Zachód (Huo Hai)"], bed: "Głowa na Południe (Zdrowie) lub Północ (Najwyższa Witalność)." },
    6: { element: "Metal", trigram: "Qian (乾)", group: "Grupa Zachodnia", fav: ["Zachód (Sheng Chi)", "Północny Wschód (Tian Yi)", "Południowy Zachód (Yan Nian)", "Północny Zachód (Fu Wei)"], unfav: ["Południe (Jue Ming)", "Wschód (Wu Gui)", "Północ (Liu Sha)", "Południowy Wschód (Huo Hai)"], bed: "Głowa na Północny Wschód (Zdrowie) lub Zachód. Bezwzględnie unikać głowy na Południe." },
    7: { element: "Metal", trigram: "Dui (兌)", group: "Grupa Zachodnia", fav: ["Północny Zachód (Sheng Chi)", "Południowy Zachód (Tian Yi)", "Północny Wschód (Yan Nian)", "Zachód (Fu Wei)"], unfav: ["Wschód (Jue Ming)", "Południe (Wu Gui)", "Południowy Wschód (Liu Sha)", "Północ (Huo Hai)"], bed: "Głowa na Południowy Zachód (Zdrowie/Relacje) lub Północny Zachód." },
    8: { element: "Ziemia", trigram: "Gen (艮)", group: "Grupa Zachodnia", fav: ["Południowy Zachód (Sheng Chi)", "Północny Zachód (Tian Yi)", "Zachód (Yan Nian)", "Północny Wschód (Fu Wei)"], unfav: ["Południowy Wschód (Jue Ming)", "Północ (Wu Gui)", "Wschód (Liu Sha)", "Południe (Huo Hai)"], bed: "Głowa na Północny Zachód (Zdrowie) lub Południowy Zachód." },
    9: { element: "Ogień", trigram: "Li (離)", group: "Grupa Wschodnia", fav: ["Wschód (Sheng Chi)", "Południowy Wschód (Tian Yi)", "Północ (Yan Nian)", "Południe (Fu Wei)"], unfav: ["Północny Zachód (Jue Ming)", "Zachód (Wu Gui)", "Południowy Zachód (Liu Sha)", "Północny Wschód (Huo Hai)"], bed: "Głowa na Południowy Wschód (Zdrowie) lub Wschód. Unikać głowy na Północny Zachód." }
  };

function calculateBuildingNatalChartNode(constructionYearStr, renovationYearStr, facingAngleDeg = 180) {
  const year = Number(renovationYearStr || constructionYearStr || 2018);
  let p = 8;
  let pName = "Okres 8";
  let pRange = "2004–2023";
  let pElement = "Ziemia";
  let pTrigram = "Gen (艮)";

  if (year >= 2024) { p = 9; pName = "Okres 9"; pRange = "2024–2043"; pElement = "Ogień"; pTrigram = "Li (離)"; }
  else if (year >= 2004) { p = 8; pName = "Okres 8"; pRange = "2004–2023"; pElement = "Ziemia"; pTrigram = "Gen (艮)"; }
  else if (year >= 1984) { p = 7; pName = "Okres 7"; pRange = "1984–2003"; pElement = "Metal"; pTrigram = "Dui (兌)"; }
  else if (year >= 1964) { p = 6; pName = "Okres 6"; pRange = "1964–1983"; pElement = "Metal"; pTrigram = "Qian (乾)"; }
  else if (year >= 1944) { p = 5; pName = "Okres 5"; pRange = "1944–1963"; pElement = "Ziemia"; pTrigram = "Tai Qi"; }
  else { p = 4; pName = "Okres 4"; pRange = "1924–1943"; pElement = "Drewno"; pTrigram = "Xun (巽)"; }

  const normalized = ((Math.round(facingAngleDeg) % 360) + 360) % 360;
  let facingDirName = "Południe (S)";
  let sittingDirName = "Północ (N)";

  if (normalized >= 338 || normalized < 23) { facingDirName = "Północ (N)"; sittingDirName = "Południe (S)"; }
  else if (normalized < 68) { facingDirName = "Północny Wschód (NE)"; sittingDirName = "Południowy Zachód (SW)"; }
  else if (normalized < 113) { facingDirName = "Wschód (E)"; sittingDirName = "Zachód (W)"; }
  else if (normalized < 158) { facingDirName = "Południowy Wschód (SE)"; sittingDirName = "Północny Zachód (NW)"; }
  else if (normalized < 203) { facingDirName = "Południe (S)"; sittingDirName = "Północ (N)"; }
  else if (normalized < 248) { facingDirName = "Południowy Zachód (SW)"; sittingDirName = "Północny Wschód (NE)"; }
  else if (normalized < 293) { facingDirName = "Zachód (W)"; sittingDirName = "Wschód (E)"; }
  else { facingDirName = "Północny Zachód (NW)"; sittingDirName = "Południowy Wschód (SE)"; }

  const palaces = [
    { code: "N", direction: "Północ", element: "Woda", palaceBase: 1 },
    { code: "NE", direction: "Północny wschód", element: "Ziemia", palaceBase: 8 },
    { code: "E", direction: "Wschód", element: "Drewno", palaceBase: 3 },
    { code: "SE", direction: "Południowy wschód", element: "Drewno", palaceBase: 4 },
    { code: "S", direction: "Południe", element: "Ogień", palaceBase: 9 },
    { code: "SW", direction: "Południowy zachód", element: "Ziemia", palaceBase: 2 },
    { code: "W", direction: "Zachód", element: "Metal", palaceBase: 7 },
    { code: "NW", direction: "Północny zachód", element: "Metal", palaceBase: 6 },
    { code: "C", direction: "Centrum (Tai Qi)", element: "Ziemia", palaceBase: 5 }
  ].map((item) => {
    let mountainStar = ((p + item.palaceBase - 1) % 9) || 9;
    let waterStar = ((p + (10 - item.palaceBase) - 1) % 9) || 9;
    const baseStar = item.palaceBase;

    if (item.direction.includes(facingDirName.split(" ")[0])) {
      waterStar = p === 9 ? 9 : (p === 8 ? 8 : 9);
      mountainStar = (p === 9 ? 1 : (p === 8 ? 8 : 7));
    } else if (item.direction.includes(sittingDirName.split(" ")[0])) {
      mountainStar = p === 9 ? 9 : (p === 8 ? 8 : 9);
      waterStar = (p === 9 ? 1 : (p === 8 ? 8 : 7));
    }

    const isProsperousWater = waterStar === 9 || waterStar === 1 || waterStar === 8;
    const isProsperousMountain = mountainStar === 9 || mountainStar === 1 || mountainStar === 8;
    const hasFiveYellow = mountainStar === 5 || waterStar === 5 || baseStar === 5;
    const hasTwoBlack = mountainStar === 2 || waterStar === 2;

    let healthDesc = `Gwiazda Górska ${mountainStar}: `;
    if (isProsperousMountain) {
      healthDesc += "Wysoki potencjał witalny. Znakomity sektor na sypialnię i regenerację.";
    } else if (mountainStar === 5) {
      healthDesc += "Wymaga ciszy i braku gwałtownych ingerencji budowlanych.";
    } else {
      healthDesc += "Umiarkowana energia witalna; wspieraj naturalnym światłem.";
    }

    let wealthDesc = `Gwiazda Wodna ${waterStar}: `;
    if (isProsperousWater) {
      wealthDesc += "Główny sektor aktywności finansowej i rozwoju kariery.";
    } else if (waterStar === 5) {
      wealthDesc += "Wskazana ostrożność finansowa i ład przestrzenny.";
    } else {
      wealthDesc += "Stabilny przepływ; energia wymaga regularnego pobudzania.";
    }

    let remedy = "Harmonijny układ żywiołów.";
    if (hasFiveYellow) remedy = "Wprowadź Żywioł Metalu (mosiądz, biel), aby zneutralizować Gwiazdę 5.";
    else if (hasTwoBlack) remedy = "Zastosuj elementy Metalu i unikaj nadmiaru Ognia.";
    else if (isProsperousWater) remedy = "Wprowadź aktywność Yang: światło dzienne i rośliny.";

    let period9Outlook = `W Okresie 9 (2024–2043) ${waterStar === 9 || mountainStar === 9 ? "osiąga najwyższy poziom pomyślności." : "utrzymuje stabilny balans."}`;

    return {
      direction: item.direction,
      code: item.code,
      mountain_star: mountainStar,
      base_star: baseStar,
      water_star: waterStar,
      nature: `${item.element} · Pałac ${item.palaceBase}`,
      health_relationships: healthDesc,
      wealth_career: wealthDesc,
      remedy_wu_xing: remedy,
      period9_outlook: period9Outlook
    };
  });

  return {
    period: p,
    period_label: `${pName} (${pRange}) · Żywioł ${pElement}`,
    period_element: pElement,
    construction_year: constructionYearStr || undefined,
    facing_direction: facingDirName,
    sitting_direction: sittingDirName,
    facing_angle_deg: normalized,
    chart_type: `Wykres Urodzeniowy ${pName} (${pRange})`,
    summary: `Budynek wzniesiony/zamieszkany w ${pName} posiada unikalny zapis energetyczny Qi. Fasada na ${facingDirName} i tył na ${sittingDirName} determinują rozkład energii witalnej i finansowej. W bieżącym Okresie 9 (2024–2043) kluczowa jest aktywacja sektorów z Gwiazdą 9 i 1.`,
    palaces,
    period9_strategy: "W Okresie 9 (2024–2043) przenieś główną aktywność życiową i biznesową do stref z Gwiazdą 9 i 1, a sektory z Gwiazdą 5 neutralizuj żywiołem Metalu."
  };
}

function getFilteredFurnitureRecommendations(planMarkers, keyPieces) {
  const allSpecified = new Set([
    ...(planMarkers || []).filter((m) => m?.category === "furniture").map((m) => m.label),
    ...(keyPieces || [])
  ]);

  const catalog = {
    "Łóżko": {
      item: "Łóżko",
      orientation_role: "Wezgłowie (oparcie głowy)",
      direction: "Oparcie o pełną ścianę murowaną (Czarny Żółw)",
      assessment: "Wezgłowie łóżka musi przylegać do stabilnej ściany murowanej z dala od okien i rur kanalizacyjnych. Strzałka na rzucie wskazuje kierunek nóg i wzroku leżącego.",
      practical_limit: "Należy bezwzględnie unikać ustawienia głowy pod oknem lub bezpośrednio w osi drzwi wejściowych do pokoju.",
      recommendations: [
        "Zapewnij swobodne dojście z obu stron łóżka min. 65 cm",
        "Zastosuj miękkie tapicerowane wezgłowie i ciepłe lampki nocne 2200K–2700K",
        "Wyeliminuj lustra odbijające śpiące osoby w nocy"
      ]
    },
    "Biurko": {
      item: "Biurko do pracy",
      orientation_role: "Kierunek patrzenia osoby pracującej",
      direction: "Widok na drzwi (Command Position)",
      assessment: "Stanowisko pracy wymaga pełnej pozycji dowodzenia – plecy podparte ścianą, wzrok na wejście pod kątem.",
      practical_limit: "Unikaj siedzenia tyłem do drzwi lub twarzą dosuniętą bezpośrednio do ściany (blokada Feniksa).",
      recommendations: [
        "Ustaw fotel tyłem do ściany pod kątem 45-90° do okna",
        "Doświetl blat lampą zadaniową 4000K z lewej strony (dla praworęcznych)",
        "Zastosuj zamknięte organizery na dokumenty, aby uniknąć Sha Qi"
      ]
    },
    "Lustro": {
      item: "Lustro",
      orientation_role: "Kierunek odbicia tafli lustra",
      direction: "Ściana boczna (poza osią łóżka i drzwi)",
      assessment: "Lustro podwaja i przyspiesza przepływ Qi. Nie może odbijać materaca w sypialni ani drzwi wejściowych.",
      practical_limit: "Odbicie śpiących osób w nocy wywołuje podświadomy niepokój i zakłóca regenerację.",
      recommendations: [
        "Zawieś lustro na ścianie bocznej tak, aby nie odbijało łóżka ani wejścia",
        "W jadalni zawieś lustro odbijające stół – symbolizuje podwojenie obfitości",
        "W wąskim przedpokoju lustro optycznie poszerza wąski korytarz"
      ]
    },
    "Sofa": {
      item: "Sofa w salonie",
      orientation_role: "Kierunek patrzenia domowników",
      direction: "Oparcie o ścianę lub niską konsolę",
      assessment: "Główny mebel wypoczynkowy powinien tworzyć bezpieczną strefę integracji z widokiem na pokój.",
      practical_limit: "Sofa nie powinna stać tyłem do głównego wejścia do strefy dziennej.",
      recommendations: [
        "Ustaw sofę z oparciem o ścianę lub konsolę z roślinami",
        "Zachowaj min. 45 cm odległości od stolika kawowego",
        "Wprowadź miękki dywan stabilizujący strefę wypoczynku"
      ]
    },
    "Płyta/kuchenka": {
      item: "Płyta kuchenna",
      orientation_role: "Podejście osoby gotującej",
      direction: "Front roboczy z widokiem",
      assessment: "Płyta reprezentuje żywioł Ognia. Wymaga bufora od zlewu (Woda) oraz dobrej widoczności.",
      practical_limit: "Instalacje determinują lokalizację, ale kluczowy jest bufor blatu min. 40-60 cm.",
      recommendations: [
        "Zachowaj min. 40-60 cm blatu między płytą a zlewem (Drewno neutralizuje konflikt Ognia i Wody)",
        "Zainstaluj oświetlenie podszafkowe 4000K CRI > 90",
        "Utrzymuj płytę w nienagannej czystości"
      ]
    },
    "Stół": {
      item: "Stół jadalniany",
      orientation_role: "Główne miejsca siedzenia",
      direction: "Centrum strefy jadalnej",
      assessment: "Stół jest sercem integracji domowników. Wymaga stabilnego doświetlenia i swobodnego odejścia krzeseł.",
      practical_limit: "Zapewnij min. 80-90 cm przestrzeni wokół stołu na odsunięcie krzesła i przejście.",
      recommendations: [
        "Zawieś lampę centralnie nad blatem stołu na wysokości 75-85 cm",
        "Preferuj stoły o zaoblonych narożnikach dla łagodnego przepływu Qi",
        "Wprowadź świeże kwiaty lub misę z owocami jako symbol dostatku"
      ]
    }
  };

  const results = [];
  for (const [key, card] of Object.entries(catalog)) {
    const isMatch = Array.from(allSpecified).some((item) => item.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(item.toLowerCase()));
    if (isMatch) {
      results.push(card);
    }
  }

  if (results.length === 0) {
    results.push(catalog["Łóżko"]);
  }

  return results;
}

function buildFallbackReport(payload, mode, model) {
  const propertyLabel = payload.propertyType === "house" ? "domu" : payload.propertyType === "business" ? "lokalu użytkowego" : "mieszkania";
  const levelsCount = Math.max(1, Math.min(12, Number(payload.levelsCount) || 1));
  const orientationData = payload.orientationData || {};
  const planAnnotations = payload.planAnnotations || {};
  const residentProfiles = payload.residentProfiles || [];
  const roomFunctions = planAnnotations.roomFunctions || [];
  const fixedElements = planAnnotations.fixedElements || [];
  const planMarkers = planAnnotations.markers || [];
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
      ? "Centrum (Tai Qi) powinno pozostać wolne od ciężkich ścian i zatorów, stanowiąc serce równowagi domu."
      : `Wprowadź akcenty żywiołu ${sector.element.toLowerCase()} w wykończeniu i dodatkach.`,
    priority: "średni"
  }));

  const residentAnalysis = residentProfiles.map((res, i) => {
    const kua = calculateKuaNode(res.birthDate, res.gender);
    const name = res.label || `Mieszkaniec ${i + 1}`;
    if (!kua) {
      return {
        name,
        role: res.role || "Domownik",
        kua_number: 0,
        element: "Do uzupełnienia",
        group: "Brak daty urodzenia",
        favorable_directions: ["Wymaga podania daty urodzenia"],
        unfavorable_directions: [],
        placement_advice: "Podaj datę urodzenia domownika w formularzu, aby wyliczyć osobistą Liczbę Kua i sprzyjające kierunki snu i pracy.",
        yearly_warning: ""
      };
    }

    return {
      name,
      role: res.role || "Domownik",
      birth_year: res.birthDate ? res.birthDate.slice(0, 4) : undefined,
      gender: res.gender === "female" ? "Kobieta" : "Mężczyzna",
      kua_number: kua.kua,
      element: kua.element,
      group: kua.group,
      favorable_directions: kua.fav,
      unfavorable_directions: kua.unfav,
      assigned_furniture: res.assignedFurniture || [],
      placement_advice: kua.bed,
      yearly_warning: `Dla żywiołu ${kua.element} w bieżącym roku zalecana szczególna dbałość o czystość energetyczną strefy snu.`
    };
  });

  return {
    score: clampScore(score, 78),
    confidence: hasConfirmedNorth && hasEntry ? "high" : "medium",
    executive_summary: `Audyt ${propertyLabel} wykazuje wysoki potencjał adaptacyjny. Kluczowe atuty to logiczny podział na strefę dzienną (Yang) i nocną (Yin). Główne priorytety obejmują ustawienie łóżka i biurka w pozycji dominującej (Command Position), doświetlenie blatów światłem 4000K oraz eliminację luster na osi wejścia.`,
    detected_inputs: [
      `${payload.files?.length || 1} plan nieruchomości`,
      `${levelsCount} kondygnacja`,
      hasConfirmedNorth ? `Orientacja północy: ${northAngle}° N` : "Północ domyślna",
      hasEntry ? "Wejście główne zlokalizowane" : "Wejście domyślne",
      `Przeznaczenie: ${safeText(payload.purpose, "zamieszkanie")}`,
      "Zdefiniowane strefy funkcjonalne lokalu"
    ],
    missing_inputs: [
      ...(hasConfirmedNorth ? [] : ["Zatwierdź dokładną orientację północy kompasem"]),
      ...(hasProfile ? [] : ["Dodaj daty urodzenia domowników dla analizy Kua"])
    ],
    priority_actions: [
      {
        title: "Ustaw wezgłowie łóżka w pozycji dominującej",
        why: "Pełna ściana murowana za głową (Czarny Żółw) eliminuje podświadomy niepokój i gwarantuje głęboki sen w fazie REM.",
        method: "Szkoła Formy",
        impact: "bardzo wysoki",
        effort: "niski",
        confidence: "high"
      },
      {
        title: "Zapewnij Command Position dla biurka do pracy",
        why: "Siedzenie tyłem do drzwi wywołuje permanentny mikrostres i obniża zdolność koncentracji o ponad 30%.",
        method: "Forma & Ergonomia",
        impact: "wysoki",
        effort: "niski",
        confidence: "high"
      },
      {
        title: "Zachowaj min. 40-60 cm blatu między płytą a zlewem",
        why: "Separacja strefy Ognia (płyta) i Wody (zlew) drewnianym blatem neutralizuje konflikt Wu Xing i podnosi ergonomię.",
        method: "Wu Xing & Ergonomia",
        impact: "wysoki",
        effort: "średni",
        confidence: "high"
      },
      {
        title: "Wprowadź 3 warstwy oświetlenia w strefie dziennej",
        why: "Światło ogólne, nastrojowe (2700K) i zadaniowe (4000K) reguluje naturalny rytm dobowy mieszkańców.",
        method: "Architektura & Światło",
        impact: "wysoki",
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
        recommendation: "Uporządkuj obuwie w szafie i zastosuj ciepłe światło powitalne min. 250 lx.",
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
    room_recommendations: detectedRoomList.slice(0, 8).map((room) => {
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
    furniture_recommendations: getFilteredFurnitureRecommendations(planMarkers, payload.furnitureAnnotations?.keyPieces),
    resident_analysis: residentAnalysis,
    natal_chart: calculateBuildingNatalChartNode(
      payload.buildingProfile?.constructionYear,
      payload.buildingProfile?.majorRenovationYear,
      payload.orientationData?.northAngleDeg || 180
    ),
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
Jesteś głównym audytorem architektury wnętrz i ekspertem Feng Shui dla platformy Plan Harmonii.
Twoim celem jest przygotowanie raportu, który jest w 100% PRAKTYCZNY, ZROZUMIAŁY DLA KAŻDEGO LAIKA i BEZPOŚREDNIO PRZEKŁADA SIĘ NA DZIAŁANIA W MIESZKANIU.

FUNDAMENTALNE ZASADY JĘZYKA I PRAKTYCZNOŚCI (DLA LAIKA):
1. JĘZYK ZROZUMIAŁY DLA KAŻDEGO:
   - Żadnego hermetycznego żargonu bez prostego wyjaśnienia po polsku!
   - Jeśli używasz tradycyjnego pojęcia, ZAWSZE podaj jego fizyczne znaczenie (np. zamiast samego "Sha Qi" napisz "ostra krawędź ściany lub mebla celująca w głowę", zamiast "brak Czarnego Żółwia" napisz "brak stabilnego oparcia o pełną ścianę za wezgłowiem", zamiast "Chong Qi" napisz "przeciąg energii w linii drzwi-okno wywołujący płytki sen").
2. ODPOWIEDŹ WPROST: "CZY TO JEST DOBRZE CZY ŹLE?":
   - Czytelnik w pierwszych 30 sekundach musi wiedzieć, czy układ jego lokalu jest dobry, jakie są 2-3 kluczowe błędy i jak je naprawić.
3. PERSONALIZACJA DLA ROKU URODZENIA DOMOWNIKA (PROFIL KUA):
   - Dla każdego domownika wyjaśnij prostym językiem:
     * Gdzie i jak ma stać jego ŁÓŻKO dla głębokiej regeneracji i zdrowego snu.
     * Gdzie i jak ma stać jego BIURKO dla maksymalnego skupienia i braku zmęczenia.
     * Czego unikać w bieżącym roku (2026) – w jakich sektorach zachować ciszę i porządek.
4. DZIAŁANIA KROK PO KROKU BEZ REMONTU (KOSZT 0 ZŁ):
   - Priorytetem są bezpłatne przestawienia mebli (15 minut pracy).
   - Następnie proste korekty: zmiana żarówek (ciepłe 2700K do sypialni, neutralne 4000K do pracy), tekstylia, rośliny, eliminacja luster naprzeciw drzwi/łóżka.
5. ZAKAZ BANAŁÓW, ZAKAZ DUPLIKATÓW I ZAKAZ FABRYKACJI MEBLI:
   - Analizuj WYŁĄCZNIE meble i elementy, które użytkownik realnie umieścił na rzucie (w plan_annotations.markers lub furniture_annotations.keyPieces).
   - Nigdy nie zmyślaj mebli ani pomieszczeń, których nie ma na schemacie.
   - Pomiary podawaj w centymetrach (np. min. 65 cm dojścia do łóżka, 90-110 cm szerokości korytarza).

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
  "resident_analysis": [{ "name": string, "role": string, "birth_year": string, "gender": string, "kua_number": number, "element": string, "group": string, "favorable_directions": string[], "unfavorable_directions": string[], "placement_advice": string, "yearly_warning": string }],
  "natal_chart": { "period": number, "period_label": string, "period_element": string, "facing_direction": string, "sitting_direction": string, "facing_angle_deg": number, "chart_type": string, "summary": string, "palaces": [{ "direction": string, "code": string, "mountain_star": number, "base_star": number, "water_star": number, "nature": string, "health_relationships": string, "wealth_career": string, "remedy_wu_xing": string, "period9_outlook": string }], "period9_strategy": string },
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

function deduplicateFurnitureItems(items, fallback) {
  const source = normalizeArray(items, fallback);
  const seen = new Set();
  const result = [];

  for (const item of source) {
    const raw = String(item?.item || "").toLowerCase();
    let canonKey = raw;
    if (raw.includes("łóż")) canonKey = "bed";
    else if (raw.includes("biur") || raw.includes("prac")) canonKey = "desk";
    else if (raw.includes("sof") || raw.includes("kanap")) canonKey = "sofa";
    else if (raw.includes("płyt") || raw.includes("kuch") || raw.includes("kuchen")) canonKey = "stove";
    else if (raw.includes("stół") || raw.includes("stol")) canonKey = "table";
    else if (raw.includes("szaf") || raw.includes("gard")) canonKey = "wardrobe";

    if (!seen.has(canonKey)) {
      seen.add(canonKey);
      result.push(item);
    }
  }

  return result.length > 0 ? result : fallback;
}

function normalizeReport(report, payload, mode, model) {
  const fallback = buildFallbackReport(payload, mode, model);
  const dedupedFurniture = deduplicateFurnitureItems(report?.furniture_recommendations, fallback.furniture_recommendations);

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
    room_recommendations: normalizeArray(report?.room_recommendations, fallback.room_recommendations).slice(0, 10).map((item, index) => ({
      room: safeText(item?.room, fallback.room_recommendations[index % fallback.room_recommendations.length].room),
      function: safeText(item?.function, fallback.room_recommendations[index % fallback.room_recommendations.length].function),
      diagnosis: safeText(item?.diagnosis, fallback.room_recommendations[index % fallback.room_recommendations.length].diagnosis),
      strengths: normalizeStringArray(item?.strengths, fallback.room_recommendations[index % fallback.room_recommendations.length].strengths, 6),
      risks: normalizeStringArray(item?.risks, fallback.room_recommendations[index % fallback.room_recommendations.length].risks, 6),
      recommendations: normalizeStringArray(item?.recommendations, fallback.room_recommendations[index % fallback.room_recommendations.length].recommendations, 6),
      method: safeText(item?.method, "Forma + Ergonomia + 5 Żywiołów")
    })),
    furniture_recommendations: dedupedFurniture.slice(0, 8).map((item, index) => ({
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
