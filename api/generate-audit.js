export const config = {
  maxDuration: 60
};

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const FALLBACK_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview"
];
const MAX_TOTAL_INLINE_BYTES = 12 * 1024 * 1024;
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
  { method: "Forma", score: 78, signal: "czytelny przepływ i relacja wejścia z częścią dzienną" },
  { method: "Kompas", score: 70, signal: "orientacja wymaga potwierdzenia przed mocnymi wnioskami" },
  { method: "Bagua", score: 74, signal: "strefy funkcji są możliwe do mapowania po potwierdzeniu północy" },
  { method: "Pięć elementów", score: 76, signal: "materiały i barwy należy dobrać po ocenie światła" },
  { method: "Kua / Gua", score: 66, signal: "profil osobisty wymaga danych użytkownika" },
  { method: "Ergonomia i światło", score: 82, signal: "najmocniejsza warstwa decyzji bez remontu" }
];

const compassSectors = [
  { sector: "Kariera i przepływ", direction: "Północ", element: "Woda", angle: 0 },
  { sector: "Wiedza i rozwój", direction: "Północny wschód", element: "Ziemia", angle: 45 },
  { sector: "Rodzina i zdrowie", direction: "Wschód", element: "Drewno", angle: 90 },
  { sector: "Dobrobyt i zasoby", direction: "Południowy wschód", element: "Drewno", angle: 135 },
  { sector: "Widoczność i reputacja", direction: "Południe", element: "Ogień", angle: 180 },
  { sector: "Relacje i stabilność", direction: "Południowy zachód", element: "Ziemia", angle: 225 },
  { sector: "Twórczość i dzieci", direction: "Zachód", element: "Metal", angle: 270 },
  { sector: "Pomocni ludzie i podróże", direction: "Północny zachód", element: "Metal", angle: 315 },
  { sector: "Centrum", direction: "Środek planu", element: "Ziemia", angle: null }
];

function directionLabelFromBearing(angle) {
  const normalized = normalizeAngleDeg(angle);
  if (normalized >= 338 || normalized <= 22) return "Północ";
  if (normalized <= 67) return "Północny wschód";
  if (normalized <= 112) return "Wschód";
  if (normalized <= 157) return "Południowy wschód";
  if (normalized <= 202) return "Południe";
  if (normalized <= 247) return "Południowy zachód";
  if (normalized <= 292) return "Zachód";
  return "Północny zachód";
}

function markerBearing(marker, northAngleDeg = 0) {
  const x = Number(marker?.xPercent) - 50;
  const y = Number(marker?.yPercent) - 50;
  if (!Number.isFinite(x) || !Number.isFinite(y) || (Math.abs(x) < 3 && Math.abs(y) < 3)) {
    return null;
  }

  const angleFromTop = Math.atan2(x, -y) * (180 / Math.PI);
  return normalizeAngleDeg(angleFromTop - northAngleDeg);
}

function markerSectorLabel(marker, northAngleDeg = 0) {
  const bearing = markerBearing(marker, northAngleDeg);
  return bearing === null ? "Centrum" : directionLabelFromBearing(bearing);
}

function markersForLabel(markers, label) {
  return markers.filter((marker) => safeText(marker?.label).toLowerCase() === label.toLowerCase());
}

function roomMarkers(markers) {
  return markers.filter((marker) => marker?.category === "room");
}

function furnitureMarkers(markers) {
  return markers.filter((marker) => marker?.category === "furniture");
}

function markerDirectionText(marker) {
  if (Number.isFinite(Number(marker?.facingDeg))) {
    return `${normalizeAngleDeg(marker.facingDeg)}° względem góry pliku`;
  }

  return "kierunek niepodany";
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") return JSON.parse(req.body);
  return req.body;
}

function safeText(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function inferMimeType(fileName, fallback = "") {
  const extension = safeText(fileName).split(".").pop()?.toLowerCase();

  if (extension === "pdf") return "application/pdf";
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "webp") return "image/webp";
  if (extension === "heic") return "image/heic";
  if (extension === "heif") return "image/heif";

  return fallback;
}

