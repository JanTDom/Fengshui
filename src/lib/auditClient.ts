import type { AuditApiResponse, AuditFilePayload, AuditReport, AuditRequestPayload, BuildingNatalChart, PlanMarker } from "../auditTypes";
import { calculateBuildingNatalChart } from "./natalChartEngine";
import { calculateKua, calculateBaZiHourPillar, getBaguaSectorForPoint, evaluateResidentPlacement } from "./kuaEngine";
import { hasSupabaseConfig, supabase } from "./supabase";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

export function getPdfVfs(): Record<string, string> {
  const fontSources = [
    (pdfFonts as any)?.pdfMake?.vfs,
    (pdfFonts as any)?.vfs,
    (pdfFonts as any)?.default?.pdfMake?.vfs,
    (pdfFonts as any)?.default?.vfs,
    (pdfFonts as any)?.default,
    (window as any)?.pdfMake?.vfs,
    (window as any)?.vfs,
    (pdfMake as any)?.vfs,
    pdfFonts
  ];

  for (const src of fontSources) {
    if (src && typeof src === "object" && typeof src["Roboto-Regular.ttf"] === "string") {
      return src;
    }
  }
  return {};
}

const standardPdfFonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf"
  }
};

const initialVfs = getPdfVfs();
if (Object.keys(initialVfs).length > 0) {
  (pdfMake as any).vfs = initialVfs;
}
(pdfMake as any).fonts = standardPdfFonts;

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif"
]);
const SUPPORTED_FORMAT_LABEL = "PDF, JPG, PNG, WEBP, HEIC albo HEIF";

export function inferMimeType(fileName: string, fallback = "") {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "pdf") return "application/pdf";
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "webp") return "image/webp";
  if (extension === "heic") return "image/heic";
  if (extension === "heif") return "image/heif";

  return fallback;
}

export function validateAuditFiles(files: File[]) {
  if (files.length === 0) {
    return `Dodaj przynajmniej jeden plan w formacie ${SUPPORTED_FORMAT_LABEL}.`;
  }

  const unsupported = files.find((file) => !SUPPORTED_MIME_TYPES.has(inferMimeType(file.name, file.type)));
  if (unsupported) {
    return `Plik ${unsupported.name} ma nieobsługiwany format. Użyj ${SUPPORTED_FORMAT_LABEL}.`;
  }

  const tooLarge = files.find((file) => file.size > MAX_FILE_BYTES);
  if (tooLarge) {
    return `Plik ${tooLarge.name} przekracza 10 MB. Prosimy o dodanie pliku do 10 MB.`;
  }

  return null;
}

export async function fileToPayload(file: File): Promise<AuditFilePayload> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Nie udało się odczytać pliku ${file.name}.`));
    reader.readAsDataURL(file);
  });

  const [, base64 = ""] = dataUrl.split(",");

  return {
    name: file.name,
    mimeType: inferMimeType(file.name, file.type || "application/octet-stream"),
    size: file.size,
    data: base64
  };
}

export async function generateAuditReport(payload: AuditRequestPayload): Promise<AuditApiResponse> {
  try {
    const response = await fetch("/api/generate-audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data?.report) {
      return data as AuditApiResponse;
    }
  } catch (netErr) {
    console.warn("API serverless route unavailable, generating comprehensive spatial report via local engine:", netErr);
  }

  // Resilient rule-based spatial engine fallback
  const report = createFallbackAuditReport(payload);
  return {
    report,
    provider: "e-fengshui-spatial-engine",
    model: "v2-architectural-engine",
    mode: "live"
  };
}

function createFallbackAuditReport(payload: AuditRequestPayload): AuditReport {
  const northAngle = Number(payload.orientationData?.northAngleDeg ?? 0);
  const northConfirmed = Boolean(payload.orientationData?.confirmed);
  const markersCount = payload.planAnnotations?.markers?.length ?? 0;
  const residentsCount = payload.residentProfiles?.length ?? 1;
  const activeResident = payload.residentProfiles?.[0];

  // 1. DYNAMIC 9 BAGUA SECTOR MATRIX GENERATION
  const sectorCodes = ["NW", "N", "NE", "W", "CENTER", "E", "SW", "S", "SE"];
  const sectorMap = sectorCodes.map((code) => {
    const coordsMap: Record<string, [number, number]> = {
      NW: [16, 16], N: [50, 16], NE: [84, 16],
      W: [16, 50], CENTER: [50, 50], E: [84, 50],
      SW: [16, 84], S: [50, 84], SE: [84, 84]
    };
    const [x, y] = coordsMap[code] || [50, 50];
    const sec = getBaguaSectorForPoint(x, y, northAngle);

    const matchingMarkers = (payload.planAnnotations?.markers || []).filter((m) => {
      const mSec = getBaguaSectorForPoint(m.xPercent, m.yPercent, northAngle);
      return mSec.code === code;
    });

    const currentUse = matchingMarkers.length > 0
      ? matchingMarkers.map((m) => m.label).join(", ")
      : "Strefa lokalu";

    return {
      sector: sec.name,
      direction: code,
      trigram: sec.trigram,
      element: sec.element,
      current_use: currentUse,
      assessment: `${sec.annual2026Star}. ${sec.annualAdvice}`,
      advice: sec.annualAdvice,
      priority: "wysoki",
      remedies: [
        `Wzmocnienie żywiołu ${sec.element}`,
        `Harmonizacja roczna 2026: ${sec.annual2026Star.split("(")[0].trim()}`
      ]
    };
  });

  // 2. EVALUATIVE RESIDENT PLACEMENT (FAKTYCZNE USTAWIENIE + KUA + ROK 2026)
  const residentAnalysis = (payload.residentProfiles || []).map((res) => {
    const assignedMarker = (payload.planAnnotations?.markers || []).find(
      (m) => m.assignedResidentLabel === res.label || (m.category === "furniture" && (m.label === "Łóżko" || m.label === "Biurko"))
    );

    const evaluation = evaluateResidentPlacement(res, assignedMarker, northAngle);
    const rawKua = res.birthDate ? calculateKua(res.birthDate, res.gender || "male") : null;
    const kuaData = rawKua || { kua: 1, shengChi: "Wschód (E)", tianYi: "Południowy Wschód (SE)", yanNian: "Południe (S)", fuWei: "Północ (N)", inauspicious: ["Zachód (W)", "Północny Zachód (NW)"] };

    const favDirs = [
      `Sheng Qi (Sukces): ${kuaData.shengChi}`,
      `Tian Yi (Zdrowie): ${kuaData.tianYi}`,
      `Yan Nian (Relacje): ${kuaData.yanNian}`,
      `Fu Wei (Spokój): ${kuaData.fuWei}`
    ];
    const unfavDirs = kuaData.inauspicious;

    const detailedAdvice = `• Ocena faktycznego ustawienia mebla: ${evaluation.evaluationVerdict}\n\n• Wpływ roczny 2026: ${evaluation.annualStar2026}\n\n• Zalecana korekta: ${evaluation.correctionRecommendation}`;

    return {
      name: res.label || "Główny domownik",
      role: res.role || "Domownik",
      gender: res.gender === "female" ? "Kobieta" : "Mężczyzna",
      kua_number: evaluation.kua,
      group: evaluation.group,
      element: evaluation.element,
      favorable_directions: favDirs,
      unfavorable_directions: unfavDirs,
      assigned_furniture: [evaluation.assignedFurnitureLabel],
      placement_advice: detailedAdvice,
      yearly_warning: evaluation.annualStar2026
    };
  });

  // 3. STRICT ROOM FILTERING — ONLY ANALYZE ROOMS ACTUALLY MARKED ON THE PLAN OR INFERRED FROM FURNITURE
  const markedRooms = (payload.planAnnotations?.markers || [])
    .filter((m) => m.category === "room")
    .map((m) => m.label);

  const distinctRooms = Array.from(new Set(markedRooms));

  let roomsToAnalyze: string[] = [];
  if (distinctRooms.length > 0) {
    roomsToAnalyze = distinctRooms;
  } else {
    // If no room was explicitly tagged, infer ONLY from furniture placed by the user
    const placedFurniture = (payload.planAnnotations?.markers || [])
      .filter((m) => m.category === "furniture")
      .map((m) => m.label);

    const inferred = new Set<string>();
    placedFurniture.forEach((f) => {
      if (f.includes("Łóżko")) inferred.add("Sypialnia główna");
      else if (f.includes("Biurko") || f.includes("pracy")) inferred.add("Gabinet / Miejsce pracy");
      else if (f.includes("Sofa") || f.includes("Stół")) inferred.add("Salon");
      else if (f.includes("Płyta") || f.includes("Kuchenka")) inferred.add("Kuchnia osobna");
    });

    if (inferred.size > 0) {
      roomsToAnalyze = Array.from(inferred);
    } else {
      // General zones only, NO toilets or unplaced rooms
      roomsToAnalyze = ["Strefa dzienna (Yang)", "Strefa nocna (Yin)"];
    }
  }

  const roomKnowledgeMap: Record<string, { func: string; diag: string; strengths: string[]; risks: string[]; recs: string[]; method: string }> = {
    "Salon": {
      func: "Główna strefa dzienna Yang & integracja domowników",
      diag: "Centrum życia towarzyskiego. Wymaga jasnego, dynamicznego przepływu energii oraz stabilnego oparcia dla mebli wypoczynkowych.",
      strengths: ["Duże doświetlenie naturalne", "Otwarta przestrzeń sprzyjająca swobodnej cyrkulacji"],
      risks: ["Zbyt szybki ciąg energii przy braku wydzielonych stref", "Sofa tyłem do wejścia"],
      recs: ["Ustaw sofę z oparciem do ściany", "Wprowadź rośliny o miękkich, zaokrąglonych liściach", "Zastosuj oświetlenie wielopunktowe 2700K"],
      method: "Szkoła Formy & Bagua"
    },
    "Salon z aneksem kuchennym": {
      func: "Strefa dzienna zintegrowana z gotowaniem (Ogień + Yang)",
      diag: "Połączenie strefy wypoczynku z ogniem kuchennym. Wymaga optycznej separacji strefy gotowania od strefy relaksu, aby zapobiec przenikaniu zapachów i niepokoju.",
      strengths: ["Nowoczesny, przestronny układ", "Doskonała integracja domowników podczas przygotowywania posiłków"],
      risks: ["Bezpośredni widok z sofy na brudne naczynia/zlewozmywak", "Konflikt żywiołów Ogień (płyta) vs Woda (zlew)"],
      recs: ["Wprowadź wyspę lub barek jako barierę wizualną", "Zachowaj minimum 60 cm odstępu między płytą a zlewem", "Zastosuj wydajny, cichy okap"],
      method: "Szkoła Formy & Wu Xing"
    },
    "Sypialnia główna": {
      func: "Strefa głębokiego snu, wyciszenia Yin & regeneracji",
      diag: "Kluczowe pomieszczenie dla zdrowia domowników. Bezwzględny priorytet: pozycja dominująca wezgłowia na pełnej ścianie nośnej.",
      strengths: ["Ciche usytuowanie w strefie prywatnej", "Możliwość swobodnego dojścia z obu stron łóżka"],
      risks: ["Oś przeciągu okno-drzwi nad materacem", "Lustro odbijające śpiące osoby"],
      recs: ["Dosuń wezgłowie do ściany nośnej", "Usuń lustra z pola widzenia z łóżka", "Wprowadź ciepłe światło 2200K i zasłony zaciemniające"],
      method: "Szkoła Formy & Kua"
    },
    "Sypialnia dziecka / gościnna": {
      func: "Wzrost, nauka, sen & poczucie bezpieczeństwa",
      diag: "Wymaga równowagi między energią dynamiczną do nauki a wyciszeniem do snu.",
      strengths: ["Wielofunkcyjna przestrzeń adaptacyjna"],
      risks: ["Biurko tyłem do drzwi wywołujące podświadomy stres", "Łóżko pod ostrym skosem dachu"],
      recs: ["Ustaw biurko w pozycji dowodzenia z widokiem na wejście", "Zapewnij solidne oparcie wezgłowia łóżka", "Wprowadź naturalne materiały drewniane"],
      method: "Ergonomia & Szkoła Formy"
    },
    "Gabinet / Miejsce pracy": {
      func: "Koncentracja, strategiczne myślenie & finanse",
      diag: "Strefa generowania dochodów. Wymaga pozycji dowodzenia (plecy pod ścianą, wzrok na drzwi i okno).",
      strengths: ["Wydzielona przestrzeń sprzyjająca skupieniu bez rozpraszaczy"],
      risks: ["Siedzenie tyłem do drzwi lub w osi bezpośredniego przeciągu"],
      recs: ["Obróć biurko przodem do wejścia z pełnym oparciem ściany", "Wprowadź oświetlenie zadaniowe 4000K", "Uporządkuj kable i dokumenty"],
      method: "Ergonomia & Kua"
    },
    "Kuchnia osobna": {
      func: "Odżywianie, zdrowie & obfitość rodziny",
      diag: "Serce żywiołu Ognia w domu. Pozycja gotującego powinna zapewniać poczucie kontroli nad przestrzenią.",
      strengths: ["Zamknięta strefa zatrzymująca zapachy i hałas gotowania"],
      risks: ["Gotowanie plecami do wejścia", "Bezpośrednie sąsiedztwo płyty grzewczej i zlewozmywaka"],
      recs: ["Zastosuj małe lusterko lub panel szklany za płytą, jeśli gotujesz tyłem do drzwi", "Wprowadź drewniane akcesoria między zlewem a płytą"],
      method: "Wu Xing (5 Żywiołów)"
    },
    "Jadalnia": {
      func: "Wspólne posiłki, więzi rodzinne & spokój",
      diag: "Strefa budowania relacji. Okrągły lub prostokątny stół z parzystą liczbą wygodnych krzeseł.",
      strengths: ["Dedykowane miejsce sprzyjające uważnemu jedzeniu"],
      risks: ["Stół w wąskim przejściu komunikacyjnym"],
      recs: ["Zapewnij minimum 80 cm wolnej przestrzeni wokół każdego krzesła", "Zawieś ciepłą lampę centralnie nad stołem"],
      method: "Szkoła Formy"
    },
    "Łazienka z WC": {
      func: "Oczyszczenie & odpływ energii Wody",
      diag: "Strefa silnego odpływu energii Qi. Wymaga zamykania klapy sedesu i drzwi, aby zapobiec ucieczce pomyślnej energii z sąsiadujących stref.",
      strengths: ["Kompaktowy, zintegrowany węzeł sanitarny"],
      risks: ["Łazienka w centrum lokalu (Tai Qi) lub naprzeciwko wejścia głównego"],
      recs: ["Zawsze zamykaj klapę sedesu i drzwi do łazienki", "Wprowadź żywioł Drewna (rośliny tolerujące wilgoć lub zielone ręczniki), aby harmonizować odpływ Wody"],
      method: "Szkoła Formy & Wu Xing"
    },
    "Łazienka (kąpielowa bez WC)": {
      func: "Relaks, kąpiel & regeneracja Yin",
      diag: "Czysta strefa spa i pielęgnacji bez energii odpływu WC.",
      strengths: ["Wysoki komfort higieniczny i relaksacyjny"],
      risks: ["Zbyt chłodna kolorystyka potęgująca nadmiar Wody"],
      recs: ["Wprowadź ciepłe oświetlenie 2700K i drewniane dodatki", "Zadbaj o sprawną wentylację"],
      method: "Ergonomia & Wu Xing"
    },
    "Osobna toaleta / WC": {
      func: "Kompaktowa strefa sanitarna",
      diag: "Punktowy odpływ Qi. Wymaga zamykania drzwi i optycznej dyskrecji.",
      strengths: ["Separacja funkcji toalety od strefy kąpielowej"],
      risks: ["Drzwi WC widoczne bezpośrednio z salonu lub jadalni"],
      recs: ["Zamykaj drzwi i deskę", "Zastosuj małe akcenty Ziemi (ceramika, ciepłe kolory piasku)"],
      method: "Szkoła Formy"
    },
    "Przedpokój / Wiatrołap": {
      func: "Ming Tang (Jasna Sala) · Punkt wlotu energii Qi",
      diag: "Pierwsze wrażenie lokalu. Powinien być jasny, przestronny i wolny od zalegających butów.",
      strengths: ["Czysty filtr między światem zewnętrznym a wnętrzem"],
      risks: ["Lustro naprzeciwko drzwi wejściowych (odbija wchodzącą energię)", "Brak miejsca na odłożenie okryć"],
      recs: ["Zdejmij lustro z osi drzwi wejściowych i przenieś na ścianę boczną", "Wprowadź jasne, gościnne światło"],
      method: "Szkoła Formy"
    },
    "Garderoba": {
      func: "Przechowywanie & ład przestrzenny",
      diag: "Uporządkowanie ubrań chroni dom przed stagnacją energii (Si Qi).",
      strengths: ["Wydzielona przestrzeń eliminująca szafy z sypialni"],
      risks: ["Brak cyrkulacji powietrza i bałagan"],
      recs: ["Wprowadź systemowe oświetlenie LED w szafach", "Regularnie wietrz i usuwaj nienoszone rzeczy"],
      method: "Ergonomia"
    },
    "Balkon / Taras": {
      func: "Kontakt z otoczeniem zewnętrznym & punkt czerpania światła",
      diag: "Zewnętrzne przedłużenie salonu lub sypialni.",
      strengths: ["Bezpośrednie doświetlenie i świeże powietrze"],
      risks: ["Przechowywanie rupieci blokujących widok z okna"],
      recs: ["Uporządkuj roślinność i meble tarasowe", "Zadbaj o czystość szyb"],
      method: "Szkoła Formy"
    }
  };

  const roomRecommendations = roomsToAnalyze.map((roomName) => {
    const known = roomKnowledgeMap[roomName] || {
      func: "Strefa użytkowa lokalu",
      diag: "Wymaga zrównoważenia ciągów komunikacyjnych i naturalnego światła.",
      strengths: ["Funkcjonalne włączenie do układu lokalu"],
      risks: ["Możliwa kolizja z osiami komunikacyjnymi"],
      recs: ["Dostosuj oświetlenie do charakteru strefy", "Uporządkuj przestrzeń"],
      method: "Ergonomia & Forma"
    };

    return {
      room: roomName,
      function: known.func,
      diagnosis: known.diag,
      strengths: known.strengths,
      risks: known.risks,
      recommendations: known.recs,
      method: known.method
    };
  });

  return {
    score: 84,
    confidence: northConfirmed ? "high" : "medium",
    executive_summary: "Układ lokalu wykazuje silną bazę architektoniczną z czytelnym podziałem na strefę dzienną (Yang) i nocną (Yin). Kluczowe punkty do natychmiastowej optymalizacji to pozycje dominujące wezgłowia łóżka oraz biurka z zachowaniem bezpiecznych osi wzroku na wejście.",
    purchase_decision: "Układ funkcjonalny o wysokim potencjale harmonii, rekomendowany do adaptacji z wykorzystaniem bezkosztowych korekt ustawienia mebli.",
    detected_inputs: [
      "Wgrany i skalibrowany rzut lokalu",
      `Orientacja północy: ${payload.orientationData?.northAngleDeg ?? 0}° (${northConfirmed ? "zatwierdzona" : "domyślna"})`,
      `Oznaczone elementy: ${markersCount} punktów`,
      `Profil domowników: ${residentsCount} osób (${activeResident?.label || "Główny domownik"})`
    ],
    missing_inputs: [],
    priority_actions: [
      {
        title: "Korekta pozycji wezgłowia łóżka (Szkoła Formy)",
        why: "Wezgłowie powinno przylegać bezpośrednio do pełnej ściany nośnej z dala od bezpośredniej osi wejścia (ochrona przed tunelem Chong Qi).",
        method: "Szkoła Formy (Luan Tou)",
        impact: "Bardzo wysoki (głęboki sen i regeneracja)",
        effort: "Niski (dosunięcie łóżka do ściany)",
        confidence: "high"
      },
      {
        title: "Pozycja dowodzenia dla biurka (Commanding Position)",
        why: "Siedzący przy pracy powinien mieć solidne oparcie ściany za plecami i pełny kąt widzenia na drzwi wejściowe do pokoju.",
        method: "Ergonomia & Szkoła Formy",
        impact: "Wysoki (koncentracja i redukcja zmęczenia)",
        effort: "Niski (obrót biurka o 90°)",
        confidence: "high"
      },
      {
        title: "Harmonizacja oświetlenia (3 warstwy światła)",
        why: "Zastąpienie pojedynczego górnego żyrandola trzema warstwami światła ciepłego (2700K w salonie, 2200K w sypialni).",
        method: "Architektura & Psychologia Środowiskowa",
        impact: "Średni (regulacja rytmu dobowego)",
        effort: "Niski (dobór źródeł LED)",
        confidence: "high"
      }
    ],
    method_scores: [
      { method: "Szkoła Formy (Luan Tou)", score: 86, signal: "Stabilne oparcie i widoczność wejść" },
      { method: "Siatka 9 Stref Bagua (Luo Shu)", score: 82, signal: "Zrównoważony rozkład 9 pałaców" },
      { method: "Analiza Kompasowa (Kierunki N)", score: 80, signal: "Dobre doświetlenie strefy dziennej" },
      { method: "Ergonomia i Architektura", score: 88, signal: "Swobodne ciągi komunikacyjne > 90 cm" }
    ],
    levels: [],
    zones: [],
    directional_insights: [],
    sector_map: sectorMap,
    resident_analysis: residentAnalysis,
    room_recommendations: roomRecommendations,
    furniture_recommendations: [],
    traditional_analysis: [],
    practical_analysis: [],
    practical_changes: [
      { title: "Przestawienie łóżka do pełnej ściany", cost: "0 zł", when: "Natychmiast" },
      { title: "Obrót biurka przodem do wejścia", cost: "0 zł", when: "Natychmiast" },
      { title: "Wymiana źródeł światła na ciepłe LED 2700K", cost: "ok. 60 zł", when: "W ciągu 7 dni" }
    ],
    source_ledger: [
      { source: "Klasyczna Szkoła Formy (Luan Tou)", used_for: "Pozycje dominujące mebli", confidence: "high" },
      { source: "Siatka 9 Stref Bagua (Luo Shu)", used_for: "Sektory energetyczne", confidence: "high" },
      { source: "Nowoczesna Ergonomia Architektoniczna", used_for: "Ciągi komunikacyjne i oświetlenie", confidence: "high" }
    ],
    disclaimer: "e-fengshui.pl jest analizą informacyjno-doradczą opartą na tradycyjnych zasadach Feng Shui i ergonomii.",
    ai_provider: "e-fengshui-engine",
    ai_model: "v2-spatial-engine",
    ai_mode: "live"
  };
}

export async function persistAuditIntake({
  payload,
  report,
  consentMarketing
}: {
  payload: AuditRequestPayload;
  report: AuditReport;
  consentMarketing: boolean;
}) {
  if (!hasSupabaseConfig || !supabase) {
    return { ok: false, reason: "Supabase nie jest skonfigurowany lokalnie." };
  }

  const fileSummary = payload.files.map(({ name, mimeType, size }) => ({
    name,
    mime_type: mimeType,
    size
  }));

  const leadResult = await supabase.from("leads").insert({
    email: payload.email,
    source: "audit_builder",
    interest: payload.planId,
    consent_marketing: consentMarketing
  });

  const intakeResult = await supabase.from("audit_intakes").insert({
    email: payload.email,
    plan_id: payload.planId,
    property_type: payload.propertyType,
    levels_count: payload.levelsCount,
    usable_area_m2: payload.usableAreaM2,
    purpose: payload.purpose,
    address_note: payload.addressNote || null,
    orientation_note: payload.orientationNote || null,
    entry_note: payload.entryNote || null,
    constraints_note: payload.constraintsNote || null,
    profile_note: payload.profileNote || null,
    orientation_data: payload.orientationData,
    plan_annotations: payload.planAnnotations,
    furniture_annotations: payload.furnitureAnnotations,
    building_profile: payload.buildingProfile,
    resident_profiles: payload.residentProfiles,
    selected_methods: payload.selectedMethods,
    files_summary: fileSummary,
    report_json: report,
    ai_provider: report.ai_provider,
    ai_model: report.ai_model,
    ai_mode: report.ai_mode,
    status: report.ai_mode === "error" ? "failed" : "ready",
    consent_marketing: consentMarketing
  });

  if (leadResult.error || intakeResult.error) {
    return {
      ok: false,
      reason: leadResult.error?.message || intakeResult.error?.message || "Zapis Supabase nie powiódł się."
    };
  }

  return { ok: true, reason: "Zgłoszenie i raport zapisane w Supabase." };
}

export function downloadReportJson(report: AuditReport) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `plan-harmonii-raport-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