function clampScore(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function normalizeAngleDeg(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return ((Math.round(number) % 360) + 360) % 360;
}

function normalizeConfidence(value) {
  return value === "high" || value === "medium" || value === "low" ? value : "medium";
}

function hasAnyText(values) {
  return values.some((value) => safeText(value).length > 0);
}

function buildFallbackReport(payload, mode = "demo", model = MODEL) {
  const levelsCount = clampScore(payload.levelsCount, 1);
  const propertyLabel = {
    flat: "mieszkania",
    multi: "mieszkania wielopoziomowego",
    house: "domu",
    business: "lokalu lub biura"
  }[payload.propertyType] || "nieruchomości";

  const orientationData = payload.orientationData || {};
  const planAnnotations = payload.planAnnotations || {};
  const furnitureAnnotations = payload.furnitureAnnotations || {};
  const buildingProfile = payload.buildingProfile || {};
  const residentProfiles = normalizeArray(payload.residentProfiles, []);
  const roomFunctions = normalizeArray(planAnnotations.roomFunctions, []);
  const fixedElements = normalizeArray(planAnnotations.fixedElements, []);
  const planMarkers = normalizeArray(planAnnotations.markers, []);
  const furnitureItems = normalizeArray(furnitureAnnotations.keyPieces, []);
  const roomsOnPlan = roomMarkers(planMarkers);
  const furnitureOnPlan = furnitureMarkers(planMarkers);
  const hasConfirmedNorth = orientationData.confirmed === true;
  const hasEntry =
    Boolean(safeText(payload.entryNote)) ||
    fixedElements.includes("Wejście główne") ||
    planMarkers.some((marker) => marker?.label === "Wejście główne");
  const hasProfile =
    Boolean(safeText(payload.profileNote)) ||
    residentProfiles.some((profile) =>
      hasAnyText([profile?.label, profile?.role, profile?.birthDate, profile?.birthTime, profile?.birthPlace, profile?.note])
    );
  const hasBuildingTime = hasAnyText([
    buildingProfile.constructionYear,
    buildingProfile.firstOccupiedYear,
    buildingProfile.moveInDate,
    buildingProfile.majorRenovationYear,
    buildingProfile.renovationNote
  ]);
  const baseScore = payload.propertyType === "business" ? 79 : payload.propertyType === "house" ? 74 : 77;
  const score = baseScore + (hasConfirmedNorth ? 4 : -5) + (hasEntry ? 3 : -3) + (hasProfile ? 2 : -2);
  const markerNorthAngle = normalizeAngleDeg(orientationData.northAngleDeg);
  const roomLabels = Array.from(new Set([
    ...roomFunctions,
    ...roomsOnPlan.map((marker) => marker.label)
  ])).filter(Boolean);
  const furnitureLabels = Array.from(new Set([
    ...furnitureItems,
    ...furnitureOnPlan.map((marker) => marker.label)
  ])).filter(Boolean);
  const detectedRoomList = roomLabels.length > 0 ? roomLabels : ["Wejście", "Salon", "Sypialnia", "Kuchnia", "Łazienka/WC"];
  const markedSectors = compassSectors.map((sector) => {
    const sectorMarkers = planMarkers.filter((marker) => markerSectorLabel(marker, markerNorthAngle) === sector.direction);
    const use = sectorMarkers.map((marker) => marker.label).slice(0, 4).join(", ");

    return {
      sector: sector.sector,
      direction: sector.direction,
      element: sector.element,
      current_use: use || "do potwierdzenia na planie",
      assessment: use
        ? `W tym sektorze oznaczono: ${use}. Priorytetem jest sprawdzenie, czy funkcja sektora wspiera realny sposób korzystania z tej części nieruchomości.`
        : "Brak jednoznacznych markerów w tym sektorze. W pełnym audycie warto doprecyzować funkcję tej części planu.",
      advice: sector.direction === "Środek planu"
        ? "Centrum powinno pozostać możliwie czytelne, lekkie i nieprzeciążone ciężkimi meblami ani chaosem komunikacyjnym."
        : `Zadbaj o porządek, dobrą proporcję i element ${sector.element.toLowerCase()} użyty subtelnie, bez dekoracyjnego przesycenia.`,
      priority: use ? "średni" : "niski"
    };
  });

  return {
    score: clampScore(score, 76),
    confidence: hasConfirmedNorth && hasEntry ? "medium" : "low",
    executive_summary: `Wstępny audyt ${propertyLabel} wskazuje dobry potencjał, ale decyzje kierunkowe wymagają potwierdzenia wejścia, północy i oznaczeń funkcji. Największy wpływ na wynik mają przepływ od drzwi, światło w strefach pracy i odpoczynku, ustawienie mebli oraz rozdzielenie funkcji między kondygnacjami.`,
    detected_inputs: [
      `${payload.files?.length || 0} plików planu`,
      `${levelsCount} kondygnacji`,
      hasConfirmedNorth
        ? `północ zatwierdzona: ${normalizeAngleDeg(orientationData.northAngleDeg)}° względem góry pliku`
        : "północ niezatwierdzona",
      planMarkers.length > 0 ? `${planMarkers.length} markerów na skanie` : "brak markerów na skanie",
      roomFunctions.length > 0 ? `funkcje: ${roomFunctions.slice(0, 5).join(", ")}` : "funkcje pomieszczeń do uzupełnienia",
      furnitureItems.length > 0 ? `meble: ${furnitureItems.slice(0, 5).join(", ")}` : "ustawienie mebli do uzupełnienia",
      planMarkers.some((marker) => marker?.category === "furniture" && marker?.orientationRole)
        ? "podano kierunki kluczowych mebli"
        : "brak dokładnych kierunków mebli",
      hasBuildingTime ? "podano czas budynku lub remontu" : "brak czasu budynku",
      `cel: ${safeText(payload.purpose, "decyzja mieszkaniowa")}`,
      safeText(payload.constraintsNote) ? "podano ograniczenia zmian" : "brak ograniczeń zmian"
    ],
    missing_inputs: [
      ...(hasConfirmedNorth ? [] : ["obróć i zatwierdź wskazówkę północy na skanie"]),
      ...(hasEntry ? [] : ["oznacz wejście główne na planie"]),
      ...(roomFunctions.length > 0 || planMarkers.some((marker) => marker?.category === "room")
        ? []
        : ["oznacz funkcje pomieszczeń na skanie"]),
      ...(furnitureItems.length > 0 || planMarkers.some((marker) => marker?.category === "furniture")
        ? []
        : ["oznacz kluczowe meble i ich kierunek"]),
      ...(planMarkers.some((marker) => marker?.category === "furniture" && marker?.orientationRole && Number.isFinite(Number(marker?.facingDeg)))
        ? []
        : ["dla łóżka, biurka, sofy i kuchenki doprecyzuj, co oznacza strzałka kierunku"]),
      ...(hasBuildingTime ? [] : ["podaj rok budowy, pierwsze zamieszkanie lub większy remont"]),
      ...(hasProfile ? [] : ["dodaj profil użytkownika, jeśli raport ma użyć Kua/Gua lub kontekstu osobistego"])
    ],
    priority_actions: [
      {
        title: "Potwierdź wejście i oś drzwi-okna",
        why: "To pierwszy filtr dla przepływu, prywatności i ustawienia miejsc pracy lub snu.",
        method: "Forma",
        impact: "wysoki wpływ",
        effort: "niski wysiłek",
        confidence: hasEntry ? "medium" : "low"
      },
      {
        title: "Rozdziel analizę kondygnacji",
        why: "W układach 2+ poziomy schody zmieniają przepływ i relację stref dziennych, nocnych oraz pracy.",
        method: "Bagua + Forma",
        impact: levelsCount > 1 ? "wysoki wpływ" : "średni wpływ",
        effort: "średni wysiłek",
        confidence: levelsCount > 1 ? "medium" : "low"
      },
      {
        title: "Dokończ warstwę markerów na planie",
        why: "Techniczny rzut rzadko mówi, gdzie realnie będzie salon, łóżko, biurko i wejście użytkowe.",
        method: "Forma + funkcja",
        impact: "wysoki wpływ",
        effort: "niski wysiłek",
        confidence: planMarkers.length > 0 ? "medium" : "low"
      },
      {
        title: "Ustaw miejsca stałego przebywania z oparciem i widokiem",
        why: "Łóżko, biurko i główne siedzisko powinny ograniczać zaskoczenie od wejścia i wzmacniać poczucie kontroli.",
        method: "Forma + ergonomia",
        impact: "wysoki wpływ",
        effort: "niski wysiłek",
        confidence: "medium"
      },
      {
        title: "Oddziel rekomendacje praktyczne od tradycyjnych",
        why: "Raport ma prowadzić do decyzji, więc oznacza, które wnioski wynikają z funkcji, a które z metod klasycznych.",
        method: "Rejestr źródeł",
        impact: "średni wpływ",
        effort: "niski wysiłek",
        confidence: "high"
      }
    ],
    method_scores: methodDefaults,
    levels: Array.from({ length: Math.max(1, Math.min(12, Number(payload.levelsCount) || 1)) }, (_, index) => ({
      label: index === 0 ? "Poziom 1" : `Poziom ${index + 1}`,
      score: clampScore(score - index * 3, 72),
      focus: index === 0 ? "wejście, strefa dzienna i przepływ" : "prywatność, schody i funkcje nocne",
      risks: index === 0 ? ["zbyt szybka oś wejście-okno", "niedopowiedziana orientacja"] : ["schody jako dominanta", "mieszanie pracy i odpoczynku"],
      actions: index === 0 ? ["oznacz wejście na planie", "sprawdź światło dzienne"] : ["zmapuj relację schodów", "oddziel strefę snu"]
    })),
    zones: [
      {
        zone: "Wejście",
        state: "kluczowa strefa decyzyjna",
        recommendation: "Zadbaj o czytelną ścieżkę i brak blokady tuż po wejściu.",
        method: "Forma"
      },
      {
        zone: "Praca / biurko",
        state: "wymaga kontroli ustawienia",
        recommendation: "Unikaj siedzenia tyłem do drzwi, jeśli układ pozwala na zmianę.",
        method: "Forma + ergonomia"
      },
      {
        zone: "Sypialnia / regeneracja",
        state: "wrażliwa na oś drzwi i okien",
        recommendation: "Priorytetem jest osłona, spokojny przepływ i ograniczenie bodźców.",
        method: "Forma + yin-yang"
      }
    ],
    directional_insights: [
      {
        title: "Oś północy i mapa kompasowa",
        direction: hasConfirmedNorth ? `${markerNorthAngle}° względem góry pliku` : "niezatwierdzona",
        meaning: hasConfirmedNorth
          ? "Kierunek północy można wykorzystać do sektorów kompasowych i ostrożnej warstwy Bagua."
          : "Bez zatwierdzonej północy warstwa kompasowa nie powinna prowadzić do mocnych wniosków.",
        recommendation: hasConfirmedNorth
          ? "Analizuj sektory razem z realną funkcją pomieszczeń, a nie mechanicznie po kolorach lub symbolach."
          : "Zatwierdź północ na planie, aby raport mógł rozdzielić sektory mieszkania.",
        confidence: hasConfirmedNorth ? "medium" : "low"
      },
      {
        title: "Oś wejścia i przepływu",
        direction: hasEntry ? "wejście oznaczone lub opisane" : "wejście do uzupełnienia",
        meaning: "Wejście jest punktem startu analizy Formy: decyduje o pierwszym przepływie, prywatności i komforcie.",
        recommendation: "Utrzymaj czytelne wejście, unikaj blokady tuż po drzwiach i sprawdź, czy pierwsza linia wzroku nie wpada zbyt szybko w okno, schody albo kuchnię.",
        confidence: hasEntry ? "medium" : "low"
      }
    ],
    sector_map: markedSectors,
    room_recommendations: detectedRoomList.slice(0, 12).map((room) => {
      const marker = markersForLabel(roomsOnPlan, room)[0];
      const sector = marker ? markerSectorLabel(marker, markerNorthAngle) : "do potwierdzenia";

      return {
        room,
        function: room,
        diagnosis: `${room} wymaga oceny przez funkcję, światło, relację z wejściem oraz sektor: ${sector}.`,
        strengths: [
          marker ? "funkcja została oznaczona na planie" : "funkcję można doprecyzować opisem lub markerem",
          "można oddzielić zalecenia praktyczne od tradycyjnych"
        ],
        risks: [
          room.toLowerCase().includes("kuch") ? "kuchnia wymaga realistycznej oceny frontu płyty, ciągu pracy i dojścia, bez wymuszania niemożliwego ustawienia ciała" : "niepełny opis mebli może obniżyć pewność rekomendacji",
          room.toLowerCase().includes("syp") ? "łóżko wymaga osobnej oceny strony głowy, drzwi, okna i oparcia" : "funkcja pomieszczenia może kolidować z przepływem, jeśli wejście lub okna są niepotwierdzone"
        ],
        recommendations: [
          "sprawdź relację drzwi, okien, światła i głównego miejsca przebywania",
          "nie wprowadzaj symbolicznych korekt przed rozwiązaniem funkcji, wygody i porządku",
          "dla decyzji remontowej oznacz meble, których kierunek realnie wpływa na korzystanie z pokoju"
        ],
        method: "Forma + Kompas + ergonomia"
      };
    }),
    furniture_recommendations: (furnitureLabels.length > 0 ? furnitureLabels : ["Łóżko", "Biurko", "Sofa", "Płyta/kuchenka"]).slice(0, 12).map((item) => {
      const marker = markersForLabel(furnitureOnPlan, item)[0];
      const orientationRole = safeText(marker?.orientationRole, item === "Płyta/kuchenka" ? "kierunek podejścia osoby do płyty/kuchenki" : "kierunek używania");

      return {
        item,
        orientation_role: orientationRole,
        direction: marker ? markerDirectionText(marker) : "do uzupełnienia",
        assessment: marker
          ? `${item} ma oznaczony kierunek: ${orientationRole}. Ten kierunek trzeba interpretować praktycznie, zgodnie z realnym frontem i sposobem używania.`
          : `${item} nie ma jeszcze precyzyjnego markera kierunku.`,
        practical_limit: item === "Płyta/kuchenka" || item === "Kuchenka"
          ? "Przy płycie nie zakładamy, że osoba ma stać przodem do jadalni. Liczy się realny front urządzenia, dojście, bezpieczeństwo i to, czy kucharz nie jest zaskakiwany od tyłu."
          : "Kierunek mebla należy oceniać w granicach realnego układu, konstrukcji i ergonomii.",
        recommendations: [
          item === "Łóżko" ? "upewnij się, że strona głowy ma oparcie i nie wpada bezpośrednio w linię drzwi" : "sprawdź oparcie, dojście i linię wzroku osoby korzystającej",
          item === "Sofa" ? "dodaj strzałkę patrzenia osoby siedzącej i unikaj ustawienia plecami do głównego wejścia do strefy" : "zapisz, co dokładnie oznacza strzałka przy tym meblu",
          item === "Płyta/kuchenka" || item === "Kuchenka" ? "oceniaj front płyty i podejście, nie wymuszaj nierealnego obrotu stanowiska gotowania" : "najpierw popraw funkcję, potem dobieraj korekty materiałowe i symboliczne"
        ]
      };
    }),
    traditional_analysis: [
      {
        title: "Bagua i sektory",
        body: "Warstwa sektorów jest użyteczna dopiero po połączeniu kompasu z rzeczywistą funkcją pomieszczeń. Sama etykieta sektora nie wystarcza do zalecenia remontu.",
        bullets: ["analizuj sektor, funkcję i użytkownika razem", "traktuj centrum jako punkt równowagi planu", "nie wzmacniaj sektora przed usunięciem oczywistych konfliktów funkcjonalnych"]
      },
      {
        title: "Pięć elementów",
        body: "Elementy służą do równoważenia bodźców, materiałów, światła i nastroju. Nie powinny przykrywać błędów układu.",
        bullets: ["Drewno: wzrost i elastyczność", "Ogień: widoczność, ale ostrożnie w kuchni", "Ziemia: stabilność, szczególnie w centrum i sypialni", "Metal i Woda: porządek, koncentracja i przepływ"]
      }
    ],
    practical_analysis: [
      {
        title: "Najpierw ergonomia, potem symbolika",
        body: "Jeśli rekomendacja wymaga nierealnego ustawienia ciała, mebla albo instalacji, raport powinien zaproponować korektę zastępczą.",
        bullets: ["nie obracaj płyty bez sensu funkcjonalnego", "nie ustawiaj łóżka tylko pod sektor, jeśli pogarsza sen i dojście", "nie blokuj wejścia dekoracją"]
      },
      {
        title: "Każda przestrzeń ma własną decyzję",
        body: "Pełny raport powinien osobno traktować wejście, kuchnię, sypialnię, salon, pracę, łazienkę, komunikację i kondygnacje.",
        bullets: ["dla każdego pokoju: funkcja, ryzyko, rekomendacja", "dla mebli: kierunek osoby i ograniczenia", "dla sektorów: użycie obecne i korekta"]
      }
    ],
    practical_changes: [
      { title: "przesunięcie biurka lub łóżka", cost: "0-300 zł", when: "od razu" },
      { title: "doświetlenie strefy pracy", cost: "100-600 zł", when: "przed urządzeniem" },
      { title: "uporządkowanie osi wejścia", cost: "0-500 zł", when: "przed przeprowadzką" },
      { title: "podział funkcji między kondygnacjami", cost: "bez kosztu projektowego", when: "przed remontem" }
    ],
    purchase_decision: "Układ ma sens do dalszej analizy, ale przed zakupem lub remontem warto potwierdzić orientację, wejście i funkcje pokoi. Największą wartość da pełny raport z mapą kondygnacji.",
    source_ledger: [
      { source: "Szkoła Formy", used_for: "przepływ, wejście, osłona i miejsca stałego przebywania", confidence: "medium" },
      { source: "Bagua i 9 stref", used_for: "mapowanie funkcji na plan i kondygnacje", confidence: hasConfirmedNorth ? "medium" : "low" },
      { source: "Kompas i kierunki", used_for: "orientacja północy zatwierdzona przez użytkownika na skanie", confidence: hasConfirmedNorth ? "medium" : "low" },
      { source: "Kua / Gua", used_for: "dopasowanie do profilu mieszkańców, jeśli dane są podane", confidence: hasProfile ? "medium" : "low" },
      { source: "Pięć elementów", used_for: "materiały, barwy i równowaga bodźców", confidence: "medium" },
      { source: "Ergonomia, światło i funkcja", used_for: "praktyczne decyzje bez deklarowania skutków życiowych", confidence: "high" }
    ],
    disclaimer: "Raport jest narzędziem informacyjno-decyzyjnym. Nie gwarantuje skutków zdrowotnych, finansowych, relacyjnych ani prawnych i nie zastępuje konsultacji architekta, projektanta, konstruktora ani certyfikowanego konsultanta.",
    ai_provider: mode === "live" ? "Google Gemini" : "Plan Harmonii",
    ai_model: model,
    ai_mode: mode
  };
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
      impact: safeText(item?.impact, "średni wpływ"),
      effort: safeText(item?.effort, "średni wysiłek"),
      confidence: normalizeConfidence(item?.confidence)
    })),
    method_scores: normalizeArray(report?.method_scores, fallback.method_scores).slice(0, 8).map((item, index) => ({
      method: safeText(item?.method, methodDefaults[index % methodDefaults.length].method),
      score: clampScore(item?.score, methodDefaults[index % methodDefaults.length].score),
      signal: safeText(item?.signal, methodDefaults[index % methodDefaults.length].signal)
    })),
    levels: normalizeArray(report?.levels, fallback.levels).slice(0, 12).map((item, index) => ({
      label: safeText(item?.label, `Poziom ${index + 1}`),
      score: clampScore(item?.score, fallback.score),
      focus: safeText(item?.focus, "przepływ, funkcja i światło"),
      risks: normalizeArray(item?.risks, []).map(String).slice(0, 5),
      actions: normalizeArray(item?.actions, []).map(String).slice(0, 5)
    })),
    zones: normalizeArray(report?.zones, fallback.zones).slice(0, 8).map((item, index) => ({
      zone: safeText(item?.zone, fallback.zones[index % fallback.zones.length].zone),
      state: safeText(item?.state, fallback.zones[index % fallback.zones.length].state),
      recommendation: safeText(item?.recommendation, fallback.zones[index % fallback.zones.length].recommendation),
      method: safeText(item?.method, fallback.zones[index % fallback.zones.length].method)
    })),
    directional_insights: normalizeArray(report?.directional_insights, fallback.directional_insights).slice(0, 8).map((item, index) => ({
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
      priority: safeText(item?.priority, fallback.sector_map[index % fallback.sector_map.length].priority)
    })),
    room_recommendations: normalizeArray(report?.room_recommendations, fallback.room_recommendations).slice(0, 14).map((item, index) => ({
      room: safeText(item?.room, fallback.room_recommendations[index % fallback.room_recommendations.length].room),
      function: safeText(item?.function, fallback.room_recommendations[index % fallback.room_recommendations.length].function),
      diagnosis: safeText(item?.diagnosis, fallback.room_recommendations[index % fallback.room_recommendations.length].diagnosis),
      strengths: normalizeStringArray(item?.strengths, fallback.room_recommendations[index % fallback.room_recommendations.length].strengths, 5),
      risks: normalizeStringArray(item?.risks, fallback.room_recommendations[index % fallback.room_recommendations.length].risks, 5),
      recommendations: normalizeStringArray(item?.recommendations, fallback.room_recommendations[index % fallback.room_recommendations.length].recommendations, 7),
      method: safeText(item?.method, fallback.room_recommendations[index % fallback.room_recommendations.length].method)
    })),
    furniture_recommendations: normalizeArray(report?.furniture_recommendations, fallback.furniture_recommendations).slice(0, 14).map((item, index) => ({
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
      bullets: normalizeStringArray(item?.bullets, fallback.traditional_analysis[index % fallback.traditional_analysis.length].bullets, 8)
    })),
    practical_analysis: normalizeArray(report?.practical_analysis, fallback.practical_analysis).slice(0, 8).map((item, index) => ({
      title: safeText(item?.title, fallback.practical_analysis[index % fallback.practical_analysis.length].title),
      body: safeText(item?.body, fallback.practical_analysis[index % fallback.practical_analysis.length].body),
      bullets: normalizeStringArray(item?.bullets, fallback.practical_analysis[index % fallback.practical_analysis.length].bullets, 8)
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

function buildPrompt(payload) {
  return `
Przygotuj profesjonalny raport Plan Harmonii po polsku na podstawie danych użytkownika i załączonych planów.

Zasady:
- Nie używaj frazy "inspirowane feng shui".
- Traktuj feng shui jako tradycyjną ramę interpretacji przestrzeni, nie jako naukę gwarantującą skutki życiowe.
- Oddzielaj wnioski tradycyjne od praktycznych: ergonomia, światło, prywatność, akustyka, przepływ i funkcja.
- Nie zgaduj północy, wejścia, dat urodzenia ani funkcji pokojów, jeśli nie wynikają z danych.
- Jeśli orientation_data.confirmed=true, northAngleDeg oznacza północ względem górnej krawędzi wgranego pliku. Jeśli false, warstwy kompasowe traktuj jako niepewne.
- Markery planu są danymi od użytkownika. Przy markerach mebli rozróżniaj orientationRole: dla łóżka liczy się zwłaszcza strona głowy, dla biurka kierunek patrzenia osoby siedzącej, dla sofy kierunek patrzenia osoby siedzącej na sofie, dla płyty/kuchenki kierunek podejścia osoby do płyty albo front osoby gotującej. Nie zamieniaj tych znaczeń.
- Nie proponuj ustawień fizycznie niewykonalnych. Przy płycie/kuchence nie zakładaj, że osoba ma stać przodem do jadalni, jeśli realny front urządzenia, blat albo instalacje temu przeczą. Wtedy nazwij ograniczenie i zaproponuj korektę zastępczą: kontrolę widoku, światło, porządek, osłonę, organizację ciągu roboczego.
- Jeśli dokładny kierunek mebla nie został podany, poproś o uzupełnienie zamiast zgadywać ustawienie.
- Jeśli szkoły/metody mogą dawać różne priorytety, nazwij to w źródłach i podaj poziom pewności.
- Dla domu lub mieszkania wielopoziomowego analizuj kondygnacje osobno i razem, ze szczególną uwagą na schody.
- Daty budowy, pierwszego zamieszkania, wprowadzki i większego remontu traktuj jako kontekst dla metod czasowych; jeśli ich brakuje, wskaż ograniczenie pewności.
- Raport ma prowadzić do decyzji zakupu, najmu, remontu albo ustawienia funkcji.
- Raport ma być kompletny: nie skupiaj się tylko na kuchni lub schodach, jeśli użytkownik oznaczył więcej przestrzeni. Dla każdego oznaczonego pomieszczenia i każdego kluczowego mebla przygotuj osobny wniosek.
- Uwzględnij kierunki i sektory: północ, północny wschód, wschód, południowy wschód, południe, południowy zachód, zachód, północny zachód i centrum. Gdy sektor nie jest pewny, opisz ograniczenie pewności zamiast zgadywać.
- Zwracaj dużo konkretnych, wykonalnych porad: układ, przepływ, widok, oparcie, światło, prywatność, porządek, materiały, barwy, elementy, korekty bez remontu i korekty remontowe.

Dane:
${JSON.stringify({
  plan: payload.planId,
  property_type: payload.propertyType,
  levels_count: payload.levelsCount,
  usable_area_m2: payload.usableAreaM2,
  purpose: payload.purpose,
  orientation_note: payload.orientationNote,
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

Zwróć wyłącznie JSON o polach:
score number 0-100,
confidence "low" | "medium" | "high",
executive_summary string,
detected_inputs string[],
missing_inputs string[],
priority_actions array obiektów {title, why, method, impact, effort, confidence},
method_scores array obiektów {method, score, signal},
levels array obiektów {label, score, focus, risks string[], actions string[]},
zones array obiektów {zone, state, recommendation, method},
directional_insights array obiektów {title, direction, meaning, recommendation, confidence},
sector_map array 9 obiektów {sector, direction, element, current_use, assessment, advice, priority},
room_recommendations array obiektów {room, function, diagnosis, strengths string[], risks string[], recommendations string[], method},
furniture_recommendations array obiektów {item, orientation_role, direction, assessment, practical_limit, recommendations string[]},
traditional_analysis array obiektów {title, body, bullets string[]},
practical_analysis array obiektów {title, body, bullets string[]},
practical_changes array obiektów {title, cost, when},
purchase_decision string,
source_ledger array obiektów {source, used_for, confidence},
disclaimer string.
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

function getPublicAiError(error) {
  const message = error instanceof Error ? error.message : "";

  if (/billing|credit|prepay|quota|rate limit/i.test(message)) {
    return "Generator AI jest chwilowo niedostępny. Spróbuj ponownie za kilka minut albo skontaktuj się z nami, żeby przygotować raport ręcznie.";
  }

  return "AI nie wygenerowało raportu. Spróbuj ponownie albo prześlij plan w innym formacie.";
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
      provider: "Google Gemini",
      model,
      mode: "live"
    });
  } catch (error) {
    console.error("Gemini report generation failed", {
      model: MODEL,
      failures: error?.failures,
      message: error instanceof Error ? error.message : String(error)
    });

    const report = buildFallbackReport(payload, "demo", `${MODEL} / raport regułowy`);
    report.executive_summary =
      `Generator AI był chwilowo niedostępny, dlatego pokazujemy raport regułowy oparty na danych z formularza, orientacji i markerach planu. ${report.executive_summary}`;

    return res.status(200).json({
      report,
      provider: report.ai_provider,
      model: report.ai_model,
      mode: "demo",
      warning: getPublicAiError(error)
    });
  }
}