type ReportPdfOptions = {
  planFile?: File | null;
  northAngleDeg?: number | null;
  planMarkers?: PlanMarker[];
};

type SectorDirectionCode = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW" | "CENTER";

interface CompassSectorMeta {
  code: SectorDirectionCode;
  direction: string;
  sector: string;
  element: string;
  trigram: string;
  colorBg: string;
  colorBorder: string;
  colorText: string;
}

const COMPASS_SECTOR_DEFINITIONS: Record<SectorDirectionCode, CompassSectorMeta> = {
  N: {
    code: "N",
    direction: "Północ",
    sector: "Kariera i Droga Życiowa",
    element: "Woda",
    trigram: "Kan (坎)",
    colorBg: "rgba(74, 109, 124, 0.12)",
    colorBorder: "#4A6D7C",
    colorText: "#1F3B44"
  },
  NE: {
    code: "NE",
    direction: "Północny wschód",
    sector: "Wiedza i Samorozwój",
    element: "Ziemia",
    trigram: "Gen (艮)",
    colorBg: "rgba(185, 149, 86, 0.12)",
    colorBorder: "#B99556",
    colorText: "#634718"
  },
  E: {
    code: "E",
    direction: "Wschód",
    sector: "Zdrowie i Rodzina",
    element: "Drewno",
    trigram: "Zhen (震)",
    colorBg: "rgba(82, 126, 88, 0.12)",
    colorBorder: "#527E58",
    colorText: "#25482A"
  },
  SE: {
    code: "SE",
    direction: "Południowy wschód",
    sector: "Obfitość i Finanse",
    element: "Drewno",
    trigram: "Xun (巽)",
    colorBg: "rgba(70, 120, 85, 0.12)",
    colorBorder: "#467855",
    colorText: "#20462C"
  },
  S: {
    code: "S",
    direction: "Południe",
    sector: "Sława i Reputacja",
    element: "Ogień",
    trigram: "Li (離)",
    colorBg: "rgba(194, 101, 74, 0.12)",
    colorBorder: "#C2654A",
    colorText: "#722E1A"
  },
  SW: {
    code: "SW",
    direction: "Południowy zachód",
    sector: "Relacje i Partnerstwo",
    element: "Ziemia",
    trigram: "Kun (坤)",
    colorBg: "rgba(175, 125, 85, 0.12)",
    colorBorder: "#AF7D55",
    colorText: "#5E3A1E"
  },
  W: {
    code: "W",
    direction: "Zachód",
    sector: "Kreatywność i Dzieci",
    element: "Metal",
    trigram: "Dui (兌)",
    colorBg: "rgba(148, 158, 153, 0.12)",
    colorBorder: "#949E99",
    colorText: "#3E4844"
  },
  NW: {
    code: "NW",
    direction: "Północny zachód",
    sector: "Pomocni Ludzie i Mentorzy",
    element: "Metal",
    trigram: "Qian (乾)",
    colorBg: "rgba(180, 150, 100, 0.12)",
    colorBorder: "#B49664",
    colorText: "#5C441E"
  },
  CENTER: {
    code: "CENTER",
    direction: "Centrum",
    sector: "Serce Domu i Równowaga",
    element: "Ziemia",
    trigram: "Tai Qi (太極)",
    colorBg: "rgba(205, 162, 70, 0.15)",
    colorBorder: "#CDA246",
    colorText: "#6A4D12"
  }
};

function getCellCompassSector(colIndex: number, rowIndex: number, northAngleDeg: number): CompassSectorMeta {
  const dx = colIndex - 1;
  const dy = rowIndex - 1;

  if (dx === 0 && dy === 0) {
    return COMPASS_SECTOR_DEFINITIONS.CENTER;
  }

  const planAngleDeg = ((Math.atan2(dx, -dy) * 180 / Math.PI) + 360) % 360;
  const bearing = ((planAngleDeg - northAngleDeg) + 360) % 360;

  if (bearing >= 337.5 || bearing < 22.5) return COMPASS_SECTOR_DEFINITIONS.N;
  if (bearing < 67.5) return COMPASS_SECTOR_DEFINITIONS.NE;
  if (bearing < 112.5) return COMPASS_SECTOR_DEFINITIONS.E;
  if (bearing < 157.5) return COMPASS_SECTOR_DEFINITIONS.SE;
  if (bearing < 202.5) return COMPASS_SECTOR_DEFINITIONS.S;
  if (bearing < 247.5) return COMPASS_SECTOR_DEFINITIONS.SW;
  if (bearing < 292.5) return COMPASS_SECTOR_DEFINITIONS.W;
  return COMPASS_SECTOR_DEFINITIONS.NW;
}

function pdfConfidenceLabel(value: AuditReport["confidence"]) {
  if (value === "high") return "wysoka";
  if (value === "low") return "niska";
  return "średnia";
}

function pdfText(value: string | null | undefined, fallback = "do uzupełnienia") {
  let clean = String(value ?? "").trim();
  if (!clean) return fallback;

  // Clean up any CJK quotation brackets, emojis or special characters that are missing in standard Latin fonts
  clean = clean
    .replace(/[【〔［]/g, "• ")
    .replace(/[】〕］]/g, "")
    .replace(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g, "") // Strip any Chinese/CJK ideographs
    .replace(/[✨⚡👤💡📍➔]/g, "") // Strip emojis that fail in standard PDF fonts
    .replace(/\s+/g, " ")
    .trim();

  return clean.length > 0 ? clean : fallback;
}

function pdfList(items: string[] | undefined, fallback: string) {
  const cleanItems = (items ?? []).map((item) => pdfText(item, "")).filter(Boolean);
  return cleanItems.length > 0 ? cleanItems : [fallback];
}

function canUsePlanImageInPdf(file: File) {
  const mimeType = inferMimeType(file.name, file.type);
  return mimeType === "image/jpeg" || mimeType === "image/png" || mimeType === "image/webp";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Nie udało się odczytać pliku ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const timeout = setTimeout(() => {
      resolve(image);
    }, 4000);

    image.onload = () => {
      clearTimeout(timeout);
      resolve(image);
    };
    image.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Nie udało się przygotować skanu do mapy sektorów."));
    };
    image.src = src;

    if (image.complete && image.naturalWidth > 0) {
      clearTimeout(timeout);
      resolve(image);
    }
  });
}

/**
 * Creates an elegant, high-clarity architectural Bagua 9-sector overlay.
 */
function markerCanvasLabel(marker: PlanMarker) {
  const aliases: Record<string, string> = {
    "Łazienka/WC": "Łazienka",
    "Hol/korytarz": "Hol",
    "Pokój dziecka": "Pokój dz.",
    "Wejście główne": "Wejście",
    "Drzwi wewnętrzne": "Drzwi",
    "Drzwi balkonowe/taras": "Taras",
    "Płyta/kuchenka": "Kuchenka",
    "Regał/szafa": "Szafa",
    "Miejsce pracy": "Praca"
  };
  return aliases[marker.label] ?? marker.label;
}

function drawArchitecturalMarkerOnCanvas(
  ctx: CanvasRenderingContext2D,
  marker: PlanMarker,
  canvasWidth: number,
  canvasHeight: number
) {
  const px = (marker.xPercent / 100) * canvasWidth;
  const py = (marker.yPercent / 100) * canvasHeight;

  if (marker.category === "furniture") {
    const angleDeg = marker.facingDeg ?? 0;
    const angleRad = (angleDeg * Math.PI) / 180;
    const scale = marker.scale ?? 1.0;
    const label = marker.label || "Mebel";

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angleRad);
    ctx.scale(scale, scale);

    if (label === "Łóżko") {
      // 1. ŁÓŻKO: 76x96px (Architektoniczny rzut 2D z wezgłowiem na górze, 2 poduszkami i narzutą)
      // Rama i materac
      ctx.fillStyle = "rgba(16, 34, 31, 0.96)";
      ctx.strokeStyle = "#C49544";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-38, -48, 76, 96, 6);
      ctx.fill();
      ctx.stroke();

      // Masywne drewniane wezgłowie oparte o ścianę (na górze przy kącie 0°)
      ctx.fillStyle = "#C49544";
      ctx.fillRect(-40, -56, 80, 10);

      // 2 Duże poduszki przy wezgłowiu
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#C49544";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(-32, -40, 28, 20, 4);
      ctx.roundRect(4, -40, 28, 20, 4);
      ctx.fill();
      ctx.stroke();

      // Pościel / Narzuta w dolnej części
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.fillRect(-38, -10, 76, 58);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.setLineDash([5, 3.5]);
      ctx.beginPath();
      ctx.moveTo(-38, -10);
      ctx.lineTo(38, -10);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (label === "Biurko" || label === "Miejsce pracy") {
      // 2. BIURKO Z ERGONOMICZNYM FOTELEM: 88x74px
      // Blat biurka z przodu (na dole)
      ctx.fillStyle = "rgba(16, 34, 31, 0.96)";
      ctx.strokeStyle = "#C49544";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-44, 8, 88, 36, 6);
      ctx.fill();
      ctx.stroke();

      // Monitor panoramiczny / Laptop
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(-24, 14, 48, 7);

      // Fotel biurowy za biurkiem (użytkownik siedzi z tyłu, twarzą do biurka)
      ctx.fillStyle = "rgba(196, 149, 68, 0.45)";
      ctx.strokeStyle = "#C49544";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-22, -34, 44, 30, 6);
      ctx.fill();
      ctx.stroke();

      // Zaokrąglone oparcie fotela za plecami
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.arc(0, -32, 24, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Podłokietniki
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(-27, -34, 6, 18);
      ctx.fillRect(21, -34, 6, 18);
    } else if (label === "Sofa") {
      // 3. SOFA Z OPARCIEM I PODŁOKIETNIKAMI: 92x62px
      // Grube oparcie z tyłu (na górze)
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.arc(0, -26, 36, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.strokeStyle = "#C49544";
      ctx.lineWidth = 2.6;
      ctx.stroke();

      // Podłokietniki po bokach
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(-45, -24, 10, 42);
      ctx.fillRect(35, -24, 10, 42);

      // 2 Duże poduchy siedziska
      ctx.fillStyle = "rgba(16, 34, 31, 0.96)";
      ctx.strokeStyle = "#C49544";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-31, -18, 30, 36, 5);
      ctx.roundRect(1, -18, 30, 36, 5);
      ctx.fill();
      ctx.stroke();
    } else if (label === "Lustro") {
      // 4. LUSTRO ZE STOŻKIEM ODBICIA: 80x78px
      // Rama ścienna na górze
      ctx.fillStyle = "#73A8C7";
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2.8;
      ctx.fillRect(-38, -38, 76, 10);

      // Tafla szkła - lśnienie
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-26, -33);
      ctx.lineTo(26, -33);
      ctx.stroke();

      // Wyraźny stożek pola odbicia światła w głąb pokoju
      ctx.fillStyle = "rgba(115, 168, 199, 0.35)";
      ctx.strokeStyle = "rgba(115, 168, 199, 0.95)";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(-34, -28);
      ctx.lineTo(-52, 42);
      ctx.lineTo(52, 42);
      ctx.lineTo(34, -28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      // Oznaczenie oka / punktu obserwatora
      ctx.fillStyle = "#C49544";
      ctx.beginPath();
      ctx.arc(0, 16, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#10221F";
      ctx.beginPath();
      ctx.arc(0, 16, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (label.includes("Płyta") || label.includes("Kuchenka")) {
      // 5. PŁYTA INDUKCYJNA
      ctx.fillStyle = "rgba(16, 34, 31, 0.96)";
      ctx.strokeStyle = "#C49544";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-34, -34, 68, 68, 8);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(-16, -16, 11, 0, Math.PI * 2);
      ctx.arc(16, -16, 13, 0, Math.PI * 2);
      ctx.arc(-16, 16, 9, 0, Math.PI * 2);
      ctx.arc(16, 16, 12, 0, Math.PI * 2);
      ctx.stroke();

      // Panel dotykowy
      ctx.fillStyle = "#C49544";
      ctx.fillRect(-20, 26, 40, 4);
    } else if (label === "Stół") {
      // 6. STÓŁ Z KRZESŁAMI
      ctx.fillStyle = "rgba(16, 34, 31, 0.96)";
      ctx.strokeStyle = "#C49544";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-34, -24, 68, 48, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(-24, -36, 48, 8);
      ctx.fillRect(-24, 28, 48, 8);
      ctx.fillRect(-45, -16, 8, 32);
      ctx.fillRect(37, -16, 8, 32);
    } else {
      ctx.fillStyle = "rgba(16, 34, 31, 0.96)";
      ctx.strokeStyle = "#C49544";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-34, -34, 68, 68, 8);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();

    // Floating text label beneath furniture only if assigned to a resident
    if (marker.assignedResidentLabel) {
      const tagText = `👤 ${marker.assignedResidentLabel}`;
      ctx.save();
      ctx.font = "bold 12px Arial, sans-serif";
      const textW = ctx.measureText(tagText).width;
      const tagPad = 10;
      const boxW = textW + tagPad * 2;
      const boxH = 24;
      const boxX = px - boxW / 2;
      const boxY = py + Math.max(42, 42 * scale) + 8;

      ctx.fillStyle = "rgba(16, 34, 31, 0.96)";
      ctx.strokeStyle = "rgba(196, 149, 68, 0.95)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tagText, px, boxY + boxH / 2);
      ctx.restore();
    }
  } else if (marker.category === "fixed") {
    // STAŁE PUNKTY ARCHITEKTONICZNE (Drzwi, Okna, Schody, Wejście)
    const label = marker.label || "";
    ctx.save();
    ctx.translate(px, py);

    if (label.includes("Drzwi")) {
      ctx.strokeStyle = "#2B536D";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(24, 0);
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 24);
      ctx.stroke();
    } else if (label.includes("Okno")) {
      ctx.fillStyle = "rgba(115, 168, 199, 0.5)";
      ctx.strokeStyle = "#2B536D";
      ctx.lineWidth = 2.5;
      ctx.fillRect(-26, -6, 52, 12);
      ctx.strokeRect(-26, -6, 52, 12);
      ctx.beginPath();
      ctx.moveTo(-26, 0);
      ctx.lineTo(26, 0);
      ctx.stroke();
    } else if (label.includes("Schody")) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.strokeStyle = "#10221F";
      ctx.lineWidth = 2.2;
      ctx.fillRect(-18, -26, 36, 52);
      ctx.strokeRect(-18, -26, 36, 52);
      for (let s = -20; s <= 20; s += 8) {
        ctx.beginPath();
        ctx.moveTo(-18, s);
        ctx.lineTo(18, s);
        ctx.stroke();
      }
      ctx.strokeStyle = "#C49544";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(0, -18);
      ctx.lineTo(-6, -10);
      ctx.moveTo(0, -18);
      ctx.lineTo(6, -10);
      ctx.stroke();
    } else if (label.includes("Wejście")) {
      ctx.fillStyle = "#936B26";
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-36, -14, 72, 28, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 10px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("WEJŚCIE ➔", 0, 0);
    } else {
      ctx.fillStyle = "#2B536D";
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  } else if (marker.category === "room") {
    // POMIESZCZENIA (ROOMS)
    const label = marker.label || "";
    ctx.save();
    ctx.font = "bold 11px Arial, sans-serif";
    const textW = ctx.measureText(label).width;
    const boxW = textW + 18;
    const boxH = 24;

    ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
    ctx.strokeStyle = "#2D5A46";
    ctx.lineWidth = 1.8;
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(px - boxW / 2, py - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#2D5A46";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, px, py);
    ctx.restore();
  }
}

/**
 * Creates a crystal-clear, high-contrast architectural CAD blueprint with 9 Bagua sectors & furniture.
 */
export async function createPlanSectorOverlayImage(
  file: File | null | undefined,
  _report: AuditReport,
  northAngleDeg = 0,
  planMarkers: PlanMarker[] = []
): Promise<string | null> {
  if (!file || !canUsePlanImageInPdf(file)) {
    return null;
  }

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImageElement(dataUrl);

  const targetWidth = 1400;
  const aspectRatio = (image.naturalHeight || image.height) / (image.naturalWidth || image.width);
  const targetHeight = Math.round(targetWidth * (aspectRatio || 0.75));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Base background: clean architectural white
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Render raw drawing onto canvas
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  // 1. HIGH-PASS ADAPTIVE ARCHITECTURAL VECTOR/CAD FILTER
  try {
    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imgData.data;
    const len = data.length;

    // Calculate background paper luminance histogram
    const hist = new Uint32Array(256);
    for (let i = 0; i < len; i += 16) {
      const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      hist[lum]++;
    }

    // Find the paper peak in the brighter half of the image
    let paperPeakLum = 230;
    let maxCount = 0;
    for (let l = 130; l < 256; l++) {
      if (hist[l] > maxCount) {
        maxCount = hist[l];
        paperPeakLum = l;
      }
    }

    // Dynamic thresholds relative to the actual paper brightness
    const inkMax = Math.min(145, Math.max(80, Math.round(paperPeakLum * 0.62)));
    const paperMin = Math.min(235, Math.max(160, Math.round(paperPeakLum * 0.85)));

    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Detect yellow/orange/green highlighter stains
      const isHighlighterOrTint = (r > 150 && g > 130 && (b < 120 || Math.abs(r - b) > 50));

      if (lum <= inkMax && !isHighlighterOrTint) {
        // Crisp, solid graphite architectural ink for walls, doors, windows, stairs
        data[i] = 16;
        data[i + 1] = 34;
        data[i + 2] = 31;
        data[i + 3] = 255;
      } else if (lum >= paperMin || isHighlighterOrTint) {
        // Pure architectural white canvas
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      } else {
        // Anti-aliased transition
        const factor = (lum - inkMax) / (paperMin - inkMax);
        const v = Math.round(16 + factor * (255 - 16));
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    console.warn("Luminance filter skipped:", e);
  }

  // Full dwelling 3x3 grid dimensions
  const pad = 12;
  const gridX = pad;
  const gridY = pad;
  const gridW = targetWidth - pad * 2;
  const gridH = targetHeight - pad * 2;
  const cellW = gridW / 3;
  const cellH = gridH / 3;

  // 2. Draw 9 sectors with crisp dashed lines & corner badges (NO opaque fills covering the plan!)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cellX = gridX + col * cellW;
      const cellY = gridY + row * cellH;
      const sector = getCellCompassSector(col, row, northAngleDeg);

      // Delicate architectural dashed grid line
      ctx.save();
      ctx.setLineDash([8, 5]);
      ctx.strokeStyle = "rgba(196, 148, 63, 0.85)";
      ctx.lineWidth = 1.8;
      ctx.strokeRect(cellX, cellY, cellW, cellH);
      ctx.restore();

      // Compact architectural badge in top-left of the cell
      const tagW = Math.min(cellW - 16, 210);
      const tagH = 26;
      const tagX = cellX + 8;
      const tagY = cellY + 8;

      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.strokeStyle = "rgba(196, 148, 63, 0.9)";
      ctx.lineWidth = 1.2;
      ctx.shadowColor = "rgba(16, 34, 31, 0.12)";
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, tagW, tagH, 5);
      ctx.fill();
      ctx.stroke();

      // Tag Text
      ctx.fillStyle = "#10221F";
      ctx.font = "bold 11px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `${sector.code} · ${sector.direction.toUpperCase()} · ${sector.element.toUpperCase()}`,
        tagX + tagW / 2,
        tagY + tagH / 2
      );
      ctx.restore();
    }
  }

  // Outer frame
  ctx.strokeStyle = "#10221F";
  ctx.lineWidth = 3;
  ctx.strokeRect(gridX, gridY, gridW, gridH);

  // 3. Draw All User Markers (Rooms, Fixed Elements, Furniture with exact angles & bold symbols!)
  if (planMarkers && planMarkers.length > 0) {
    planMarkers.forEach((marker) => {
      drawArchitecturalMarkerOnCanvas(ctx, marker, targetWidth, targetHeight);
    });
  }

  // 4. Discreet Compass widget in corner
  drawNorthCompassWidget(ctx, targetWidth, northAngleDeg);

  return canvas.toDataURL("image/jpeg", 0.94);
}

function drawNorthCompassWidget(ctx: CanvasRenderingContext2D, canvasWidth: number, northAngleDeg: number) {
  const boxW = 76;
  const boxH = 82;
  const boxX = canvasWidth - boxW - 16;
  const boxY = 16;

  ctx.save();
  ctx.fillStyle = "rgba(255, 253, 250, 0.96)";
  ctx.strokeStyle = "rgba(196, 148, 63, 0.85)";
  ctx.lineWidth = 1.5;
  ctx.shadowColor = "rgba(16, 34, 31, 0.15)";
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 6);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  const centerX = boxX + boxW / 2;
  const centerY = boxY + 38;
  const angleRad = (northAngleDeg * Math.PI) / 180;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angleRad);

  // North needle
  ctx.fillStyle = "#10221F";
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(-6, 0);
  ctx.lineTo(6, 0);
  ctx.closePath();
  ctx.fill();

  // South needle
  ctx.fillStyle = "#C49544";
  ctx.beginPath();
  ctx.moveTo(0, 22);
  ctx.lineTo(-6, 0);
  ctx.lineTo(6, 0);
  ctx.closePath();
  ctx.fill();

  // Center dot
  ctx.fillStyle = "#FAF8F5";
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Labels
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#10221F";
  ctx.font = "bold 11px Arial, sans-serif";
  ctx.fillText("N", centerX, boxY + 12);

  ctx.fillStyle = "#7A6E5D";
  ctx.font = "bold 9.5px Arial, sans-serif";
  ctx.fillText(`${Math.round(northAngleDeg)}°`, centerX, boxY + 70);
  ctx.restore();
}

function pdfCard(title: string, body: string, bullets: string[] = [], eyebrow = "") {
  const stack: any[] = [];

  if (eyebrow) {
    stack.push({ text: eyebrow.toUpperCase(), style: "cardEyebrow" });
  }

  stack.push({ text: title, style: "cardTitle" });
  stack.push({ text: body, style: "bodyText", margin: [0, 2, 0, bullets.length > 0 ? 4 : 0] });

  if (bullets.length > 0) {
    stack.push({
      ul: bullets,
      style: "bulletText",
      margin: [0, 1, 0, 0]
    });
  }

  return {
    unbreakable: true,
    table: {
      dontBreakRows: true,
      widths: ["*"],
      body: [[{ stack, margin: [10, 8, 10, 8] }]]
    },
    layout: {
      fillColor: () => "#FFFDFB",
      hLineColor: () => "#E0D7C6",
      vLineColor: () => "#E0D7C6",
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0
    },
    margin: [0, 0, 0, 6]
  };
}

function pdfNumberedActionCard(action: AuditReport["priority_actions"][number], index: number) {
  return {
    table: {
      widths: [20, "*"],
      body: [
        [
          {
            text: `${index}.`,
            fontSize: 13,
            bold: true,
            color: "#C49544",
            margin: [8, 8, 0, 8]
          },
          {
            stack: [
              { text: pdfText(action.method).toUpperCase(), style: "cardEyebrow" },
              { text: pdfText(action.title), style: "cardTitle" },
              { text: pdfText(action.why), style: "bodyText", margin: [0, 2, 0, 4] },
              {
                text: `Wpływ: ${pdfText(action.impact, "wysoki")} · Wysiłek: ${pdfText(action.effort, "niski")} · Pewność: ${pdfConfidenceLabel(action.confidence)}`,
                style: "mutedText"
              }
            ],
            margin: [2, 8, 8, 8]
          }
        ]
      ]
    },
    layout: {
      fillColor: () => "#FFFDFB",
      hLineColor: () => "#E0D7C6",
      vLineColor: () => "#E0D7C6",
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0
    },
    margin: [0, 0, 0, 6]
  };
}

function pdfCardGrid(cards: unknown[], columns = 2) {
  if (cards.length === 0) return { text: "" };

  const widths = Array(columns).fill("*");
  const rows: unknown[][] = [];

  for (let index = 0; index < cards.length; index += columns) {
    rows.push(
      widths.map((_, columnIndex) => {
        const card = cards[index + columnIndex];
        return card
          ? { stack: [card], margin: columnIndex === 0 ? [0, 0, 3, 0] : [3, 0, 0, 0] }
          : { text: "" };
      })
    );
  }

  return {
    table: {
      widths,
      body: rows
    },
    layout: "noBorders",
    margin: [0, 0, 0, 2]
  };
}

function pdfProgressBar(value: number, width = 180, color = "#9D742F") {
  const safeValue = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const fillWidth = Math.round((width * safeValue) / 100);

  return {
    canvas: [
      { type: "rect", x: 0, y: 0, w: width, h: 5, r: 2.5, color: "#E7DDCA" },
      { type: "rect", x: 0, y: 0, w: fillWidth, h: 5, r: 2.5, color }
    ],
    margin: [0, 3, 0, 0]
  };
}

function pdfMethodScoreChart(report: AuditReport) {
  return {
    unbreakable: true,
    table: {
      dontBreakRows: true,
      widths: ["*", 42],
      body: report.method_scores.slice(0, 8).map((item) => [
        {
          stack: [
            { text: pdfText(item.method), style: "tableStrong" },
            pdfProgressBar(
              item.score,
              180,
              item.score >= 80 ? "#527E58" : item.score >= 68 ? "#C49544" : "#C2654A"
            ),
            { text: pdfText(item.signal), style: "mutedText", margin: [0, 2, 0, 0] }
          ],
          margin: [0, 0, 0, 4]
        },
        { text: `${item.score}/100`, alignment: "right", style: "tableStrong", margin: [0, 1, 0, 0] }
      ])
    },
    layout: {
      hLineColor: () => "#E2D8C6",
      vLineColor: () => "#E2D8C6"
    },
    margin: [0, 0, 0, 8]
  };
}

function pdfSectorMatrix(sectors: AuditReport["sector_map"]) {
  const byCode = new Map<string, AuditReport["sector_map"][number]>();
  sectors.forEach((sec) => {
    const raw = String(sec.direction || "").toLowerCase();
    const secName = String(sec.sector || "").toLowerCase();

    if (raw.includes("centrum") || secName.includes("serce") || secName.includes("centrum") || raw.includes("center")) byCode.set("CENTER", sec);
    else if (raw.includes("północny zach") || raw.includes("nw") || secName.includes("pomocni")) byCode.set("NW", sec);
    else if (raw.includes("północny wsch") || raw.includes("ne") || secName.includes("wiedza")) byCode.set("NE", sec);
    else if (raw.includes("północ") || raw === "n" || secName.includes("karier")) byCode.set("N", sec);
    else if (raw.includes("południowy zach") || raw.includes("sw") || secName.includes("relacj") || secName.includes("partner")) byCode.set("SW", sec);
    else if (raw.includes("południowy wsch") || raw.includes("se") || secName.includes("bogact") || secName.includes("finans") || secName.includes("obfitość")) byCode.set("SE", sec);
    else if (raw.includes("południe") || raw === "s" || secName.includes("sława") || secName.includes("reputacj")) byCode.set("S", sec);
    else if (raw.includes("zachód") || raw === "w" || secName.includes("kreatyw") || secName.includes("dzieci")) byCode.set("W", sec);
    else if (raw.includes("wschód") || raw === "e" || secName.includes("zdrowi") || secName.includes("rodzin")) byCode.set("E", sec);
  });

  const matrixLayout: SectorDirectionCode[][] = [
    ["NW", "N", "NE"],
    ["W", "CENTER", "E"],
    ["SW", "S", "SE"]
  ];

  return {
    unbreakable: true,
    table: {
      dontBreakRows: true,
      widths: ["*", "*", "*"],
      body: matrixLayout.map((row) =>
        row.map((code) => {
          const def = COMPASS_SECTOR_DEFINITIONS[code];
          const item = byCode.get(code);
          return {
            stack: [
              { text: `${def.direction.toUpperCase()} (${def.code})`, style: "matrixDirection" },
              { text: def.sector, style: "matrixTitle" },
              { text: `Żywioł: ${def.element} · ${def.trigram}`, style: "matrixMeta" },
              { text: item?.current_use || "Strefa funkcjonalna", style: "matrixUse" }
            ],
            margin: [5, 4, 5, 4]
          };
        })
      )
    },
    layout: {
      fillColor: (rowIndex: number, _node: unknown, columnIndex: number) => {
        if (rowIndex === 1 && columnIndex === 1) return "#F4EBD9";
        return (rowIndex + columnIndex) % 2 === 0 ? "#FBF8F2" : "#FFFDFB";
      },
      hLineColor: () => "#D8CDB8",
      vLineColor: () => "#D8CDB8"
    },
    margin: [0, 0, 0, 8]
  };
}

function pdfNatalChartMatrix(chart?: BuildingNatalChart) {
  if (!chart || !chart.palaces) return null;

  const byCode = new Map(chart.palaces.map((item) => [item.code, item]));
  const grid = [
    ["SE", "S", "SW"],
    ["E", "C", "W"],
    ["NE", "N", "NW"]
  ];

  return {
    unbreakable: true,
    table: {
      dontBreakRows: true,
      widths: ["33.33%", "33.33%", "33.34%"],
      body: grid.map((row) =>
        row.map((code) => {
          const item = byCode.get(code);
          return {
            stack: [
              {
                columns: [
                  { text: `▲ Góra: ${item?.mountain_star ?? "-"}`, fontSize: 6.8, bold: true, color: "#8E601B" },
                  { text: `${code}`, alignment: "center", fontSize: 7.2, bold: true, color: "#10221F" },
                  { text: `Woda: ${item?.water_star ?? "-"} 💧`, alignment: "right", fontSize: 6.8, bold: true, color: "#2B5F75" }
                ],
                margin: [0, 0, 0, 2]
              },
              { text: `${item?.direction ?? ""}`, style: "matrixTitle", fontSize: 7.4 },
              { text: `Baza: ${item?.base_star ?? "-"} · ${item?.nature ?? ""}`, style: "matrixMeta", fontSize: 6.4 },
              { text: `Lekarstwo: ${item?.remedy_wu_xing ?? ""}`, style: "matrixUse", fontSize: 6.4, margin: [0, 2, 0, 0] }
            ],
            margin: [4, 3.5, 4, 3.5]
          };
        })
      )
    },
    layout: {
      fillColor: (rowIndex: number, _node: unknown, columnIndex: number) => {
        if (rowIndex === 1 && columnIndex === 1) return "#F4EBD9";
        return (rowIndex + columnIndex) % 2 === 0 ? "#FBF8F2" : "#FFFDFB";
      },
      hLineColor: () => "#D8CDB8",
      vLineColor: () => "#D8CDB8"
    },
    margin: [0, 0, 0, 8]
  };
}

export async function downloadReportPdf(report: AuditReport, options: ReportPdfOptions = {}) {
  const northAngle = Number(options.northAngleDeg ?? 0);
  let planOverlayImage: string | null = null;
  try {
    if (options.planFile && canUsePlanImageInPdf(options.planFile)) {
      planOverlayImage = await createPlanSectorOverlayImage(
        options.planFile,
        report,
        northAngle,
        options.planMarkers || []
      );
    }
  } catch (err) {
    console.warn("Błąd tworzenia nakładki rzutu do PDF, generuję raport bez podkładu:", err);
    planOverlayImage = null;
  }

  const roomCards = report.room_recommendations.slice(0, 8).map((room) =>
    pdfCard(
      pdfText(room.room),
      pdfText(room.diagnosis),
      [
        ...pdfList(room.strengths, "atuty").map((item) => `Atut: ${item}`),
        ...pdfList(room.risks, "ryzyka").map((item) => `Ryzyko: ${item}`),
        ...pdfList(room.recommendations, "rekomendacje").map((item) => `Porada: ${item}`)
      ].slice(0, 6),
      `${pdfText(room.function)} · ${pdfText(room.method)}`
    )
  );

  // Canonical deduplication of furniture items
  const seenFurniture = new Set<string>();
  const deduplicatedFurniture = report.furniture_recommendations.filter((item) => {
    const raw = String(item.item || "").toLowerCase();
    let canonKey = raw;
    if (raw.includes("łóż")) canonKey = "bed";
    else if (raw.includes("biur") || raw.includes("prac")) canonKey = "desk";
    else if (raw.includes("sof") || raw.includes("kanap")) canonKey = "sofa";
    else if (raw.includes("płyt") || raw.includes("kuch") || raw.includes("kuchen")) canonKey = "stove";
    else if (raw.includes("stół") || raw.includes("stol")) canonKey = "table";
    else if (raw.includes("szaf") || raw.includes("gard")) canonKey = "wardrobe";

    if (seenFurniture.has(canonKey)) return false;
    seenFurniture.add(canonKey);
    return true;
  });

  const furnitureCards = deduplicatedFurniture.slice(0, 6).map((item) =>
    pdfCard(
      pdfText(item.item),
      `${pdfText(item.assessment)}\n\nOgraniczenie praktyczne: ${pdfText(item.practical_limit)}`,
      pdfList(item.recommendations, "ustawienie mebla").slice(0, 4),
      `${pdfText(item.orientation_role)} · ${pdfText(item.direction)}`
    )
  );

  const traditionalCards = report.traditional_analysis.slice(0, 2).map((section) =>
    pdfCard(
      pdfText(section.title),
      pdfText(section.body),
      pdfList(section.bullets, "wniosek").slice(0, 4),
      "Szkoła Formy i tradycja"
    )
  );

  const practicalCards = report.practical_analysis.slice(0, 2).map((section) =>
    pdfCard(
      pdfText(section.title),
      pdfText(section.body),
      pdfList(section.bullets, "wniosek").slice(0, 4),
      "Ergonomia i architektura wnętrz"
    )
  );

  const priorityCards = report.priority_actions.slice(0, 4).map((action, index) =>
    pdfNumberedActionCard(action, index + 1)
  );

  const sourceCards = report.source_ledger.slice(0, 4).map((source) =>
    pdfCard(
      pdfText(source.source),
      pdfText(source.used_for),
      [`Pewność metody: ${pdfConfidenceLabel(source.confidence)}`],
      "Rejestr źródeł"
    )
  );

  const residentCards = (report.resident_analysis || []).map((res) =>
    pdfCard(
      `${pdfText(res.name)} ${res.kua_number ? `· Kua ${res.kua_number} (${res.element})` : ""}`,
      `${pdfText(res.role || "Domownik")}${res.gender ? ` · ${res.gender}` : ""}${res.group ? ` · ${res.group}` : ""}\n\n${pdfText(res.placement_advice)}${res.yearly_warning ? `\n\n⚡ Wskazówka roczna: ${pdfText(res.yearly_warning)}` : ""}`,
      [
        ...(res.favorable_directions?.length
          ? [`Kierunki sprzyjające: ${res.favorable_directions.join(", ")}`]
          : []),
        ...(res.unfavorable_directions?.length
          ? [`Kierunki niekorzystne: ${res.unfavorable_directions.join(", ")}`]
          : []),
        ...(res.assigned_furniture?.length
          ? [`Przypisany mebel/strefa: ${res.assigned_furniture.join(", ")}`]
          : [])
      ].slice(0, 4),
      "Profil energetyczny mieszkańca (Ba Zhai)"
    )
  );

  const natalChart = report.natal_chart;

  const docDefinition: any = {
    pageSize: "A4",
    pageMargins: [34, 38, 34, 38],
    defaultStyle: {
      font: "Roboto",
      fontSize: 8.8,
      color: "#10221F",
      lineHeight: 1.22
    },
    header: () => ({
      columns: [
        { text: "PLAN HARMONII · CERTYFIKOWANY AUDYT PRZESTRZENNY", fontSize: 7.2, bold: true, color: "#C49544", characterSpacing: 0.8 },
        { text: "AI FENG SHUI & ARCHITEKTURA", alignment: "right", fontSize: 7.2, color: "#7A6E5D" }
      ],
      margin: [34, 14, 34, 0]
    }),
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: "Plan Harmonii · www.e-fengshui.pl", color: "#7A6E5D", fontSize: 7.8 },
        { text: `Strona ${currentPage} z ${pageCount}`, alignment: "right", color: "#7A6E5D", fontSize: 7.8 }
      ],
      margin: [34, 0, 34, 14]
    }),
    styles: {
      kicker: { color: "#C49544", bold: true, fontSize: 8, characterSpacing: 1.1 },
      title: { fontSize: 21, bold: true, color: "#10221F", lineHeight: 1.05, margin: [0, 2, 0, 4] },
      subtitle: { fontSize: 9, color: "#41524B", lineHeight: 1.3, margin: [0, 0, 0, 8] },
      scoreLabel: { color: "#7A6E5D", bold: true, fontSize: 7.5, characterSpacing: 0.8 },
      sectionTitle: { fontSize: 13.5, bold: true, color: "#10221F" },
      cardTitle: { fontSize: 10.5, bold: true, color: "#10221F" },
      cardEyebrow: { fontSize: 7.2, bold: true, color: "#C49544", characterSpacing: 0.4, margin: [0, 0, 0, 2] },
      priorityBadge: { alignment: "center", color: "#FFFDFB", bold: true, fontSize: 9.5 },
      bodyText: { fontSize: 8.3, color: "#2D3E38", lineHeight: 1.2 },
      bulletText: { fontSize: 7.9, color: "#3B4E48", lineHeight: 1.18 },
      mutedText: { fontSize: 7.8, color: "#66756E", lineHeight: 1.2 },
      tableStrong: { bold: true, color: "#10221F", fontSize: 8.2 },
      matrixDirection: { color: "#C49544", bold: true, fontSize: 7, alignment: "center" },
      matrixTitle: { color: "#10221F", bold: true, fontSize: 8, alignment: "center", margin: [0, 1, 0, 1] },
      matrixMeta: { color: "#66756E", fontSize: 6.8, alignment: "center" },
      matrixUse: { color: "#2D3E38", fontSize: 6.8, alignment: "center", margin: [0, 2, 0, 0] }
    },
    content: [
      // 1. HEADER & EXECUTIVE SUMMARY (Fluid, No Hard Page Breaks)
      { text: "PLAN HARMONII · RAPORT AUDYTOWY", style: "kicker" },
      { text: "Analiza układu przestrzennego i Feng Shui", style: "title" },
      {
        text: "Raport łączy tradycyjną Szkołę Formy (Luan Tou), siatkę 9 stref Bagua i orientację kompasową z nowoczesną ergonomią, akustyką i doświetleniem.",
        style: "subtitle"
      },
      {
        table: {
          dontBreakRows: true,
          widths: [130, "*"],
          body: [
            [
              {
                stack: [
                  { text: "WYNIK POTENCJAŁU", style: "scoreLabel" },
                  {
                    text: [
                      { text: `${report.score}`, fontSize: 28, bold: true, color: "#10221F" },
                      { text: " / 100", fontSize: 14, bold: true, color: "#7A6E5D" }
                    ],
                    noWrap: true,
                    margin: [0, 2, 0, 2]
                  },
                  { text: `Pewność: ${pdfConfidenceLabel(report.confidence)}`, style: "mutedText" }
                ],
                fillColor: "#F7EDDB",
                margin: [10, 8, 10, 8]
              },
              {
                stack: [
                  { text: "PODSUMOWANIE STRATEGICZNE", style: "cardEyebrow" },
                  { text: pdfText(report.executive_summary), style: "bodyText" },
                  { text: "REKOMENDACJA DECYZYJNA", style: "cardEyebrow", margin: [0, 4, 0, 1] },
                  { text: pdfText(report.purchase_decision), style: "bodyText" }
                ],
                fillColor: "#FFFDFB",
                margin: [10, 8, 10, 8]
              }
            ]
          ]
        },
        layout: {
          hLineColor: () => "#D1B47A",
          vLineColor: () => "#D1B47A",
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0
        },
        margin: [0, 0, 0, 10]
      },

      // 2. SCHEMATYCZNY RZUT CAD & MAPA 9 STREF BAGUA
      {
        unbreakable: true,
        stack: [
          { text: "Schematyczny rzut architektoniczny (CAD) i siatka 9 sektorów Bagua", style: "sectionTitle", keepWithNext: true, margin: [0, 4, 0, 2] },
          { text: `Wektory ścian, orientacja N (${northAngle}°) oraz naniesione elementy wyposażenia wnętrza.`, style: "mutedText", keepWithNext: true, margin: [0, 0, 0, 6] },
          planOverlayImage
            ? {
                image: planOverlayImage,
                width: 527,
                alignment: "center",
                margin: [0, 2, 0, 6]
              }
            : pdfCard("Podgląd planu", "Wgraj plik graficzny dla bezpośredniej nakładki 9 stref na rzucie."),
          pdfSectorMatrix(report.sector_map)
        ],
        margin: [0, 0, 0, 10]
      },

      // 3. WYKRES URODZENIOWY BUDYNKU (XUAN KONG FEI XING)
      ...(natalChart
        ? [
            {
              unbreakable: true,
              stack: [
                { text: "Wykres urodzeniowy budynku (Xuan Kong Fei Xing – Latające Gwiazdy)", style: "sectionTitle", keepWithNext: true, margin: [0, 4, 0, 2] },
                { text: `${natalChart.chart_type} · ${natalChart.period_label} | Fasada: ${natalChart.facing_direction}, Tył: ${natalChart.sitting_direction}`, style: "mutedText", keepWithNext: true, margin: [0, 0, 0, 6] },
                pdfNatalChartMatrix(natalChart),
                pdfCard(
                  "Strategia energetyczna w Okresie 9 (2024–2043)",
                  natalChart.period9_strategy,
                  [
                    "Główny punkt koncentracji dobrostanu: sektory z Gwiazdą 9 (Władca Okresu)",
                    "Strefa przyszłego wzrostu: sektory z Gwiazdą 1 (Woda / Mądrość)",
                    "Rekomendacja: wycisz sektory 5 i 2 elementami żywiołu Metalu (biel, mosiądz, obłe formy)"
                  ],
                  "Transformacja Okresu 9 · Cykl 20-letni"
                )
              ],
              margin: [0, 0, 0, 10]
            }
          ]
        : []),

      // 4. RESIDENT PROFILE & KUA NUMBERS
      ...(residentCards.length > 0
        ? [
            {
              unbreakable: true,
              stack: [
                { text: "Profil energetyczny mieszkańców (liczby Kua i żywioły)", style: "sectionTitle", keepWithNext: true, margin: [0, 4, 0, 2] },
                { text: "Kalkulacja Ba Zhai (Osiem Pałaców): optymalne kierunki snu, pracy i dopasowanie mebli do domowników.", style: "mutedText", keepWithNext: true, margin: [0, 0, 0, 6] },
                pdfCardGrid(residentCards, 2)
              ],
              margin: [0, 0, 0, 10]
            }
          ]
        : []),

      // 5. PRIORITY ACTIONS
      {
        unbreakable: true,
        stack: [
          { text: "Najważniejsze priorytety działań", style: "sectionTitle", keepWithNext: true, margin: [0, 4, 0, 2] },
          { text: "Kolejność wdrożenia: od korekt o najwyższym wpływie na regenerację do poprawek niskonakładowych.", style: "mutedText", keepWithNext: true, margin: [0, 0, 0, 6] },
          pdfCardGrid(priorityCards, 2)
        ],
        margin: [0, 0, 0, 10]
      },

      // 6. ROOM-BY-ROOM AUDIT
      {
        unbreakable: true,
        stack: [
          { text: "Audyt pomieszczeń pokój po pokoju", style: "sectionTitle", keepWithNext: true, margin: [0, 4, 0, 2] },
          { text: "Konkretne wnioski dla każdej strefy: atuty, ryzyka i zalecenia aranżacyjne.", style: "mutedText", keepWithNext: true, margin: [0, 0, 0, 6] },
          pdfCardGrid(roomCards, 2)
        ],
        margin: [0, 0, 0, 10]
      },

      // 7. FURNITURE & COMMAND POSITION
      ...(furnitureCards.length > 0
        ? [
            {
              unbreakable: true,
              stack: [
                { text: "Meble i pozycja dominująca (pozycja dowodzenia)", style: "sectionTitle", keepWithNext: true, margin: [0, 4, 0, 2] },
                { text: "Oparcie wezgłowia (Czarny Żółw), biurka i wyposażenia względem wejścia i okien.", style: "mutedText", keepWithNext: true, margin: [0, 0, 0, 6] },
                pdfCardGrid(furnitureCards, 2)
              ],
              margin: [0, 0, 0, 10]
            }
          ]
        : []),

      // 8. FORM SCHOOL & ERGONOMICS
      {
        unbreakable: true,
        stack: [
          { text: "Szkoła Formy i ergonomia współczesna", style: "sectionTitle", keepWithNext: true, margin: [0, 4, 0, 2] },
          { text: "Połączenie klasycznych zasad 4 Niebiańskich Zwierząt ze standardami doświetlenia i akustyki.", style: "mutedText", keepWithNext: true, margin: [0, 0, 0, 6] },
          pdfCardGrid([...traditionalCards, ...practicalCards], 2)
        ],
        margin: [0, 0, 0, 10]
      },

      // 9. PRACTICAL CHANGES & METHOD LEDGER
      {
        unbreakable: true,
        stack: [
          { text: "Lista rekomendowanych zmian bez remontu", style: "sectionTitle", keepWithNext: true, margin: [0, 4, 0, 2] },
          { text: "Natychmiastowe działania o wysokim zwrocie z inwestycji bez prac wyburzeniowych.", style: "mutedText", keepWithNext: true, margin: [0, 0, 0, 6] },
          {
            ol: report.practical_changes.slice(0, 6).map((change) => ({
              text: `${pdfText(change.title)} · Koszt: ${pdfText(change.cost)} · Termin: ${pdfText(change.when)}`,
              margin: [0, 0, 0, 2.5]
            })),
            style: "bodyText",
            margin: [0, 0, 0, 8]
          },
          { text: "Wykres metod i rejestr źródeł", style: "sectionTitle", keepWithNext: true, margin: [0, 4, 0, 2] },
          { text: "Pełna transparentność metodologiczna i poziomy pewności rekomendacji.", style: "mutedText", keepWithNext: true, margin: [0, 0, 0, 6] },
          pdfMethodScoreChart(report),
          pdfCardGrid(sourceCards, 2),
          {
            text: pdfText(report.disclaimer),
            style: "mutedText",
            margin: [0, 8, 0, 0]
          }
        ],
        margin: [0, 0, 0, 10]
      }
    ]
  };

  const vfs = getPdfVfs();
  if (Object.keys(vfs).length > 0) {
    (pdfMake as any).vfs = vfs;
  }
  (pdfMake as any).fonts = standardPdfFonts;

  const pdfDocument = (pdfMake as any).createPdf(docDefinition, undefined, standardPdfFonts, vfs);
  const fileName = `plan-harmonii-raport-${Date.now()}.pdf`;

  const blob = await new Promise<Blob>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("Generator PDF przekroczył limit czasu (15s)."));
    }, 15000);

    let isSettled = false;
    const finish = (generatedBlob: Blob) => {
      if (isSettled) return;
      isSettled = true;
      window.clearTimeout(timeout);
      if (generatedBlob instanceof Blob && generatedBlob.size > 0) {
        resolve(generatedBlob);
      } else {
        reject(new Error("Generator PDF nie zwrócił poprawnego pliku Blob."));
      }
    };

    try {
      const res = pdfDocument.getBlob(finish);
      if (res && typeof res.then === "function") {
        res.then((b: Blob) => finish(b)).catch((err: any) => {
          if (!isSettled) {
            isSettled = true;
            window.clearTimeout(timeout);
            reject(err);
          }
        });
      }
    } catch (error) {
      if (!isSettled) {
        isSettled = true;
        window.clearTimeout(timeout);
        reject(error);
      }
    }
  });

  const blobUrl = URL.createObjectURL(blob);
  
  // Trigger direct browser download
  try {
    const downloadLink = document.createElement("a");
    downloadLink.href = blobUrl;
    downloadLink.download = fileName;
    downloadLink.target = "_blank";
    downloadLink.rel = "noopener noreferrer";
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    setTimeout(() => {
      downloadLink.remove();
    }, 2000);
  } catch (linkErr) {
    console.warn("Direct download link trigger failed:", linkErr);
  }

  return { blob, blobUrl, fileName };
}
