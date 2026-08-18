import {
  type ChangeEvent,
  type CSSProperties,
  type Dispatch,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Compass,
  DatabaseZap,
  Download,
  FileUp,
  Layers3,
  Loader2,
  Maximize2,
  MousePointer2,
  RotateCcw,
  RotateCw,
  Sparkles,
  Trash2,
  UserRound,
  X
} from "lucide-react";
import { methods, pricePlans, propertyTypes, type PropertyKey } from "./data";
import type { AuditReport, AuditRequestPayload, ResidentProfile } from "./auditTypes";
import {
  createPlanSectorOverlayImage,
  downloadReportJson,
  downloadReportPdf,
  fileToPayload,
  generateAuditReport,
  inferMimeType,
  persistAuditIntake,
  validateAuditFiles
} from "./lib/auditClient";
import { triggerBrandConfetti } from "./lib/confetti";
import { calculateKua, type KuaResult } from "./lib/kuaEngine";
import { getBuildingPeriod } from "./lib/natalChartEngine";
import type { PlanMarker } from "./auditTypes";

const purposeOptions = [
  { value: "zakup", label: "Zakup mieszkania lub domu" },
  { value: "najem", label: "Najem / decyzja szybka" },
  { value: "remont", label: "Remont i ustawienie funkcji" },
  { value: "praca", label: "Biuro, gabinet lub lokal" },
  { value: "porownanie", label: "Porównanie kilku nieruchomości" }
];

const selectedMethods = [
  "Forma",
  "Kompas",
  "Bagua",
  "Pięć elementów",
  "Kua / Gua",
  "Ergonomia i światło"
];

const roomFunctionOptions = [
  "Salon",
  "Kuchnia",
  "Jadalnia",
  "Sypialnia",
  "Pokój dziecka",
  "Gabinet",
  "Łazienka/WC",
  "Hol/korytarz",
  "Garderoba",
  "Balkon/taras"
];

const fixedElementOptions = [
  "Wejście główne",
  "Drzwi wewnętrzne",
  "Okno",
  "Drzwi balkonowe/taras",
  "Schody",
  "Piony instalacyjne",
  "Ściany nośne",
  "Kominek"
];

const furnitureOptions = [
  "Łóżko",
  "Biurko",
  "Lustro",
  "Sofa",
  "Stół",
  "Płyta/kuchenka",
  "Regał/szafa",
  "Miejsce pracy",
  "Recepcja/kasa"
];

const previewablePlanTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

const annotationModes = [
  { key: "furniture", label: "Meble & Wyposażenie", hint: "łóżko, biurko, lustro, sofa" },
  { key: "fixed", label: "Punkty stałe", hint: "wejście, okno, schody" },
  { key: "room", label: "Pomieszczenia", hint: "sypialnia, salon, kuchnia" }
] as const;

type AnnotationMode = (typeof annotationModes)[number]["key"];
type ScanTool = "north" | "marker";

const furnitureOrientationRoles: Record<string, string[]> = {
  "Łóżko": ["strona głowy / wezgłowie"],
  "Biurko": ["kierunek patrzenia osoby siedzącej", "strona pleców osoby siedzącej"],
  "Lustro": ["kierunek odbicia tafli lustra", "plecy / ściana za lustrem"],
  "Sofa": ["kierunek patrzenia osoby siedzącej na sofie", "oparcie sofy"],
  "Stół": ["główne miejsce siedzenia", "dłuższa oś stołu"],
  "Płyta/kuchenka": ["kierunek podejścia osoby do płyty/kuchenki", "front osoby gotującej", "ściana za płytą/kuchenką"],
  "Kuchenka": ["front osoby gotującej", "ściana za kuchenką"],
  "Regał/szafa": ["front mebla / drzwi", "plecy mebla"],
  "Miejsce pracy": ["kierunek patrzenia osoby siedzącej", "strona pleców osoby siedzącej"],
  "Recepcja/kasa": ["kierunek obsługi klienta", "strona pleców osoby obsługującej"]
};

const AUDIT_DRAFT_STORAGE_KEY = "planHarmonii:auditDraft:v1";

type AuditBuilderProps = {
  propertyKey: PropertyKey;
  setPropertyKey: (value: PropertyKey) => void;
  selectedPlan: string;
  setSelectedPlan: (value: string) => void;
};

type AuditForm = {
  email: string;
  levelsCount: string;
  usableAreaM2: string;
  purpose: string;
  addressNote: string;
  orientationNote: string;
  entryNote: string;
  roomFunctionNote: string;
  fixedElementNote: string;
  furnitureNote: string;
  constructionYear: string;
  firstOccupiedYear: string;
  moveInDate: string;
  renovationYear: string;
  renovationNote: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  formulaCategory: string;
  constraintsNote: string;
  profileNote: string;
  consentMarketing: boolean;
};

type ResidentProfileForm = ResidentProfile & {
  id: string;
};

function initialLevels(propertyKey: PropertyKey) {
  return propertyKey === "multi" || propertyKey === "house" ? "2" : "1";
}

function createResidentProfile(index: number, values: Partial<ResidentProfileForm> = {}): ResidentProfileForm {
  return {
    id: values.id ?? `resident-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: values.label ?? (index === 1 ? "Główny domownik" : `Mieszkaniec ${index}`),
    role: values.role ?? "",
    birthDate: values.birthDate ?? "",
    birthTime: values.birthTime ?? "",
    birthPlace: values.birthPlace ?? "",
    gender: values.gender ?? "male",
    assignedFurniture: values.assignedFurniture ?? [],
    formulaCategory: values.formulaCategory ?? "kua-gua",
    note: values.note ?? ""
  };
}

function residentHasData(profile: ResidentProfileForm) {
  const customLabel = profile.label.trim().length > 0 && !/^Mieszkaniec \d+$/i.test(profile.label.trim());

  return customLabel || [
    profile.role,
    profile.birthDate,
    profile.birthTime,
    profile.birthPlace,
    profile.formulaCategory,
    profile.note
  ].some((value) => value.trim().length > 0);
}

function residentPayloadFromProfiles(profiles: ResidentProfileForm[]) {
  return profiles
    .filter(residentHasData)
    .map(({ id: _id, ...profile }) => ({
      label: profile.label.trim(),
      role: profile.role.trim(),
      birthDate: profile.birthDate.trim(),
      birthTime: profile.birthTime.trim(),
      birthPlace: profile.birthPlace.trim(),
      gender: profile.gender || "male",
      assignedFurniture: profile.assignedFurniture || [],
      formulaCategory: profile.formulaCategory.trim(),
      note: profile.note.trim()
    }));
}

function confidenceLabel(value: AuditReport["confidence"]) {
  if (value === "high") return "wysoka";
  if (value === "medium") return "średnia";
  return "niska";
}

function reportModeLabel(report: AuditReport) {
  if (report.ai_mode === "live") return "Raport gotowy";
  if (report.ai_model.includes("raport regułowy")) return "Raport regułowy · generator chwilowo niedostępny";
  return "Raport regułowy do testów produktu";
}

function normalizeAngle(value: number) {
  return ((Math.round(value) % 360) + 360) % 360;
}

function scanDirectionLabel(angle: number) {
  const normalized = normalizeAngle(angle);

  if (normalized >= 338 || normalized <= 22) return "góra skanu (górna ściana, 0°)";
  if (normalized <= 67) return "prawy górny róg (45°)";
  if (normalized <= 112) return "prawa strona (prawa ściana, 90°)";
  if (normalized <= 157) return "prawy dolny róg (135°)";
  if (normalized <= 202) return "dół skanu (dolna ściana, 180°)";
  if (normalized <= 247) return "lewy dolny róg (225°)";
  if (normalized <= 292) return "lewa strona (lewa ściana, 270°)";
  return "lewy górny róg (315°)";
}

function defaultFurnitureOrientationRole(label: string) {
  return furnitureOrientationRoles[label]?.[0] ?? "kierunek ustawienia";
}

function furnitureOrientationNote(label: string, _role: string, direction: number, assignedResident?: string | null) {
  const normalized = normalizeAngle(direction);
  const residentSuffix = assignedResident ? ` (domownik: ${assignedResident})` : "";
  return `${label}${residentSuffix} · ${normalized}°`;
}

function furnitureDirectionHelp(_label: string) {
  return "Dopasuj kąt obrotu mebla do układu ścian na rzucie.";
}

function furnitureDirectionControlLabel(_label: string) {
  return "Obrót mebla";
}

function markerCountText(count: number) {
  if (count === 1) return "1 marker na planie";
  if (count >= 2 && count <= 4) return `${count} markery na planie`;
  return `${count} markerów na planie`;
}

function markerDisplayCode(marker: PlanMarker, markers: PlanMarker[], fallbackIndex = 0) {
  const prefix = marker.category === "room" ? "P" : marker.category === "fixed" ? "S" : "M";
  const markerIndex = markers.findIndex((candidate) => candidate.id === marker.id);

  if (markerIndex >= 0) {
    const ordinal = markers.slice(0, markerIndex + 1).filter((candidate) => candidate.category === marker.category).length;
    return `${prefix}${ordinal}`;
  }

  return `${prefix}${fallbackIndex + 1}`;
}

function markerDetailText(marker: PlanMarker) {
  return (marker.orientationNote ?? marker.label).replace(/[.!?]+$/, "");
}

function markerShortLabel(marker: PlanMarker) {
  const aliases: Record<string, string> = {
    "Łazienka/WC": "Łaz.",
    "Hol/korytarz": "Hol",
    "Pokój dziecka": "Dziecko",
    "Wejście główne": "Wej.",
    "Drzwi wewnętrzne": "Drzwi",
    "Drzwi balkonowe/taras": "Taras",
    "Piony instalacyjne": "Piony",
    "Ściany nośne": "Śc.",
    "Płyta/kuchenka": "Płyta",
    "Regał/szafa": "Szafa",
    "Miejsce pracy": "Praca",
    "Recepcja/kasa": "Kasa"
  };
  const base = aliases[marker.label] ?? marker.label.replace("/WC", "");
  const resident = marker.assignedResidentLabel ? ` · ${marker.assignedResidentLabel.split(" ")[0]}` : "";
  const full = `${base}${resident}`;
  return full.length > 14 ? `${full.slice(0, 13).trim()}...` : full;
}

function markerCategoryLabel(marker: PlanMarker) {
  if (marker.category === "room") return "pomieszczenie";
  if (marker.category === "fixed") return "stały punkt";
  return "mebel";
}

function annotationHelpText(mode: AnnotationMode) {
  if (mode === "room") {
    return "To jest funkcja całej przestrzeni: salon, kuchnia, łazienka, sypialnia, gabinet.";
  }

  if (mode === "fixed") {
    return "To są elementy planu, których zwykle nie przestawiasz: wejście, okno, schody, piony, ściany.";
  }

  return "To są meble i wyposażenie, przy których liczy się dokładny kierunek osoby, frontu albo oparcia.";
}

function getResidentInitials(labelOrName: string | null | undefined): string {
  if (!labelOrName) return "";
  const cleaned = labelOrName.trim();
  if (cleaned.toLowerCase().includes("główny")) return "G";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function furnitureSymbolClass(label: string) {
  if (label === "Łóżko") return "bed";
  if (label === "Biurko" || label === "Miejsce pracy") return "desk";
  if (label === "Lustro") return "mirror";
  if (label === "Sofa") return "sofa";
  if (label === "Stół") return "table";
  if (label === "Płyta/kuchenka" || label === "Kuchenka") return "stove";
  if (label === "Regał/szafa") return "storage";
  if (label === "Recepcja/kasa") return "counter";
  return "generic";
}

function renderFurnitureSymbol(label: string) {
  const symbolClass = furnitureSymbolClass(label);

  if (symbolClass === "bed") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg bed-svg" aria-hidden="true">
        {/* Rama i materac łóżka - jasny kremowy len */}
        <rect x="13" y="10" width="46" height="54" rx="3" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="2" />
        {/* Solidne drewniane wezgłowie na górze (oparte o ścianę) */}
        <rect x="11" y="5" width="50" height="7" rx="1.5" fill="#C49544" stroke="#1A2B27" strokeWidth="1.8" />
        {/* Dwie miękkie białe poduszki przy wezgłowiu */}
        <rect x="16" y="14" width="17" height="12" rx="2" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.4" />
        <rect x="39" y="14" width="17" height="12" rx="2" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.4" />
        {/* Wywinięte prześcieradło */}
        <rect x="13" y="28" width="46" height="6" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.2" />
        {/* Ciepła narzuta / kołdra z przeszyciem */}
        <path d="M 13 34 L 59 34 L 59 64 L 13 64 Z" fill="#E8E2D5" stroke="#1A2B27" strokeWidth="1.6" />
        <line x1="13" y1="48" x2="59" y2="48" stroke="#C49544" strokeWidth="1.5" strokeDasharray="3 2" />
      </svg>
    );
  }

  if (symbolClass === "desk") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg desk-svg" aria-hidden="true">
        {/* Blat biurka - jasne naturalne drewno */}
        <rect x="10" y="8" width="52" height="28" rx="2" fill="#F4EFE6" stroke="#1A2B27" strokeWidth="2" />
        {/* Monitor ultra-wide na środku blatu */}
        <rect x="22" y="12" width="28" height="4.5" rx="1" fill="#1A2B27" stroke="#C49544" strokeWidth="1" />
        <rect x="32" y="16.5" width="8" height="2" fill="#C49544" />
        {/* Klawiatura i podkładka */}
        <rect x="25" y="22" width="22" height="6" rx="1" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1" />
        {/* Fotel biurowy obrotowy (człowiek siedzi tyłem do dołu, patrząc w monitor w górę) */}
        {/* Podstawa 5-ramienna fotela */}
        <circle cx="36" cy="51" r="5" fill="#C49544" stroke="#1A2B27" strokeWidth="1.2" />
        {/* Siedzisko fotela */}
        <rect x="24" y="42" width="24" height="18" rx="4" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.8" />
        {/* Oparcie pleców fotela */}
        <path d="M 18 57 Q 36 63 54 57" stroke="#1A2B27" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M 18 57 Q 36 63 54 57" stroke="#C49544" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Podłokietniki */}
        <rect x="18" y="44" width="4" height="12" rx="1.5" fill="#C49544" stroke="#1A2B27" strokeWidth="1" />
        <rect x="50" y="44" width="4" height="12" rx="1.5" fill="#C49544" stroke="#1A2B27" strokeWidth="1" />
      </svg>
    );
  }

  if (symbolClass === "mirror") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg mirror-svg" aria-hidden="true">
        {/* Ścienna rama montażowa lustra */}
        <rect x="8" y="7" width="56" height="6.5" rx="1.5" fill="#C49544" stroke="#1A2B27" strokeWidth="1.8" />
        {/* Błyszcząca tafla lustra z blikiem */}
        <rect x="10" y="8" width="52" height="4.5" rx="1" fill="#73A8C7" />
        <line x1="16" y1="10" x2="56" y2="10" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
        {/* Stożek odbicia światła i energii Qi w głąb pokoju */}
        <path d="M 14 14 L 4 64 L 68 64 L 58 14 Z" fill="rgba(115, 168, 199, 0.22)" stroke="#73A8C7" strokeWidth="1.5" strokeDasharray="3 3" />
        {/* Promień osiowy odbicia */}
        <line x1="36" y1="14" x2="36" y2="58" stroke="#C49544" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="36" cy="40" r="3.5" fill="#C49544" stroke="#1A2B27" strokeWidth="1" />
      </svg>
    );
  }

  if (symbolClass === "sofa") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg sofa-svg" aria-hidden="true">
        {/* Główny korpus i podstawa kanapy */}
        <rect x="10" y="10" width="52" height="50" rx="4" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="2" />
        {/* Solidne, grube oparcie z tyłu na górze (oparte o ścianę) */}
        <rect x="10" y="8" width="52" height="14" rx="3" fill="#D4A757" stroke="#1A2B27" strokeWidth="1.8" />
        {/* Szwy ozdobne na oparciu */}
        <line x1="36" y1="8" x2="36" y2="22" stroke="#1A2B27" strokeWidth="1.2" strokeDasharray="2 2" />
        {/* Lewy i prawy wyściełany podłokietnik */}
        <rect x="8" y="10" width="8" height="48" rx="3" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="1.8" />
        <rect x="56" y="10" width="8" height="48" rx="3" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="1.8" />
        {/* Dwie głębokie, wygodne poduchy siedziska (otwarte ku dołowi - w tę stronę się siedzi!) */}
        <rect x="18" y="24" width="17" height="34" rx="3" fill="#EAE4D6" stroke="#1A2B27" strokeWidth="1.5" />
        <rect x="37" y="24" width="17" height="34" rx="3" fill="#EAE4D6" stroke="#1A2B27" strokeWidth="1.5" />
        {/* Przednia krawędź siedziska */}
        <line x1="16" y1="58" x2="56" y2="58" stroke="#C49544" strokeWidth="2" />
      </svg>
    );
  }

  if (symbolClass === "stove") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg stove-svg" aria-hidden="true">
        {/* Szklany blat płyty indukcyjnej */}
        <rect x="11" y="11" width="50" height="50" rx="4" fill="#243330" stroke="#C49544" strokeWidth="2" />
        {/* 4 pola grzewcze - białe pierścienie */}
        <circle cx="25" cy="25" r="8" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
        <circle cx="25" cy="25" r="3" fill="#C49544" />
        <circle cx="47" cy="25" r="9" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
        <circle cx="47" cy="25" r="4" fill="#C49544" />
        <circle cx="25" cy="47" r="7" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
        <circle cx="25" cy="47" r="2.5" fill="#C49544" />
        <circle cx="47" cy="47" r="8" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
        <circle cx="47" cy="47" r="3" fill="#C49544" />
        {/* Panel dotykowy sterowania */}
        <rect x="23" y="55" width="26" height="3" rx="1" fill="#C49544" />
      </svg>
    );
  }

  if (symbolClass === "table") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg table-svg" aria-hidden="true">
        {/* Blat stołu - jasny dąb */}
        <rect x="18" y="18" width="36" height="36" rx="3" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="2" />
        {/* Usłojenie / ozdoba środka */}
        <circle cx="36" cy="36" r="4.5" fill="none" stroke="#C49544" strokeWidth="1.4" />
        {/* 4 Krzesła dookoła stołu (widoczne zaokrąglone oparcia) */}
        {/* Krzesło góra */}
        <rect x="24" y="8" width="24" height="8" rx="2.5" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.5" />
        <line x1="24" y1="13" x2="48" y2="13" stroke="#C49544" strokeWidth="1.2" />
        {/* Krzesło dół */}
        <rect x="24" y="56" width="24" height="8" rx="2.5" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.5" />
        <line x1="24" y1="59" x2="48" y2="59" stroke="#C49544" strokeWidth="1.2" />
        {/* Krzesło lewo */}
        <rect x="8" y="24" width="8" height="24" rx="2.5" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.5" />
        <line x1="13" y1="24" x2="13" y2="48" stroke="#C49544" strokeWidth="1.2" />
        {/* Krzesło prawo */}
        <rect x="56" y="24" width="8" height="24" rx="2.5" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.5" />
        <line x1="59" y1="24" x2="59" y2="48" stroke="#C49544" strokeWidth="1.2" />
      </svg>
    );
  }

  if (symbolClass === "storage") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg storage-svg" aria-hidden="true">
        {/* Korpus szafy - jasne drewno */}
        <rect x="10" y="16" width="52" height="40" rx="2" fill="#F4EFE6" stroke="#1A2B27" strokeWidth="2" />
        {/* Prowadnice / podział skrzydeł drzwi */}
        <line x1="36" y1="16" x2="36" y2="56" stroke="#1A2B27" strokeWidth="1.5" />
        {/* Uchwyty meblowe w złotym kolorze */}
        <rect x="33" y="32" width="2" height="8" rx="0.5" fill="#C49544" stroke="#1A2B27" strokeWidth="0.8" />
        <rect x="37" y="32" width="2" height="8" rx="0.5" fill="#C49544" stroke="#1A2B27" strokeWidth="0.8" />
        {/* Front oznaczony złotą listwą */}
        <line x1="10" y1="16" x2="62" y2="16" stroke="#C49544" strokeWidth="2.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 72 72" className="arch-furniture-svg generic-svg" aria-hidden="true">
      <rect x="14" y="14" width="44" height="44" rx="4" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="2" />
      <path d="M 36 46 L 36 22 M 28 30 L 36 20 L 44 30" stroke="#C49544" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const markerStackOffsets = [
  [0, 0],
  [62, -42],
  [-62, -42],
  [62, 42],
  [-62, 42],
  [0, -62],
  [0, 62]
] as const;

function markerStackOffset(marker: PlanMarker, markers: PlanMarker[]) {
  const samePlaceMarkers = markers.filter((candidate) =>
    Math.abs(candidate.xPercent - marker.xPercent) < 0.8 &&
    Math.abs(candidate.yPercent - marker.yPercent) < 0.8
  );
  const stackIndex = Math.max(0, samePlaceMarkers.findIndex((candidate) => candidate.id === marker.id));
  const [x, y] = markerStackOffsets[stackIndex % markerStackOffsets.length];

  return { x, y, stackIndex };
}

function createMarkerId() {
  return `marker-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isAnnotationMode(value: unknown): value is AnnotationMode {
  return annotationModes.some((mode) => mode.key === value);
}

function isScanTool(value: unknown): value is ScanTool {
  return value === "north" || value === "marker";
}

function normalizeStringList(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : fallback;
}

function normalizeOptionList(value: unknown, fallback: string[], allowedOptions: readonly string[]) {
  const allowed = new Set(allowedOptions);
  const filtered = normalizeStringList(value, fallback).filter((item) => allowed.has(item));
  const normalized = filtered.length > 0 ? filtered : fallback.filter((item) => allowed.has(item));

  return Array.from(new Set(normalized));
}

function markerOptionsForMode(mode: AnnotationMode) {
  if (mode === "room") return roomFunctionOptions;
  if (mode === "fixed") return fixedElementOptions;
  return furnitureOptions;
}

function normalizePlanMarkers(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((value): value is PlanMarker => {
      if (!value || typeof value !== "object") return false;
      const marker = value as Partial<PlanMarker>;
      return (
        typeof marker.id === "string" &&
        typeof marker.label === "string" &&
        (marker.category === "room" || marker.category === "fixed" || marker.category === "furniture") &&
        Number.isFinite(Number(marker.xPercent)) &&
        Number.isFinite(Number(marker.yPercent))
      );
    })
    .map((marker) => {
      const category = marker.label === "Schody" && marker.category === "room" ? "fixed" : marker.category;
      const facingDeg = Number(marker.facingDeg);

      return {
        ...marker,
        category,
        xPercent: Math.max(0, Math.min(100, Number(marker.xPercent))),
        yPercent: Math.max(0, Math.min(100, Number(marker.yPercent))),
        facingDeg: category === "furniture" && Number.isFinite(facingDeg) ? normalizeAngle(facingDeg) : null,
        orientationRole: typeof marker.orientationRole === "string" ? marker.orientationRole : null,
        orientationNote: typeof marker.orientationNote === "string" ? marker.orientationNote : null
      };
    })
    .slice(-48);
}

function clearAuditDraft() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(AUDIT_DRAFT_STORAGE_KEY);
    window.localStorage.removeItem("planHarmonii:auditDraft:v1");
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch {
    // Ignore storage failures.
  }
}

// Natychmiastowe wyczyszczenie przy ładowaniu modułu
clearAuditDraft();

export function AuditBuilder({
  propertyKey,
  setPropertyKey,
  selectedPlan,
  setSelectedPlan
}: AuditBuilderProps) {
  const [form, setForm] = useState<AuditForm>({
    email: "",
    levelsCount: initialLevels(propertyKey),
    usableAreaM2: "",
    purpose: "zakup",
    addressNote: "",
    orientationNote: "",
    entryNote: "",
    roomFunctionNote: "",
    fixedElementNote: "",
    furnitureNote: "",
    constructionYear: "",
    firstOccupiedYear: "",
    moveInDate: "",
    renovationYear: "",
    renovationNote: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    formulaCategory: "",
    constraintsNote: "",
    profileNote: "",
    consentMarketing: false
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState<string | null>(null);
  const [northAngle, setNorthAngle] = useState(0);
  const [northConfirmed, setNorthConfirmed] = useState(false);
  const [isDraggingNorth, setIsDraggingNorth] = useState(false);
  const [isDraggingScanNorth, setIsDraggingScanNorth] = useState(false);
  const [scanTool, setScanTool] = useState<ScanTool>("north");
  const [isPlanExpanded, setIsPlanExpanded] = useState(false);
  const [roomFunctions, setRoomFunctions] = useState<string[]>(["Salon", "Kuchnia", "Sypialnia", "Łazienka/WC"]);
  const [fixedElements, setFixedElements] = useState<string[]>(["Wejście główne", "Okno"]);
  const [furnitureItems, setFurnitureItems] = useState<string[]>(["Łóżko", "Biurko", "Sofa"]);
  const [residentProfiles, setResidentProfiles] = useState<ResidentProfileForm[]>(() => [createResidentProfile(1)]);
  const [showResidentEditorInFurniture, setShowResidentEditorInFurniture] = useState(false);
  const [annotationMode, setAnnotationMode] = useState<AnnotationMode>("furniture");
  const [selectedMarkerLabel, setSelectedMarkerLabel] = useState("Łóżko");
  const [furnitureDirection, setFurnitureDirection] = useState(0);
  const [furnitureScale, setFurnitureScale] = useState(1.0);
  const [furnitureOrientationRole, setFurnitureOrientationRole] = useState(defaultFurnitureOrientationRole("Łóżko"));
  const [planMarkers, setPlanMarkers] = useState<PlanMarker[]>([]);
  const [selectedPlanMarkerId, setSelectedPlanMarkerId] = useState<string | null>(null);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "reading" | "generating" | "saving" | "ready">("idle");
  const [persistenceMessage, setPersistenceMessage] = useState<string | null>(null);
  const northDialRef = useRef<HTMLDivElement | null>(null);
  const previousPropertyKeyRef = useRef(propertyKey);
  const planImageRef = useRef<HTMLImageElement | null>(null);
  const suppressScanClickRef = useRef(false);
  const lastMarkerPointerTimeRef = useRef(0);
  const [schematicReportUrl, setSchematicReportUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (report && files[0]) {
      createPlanSectorOverlayImage(files[0], report, northAngle, planMarkers)
        .then((url) => {
          if (active && url) {
            setSchematicReportUrl(url);
          }
        })
        .catch((err) => console.warn("Schematic overlay rendering error:", err));
    } else {
      setSchematicReportUrl(null);
    }
    return () => {
      active = false;
    };
  }, [report, files, northAngle, planMarkers]);

  const activePlan = pricePlans.find((plan) => plan.id === selectedPlan) ?? pricePlans[1];
  const property = propertyTypes.find((item) => item.key === propertyKey) ?? propertyTypes[0];
  const isBusy = status === "reading" || status === "generating" || status === "saving";
  const northDialStyle = { "--north-angle": `${northAngle}deg` } as CSSProperties;
  const northSummary = `Północ wskazuje: ${scanDirectionLabel(northAngle)} (${northAngle}° względem góry pliku).`;
  const furnitureDirectionStyle = { "--furniture-angle": `${furnitureDirection}deg` } as CSSProperties;
  const hasVisualPreview = Boolean(
    previewUrl && (previewMimeType === "application/pdf" || previewablePlanTypes.has(previewMimeType ?? ""))
  );
  const activeMarkerOptions =
    annotationMode === "room"
      ? roomFunctionOptions
      : annotationMode === "fixed"
        ? fixedElementOptions
        : furnitureOptions;
  const selectedPlanMarkerIndex = planMarkers.findIndex((marker) => marker.id === selectedPlanMarkerId);
  const selectedPlanMarker = selectedPlanMarkerIndex >= 0 ? planMarkers[selectedPlanMarkerIndex] : null;
  const currentAnnotationMode =
    annotationModes.find((mode) => mode.key === annotationMode) ?? annotationModes[0];
  const activeScanLabel =
    scanTool === "north" ? "Północ na skanie" : `${currentAnnotationMode.label}: ${selectedMarkerLabel}`;
  const activeScanHint =
    scanTool === "north"
      ? "Kliknij albo przeciągnij po samym planie, a potem użyj przycisku zatwierdzenia na planie."
      : annotationMode === "furniture"
        ? `${selectedMarkerLabel}: ustaw kierunek i kliknij miejsce na planie.`
        : annotationMode === "fixed"
          ? `${selectedMarkerLabel}: oznacz punkt stały. Możesz kliknąć istniejący marker, aby dodać punkt w tym samym miejscu.`
          : `${selectedMarkerLabel}: kliknij plan albo istniejący marker, aby dodać funkcję w tym samym miejscu.`;
  const selectedMarkerSummary = selectedPlanMarker
    ? `Wybrany: ${markerDisplayCode(selectedPlanMarker, planMarkers, selectedPlanMarkerIndex)} · ${selectedPlanMarker.label}`
    : "Kliknij znacznik na planie, aby go edytować lub usunąć.";

  const filesSize = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files]
  );

  useEffect(() => {
    if (previousPropertyKeyRef.current === propertyKey) return;

    const previousDefault = initialLevels(previousPropertyKeyRef.current);
    const nextDefault = initialLevels(propertyKey);
    previousPropertyKeyRef.current = propertyKey;

    setForm((current) => ({
      ...current,
      levelsCount: current.levelsCount === previousDefault ? nextDefault : current.levelsCount
    }));
  }, [propertyKey]);

  useEffect(() => {
    // Upewnij się, że po odświeżeniu strony żaden stan z poprzedniego pomiaru nie zostaje przywrócony
    clearAuditDraft();
  }, []);

  useEffect(() => {
    const firstFile = files[0];
    if (!firstFile) {
      setPreviewUrl(null);
      setPreviewMimeType(null);
      return;
    }

    const url = URL.createObjectURL(firstFile);
    setPreviewUrl(url);
    setPreviewMimeType(inferMimeType(firstFile.name, firstFile.type));

    return () => URL.revokeObjectURL(url);
  }, [files]);

  useEffect(() => {
    if (!isPlanExpanded) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPlanExpanded(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isPlanExpanded]);

  function updateField<Key extends keyof AuditForm>(key: Key, value: AuditForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateResidentProfile(index: number, updates: Partial<ResidentProfileForm>) {
    setResidentProfiles((current) =>
      current.map((profile, profileIndex) => profileIndex === index ? { ...profile, ...updates } : profile)
    );
  }

  function addResidentProfile() {
    setResidentProfiles((current) => [...current, createResidentProfile(current.length + 1)]);
  }

  function removeResidentProfile(index: number) {
    setResidentProfiles((current) => {
      if (current.length <= 1) {
        return [createResidentProfile(1)];
      }

      return current.filter((_, profileIndex) => profileIndex !== index);
    });
  }

  function setNorthAngleValue(value: number) {
    setNorthAngle(normalizeAngle(value));
    setNorthConfirmed(false);
    setScanTool("north");
  }

  function confirmNorthDirection() {
    setNorthConfirmed(true);
    setScanTool("marker");
  }

  function setNorthFromClientPoint(clientX: number, clientY: number, target: HTMLDivElement) {
    const img = planImageRef.current;
    const rect = (img && img.clientWidth > 0 && img.clientHeight > 0) ? img.getBoundingClientRect() : target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = clientX - centerX;
    const y = clientY - centerY;
    const angle = Math.atan2(x, -y) * (180 / Math.PI);
    setNorthAngleValue(angle);
  }

  function setNorthFromPointer(event: PointerEvent<HTMLDivElement>) {
    setNorthFromClientPoint(event.clientX, event.clientY, event.currentTarget);
  }

  function handleNorthPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDraggingNorth(true);
    setNorthFromPointer(event);
  }

  function handleNorthPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (isDraggingNorth) {
      setNorthFromPointer(event);
    }
  }

  function handleNorthPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDraggingNorth(false);
  }

  function handleNorthKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setNorthAngleValue(northAngle + (event.shiftKey ? 15 : 1));
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setNorthAngleValue(northAngle - (event.shiftKey ? 15 : 1));
    }

    if (event.key === "Home") {
      event.preventDefault();
      setNorthAngleValue(0);
    }
  }

  function toggleChoice(value: string, setter: Dispatch<SetStateAction<string[]>>) {
    setter((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  function handleAnnotationModeChange(mode: AnnotationMode) {
    setAnnotationMode(mode);
    setScanTool("marker");
    setSelectedPlanMarkerId(null);
    const nextOptions =
      mode === "room" ? roomFunctionOptions : mode === "fixed" ? fixedElementOptions : furnitureOptions;
    setSelectedMarkerLabel(nextOptions[0]);
    if (mode === "furniture") {
      setFurnitureOrientationRole(defaultFurnitureOrientationRole(nextOptions[0]));
    }
  }

  function handleMarkerLabelSelect(label: string) {
    setSelectedMarkerLabel(label);
    setScanTool("marker");

    // If a marker of this label already exists, select it to move/rotate it instead of duplicating
    const existing = planMarkers.find((m) => m.label === label);
    if (existing) {
      setSelectedPlanMarkerId(existing.id);
      if (existing.category === "furniture") {
        setFurnitureDirection(existing.facingDeg ?? 0);
        setFurnitureOrientationRole(existing.orientationRole ?? defaultFurnitureOrientationRole(label));
      }
    } else {
      setSelectedPlanMarkerId(null);
      if (annotationMode === "furniture") {
        setFurnitureOrientationRole(defaultFurnitureOrientationRole(label));
      }
    }
  }

function getKuaDirectionFeedback(
  resident: ResidentProfileForm | undefined,
  directionDeg: number,
  furnitureLabel: string
) {
  if (!resident || !resident.birthDate) return null;
  const kua = calculateKua(resident.birthDate, resident.gender);
  if (!kua) return null;

  const normalized = normalizeAngle(directionDeg);
  const dirNames = ["Północ (N)", "Północny Wschód (NE)", "Wschód (E)", "Południowy Wschód (SE)", "Południe (S)", "Południowy Zachód (SW)", "Zachód (W)", "Północny Zachód (NW)"];
  const dirIndex = Math.round(normalized / 45) % 8;
  const currentDir = dirNames[dirIndex];

  const isShengChi = kua.shengChi.toLowerCase().includes(currentDir.slice(0, 4).toLowerCase());
  const isTianYi = kua.tianYi.toLowerCase().includes(currentDir.slice(0, 4).toLowerCase());
  const isYanNian = kua.yanNian.toLowerCase().includes(currentDir.slice(0, 4).toLowerCase());
  const isFuWei = kua.fuWei.toLowerCase().includes(currentDir.slice(0, 4).toLowerCase());

  if (isShengChi) {
    return {
      status: "optimal",
      title: `✨ Sheng Qi (Najwyższa Pomyślność & Sukces) dla: ${resident.label || "Mieszkaniec"}`,
      text: `${currentDir} to najsilniejszy kierunek generowania witalności i sukcesu. Doskonałe ustawienie ${furnitureLabel.toLowerCase()}!`
    };
  }
  if (isTianYi) {
    return {
      status: "optimal",
      title: `✨ Tian Yi (Niebiański Lekarz & Zdrowie) dla: ${resident.label || "Mieszkaniec"}`,
      text: `${currentDir} wzmacnia odporność i głęboki sen. Idealny kierunek wezgłowia łóżka!`
    };
  }
  if (isYanNian) {
    return {
      status: "optimal",
      title: `✨ Yan Nian (Długowieczność & Relacje) dla: ${resident.label || "Mieszkaniec"}`,
      text: `${currentDir} sprzyja stabilności emocjonalnej i trwałej harmonii partnerskiej.`
    };
  }
  if (isFuWei) {
    return {
      status: "optimal",
      title: `✨ Fu Wei (Spokój Wewnętrzny & Koncentracja) dla: ${resident.label || "Mieszkaniec"}`,
      text: `${currentDir} sprzyja nauce, medytacji i stabilnemu skupieniu przy pracy.`
    };
  }

  const matchInauspicious = kua.inauspicious.find((item) => item.toLowerCase().includes(currentDir.slice(0, 4).toLowerCase()));
  return {
    status: "warning",
    title: `⚠️ ${matchInauspicious || "Kierunek wymagający neutralizacji"} dla: ${resident.label || "Mieszkaniec"}`,
    text: `Kierunki sprzyjające dla Kua ${kua.kua} (${kua.group}): ${kua.shengChi}, ${kua.tianYi}, ${kua.yanNian}, ${kua.fuWei}.`
  };
}

  function updateSelectedFurnitureMarker(updates: {
    facingDeg?: number;
    scale?: number;
    orientationRole?: string;
    assignedResidentLabel?: string | null;
  }) {
    if (!selectedPlanMarkerId) return;

    setPlanMarkers((current) =>
      current.map((marker) => {
        if (marker.id !== selectedPlanMarkerId || marker.category !== "furniture") return marker;

        const nextFacingDeg = updates.facingDeg ?? marker.facingDeg ?? furnitureDirection;
        const nextScale = updates.scale !== undefined ? updates.scale : (marker.scale ?? furnitureScale);
        const nextOrientationRole =
          updates.orientationRole ?? marker.orientationRole ?? defaultFurnitureOrientationRole(marker.label);
        const nextAssignedResident =
          updates.assignedResidentLabel !== undefined
            ? updates.assignedResidentLabel
            : marker.assignedResidentLabel;

        return {
          ...marker,
          facingDeg: nextFacingDeg,
          scale: nextScale,
          orientationRole: nextOrientationRole,
          assignedResidentLabel: nextAssignedResident,
          orientationNote: furnitureOrientationNote(marker.label, nextOrientationRole, nextFacingDeg, nextAssignedResident)
        };
      })
    );
  }

  function setFurnitureDirectionValue(value: number) {
    const nextDirection = normalizeAngle(value);
    setFurnitureDirection(nextDirection);
    updateSelectedFurnitureMarker({ facingDeg: nextDirection });
  }

  function setFurnitureScaleValue(value: number) {
    const clamped = Math.round(Math.min(2.5, Math.max(0.5, value)) * 100) / 100;
    setFurnitureScale(clamped);
    updateSelectedFurnitureMarker({ scale: clamped });
  }

  function setFurnitureOrientationRoleValue(role: string) {
    setFurnitureOrientationRole(role);
    updateSelectedFurnitureMarker({ orientationRole: role });
  }

  function handlePlanMarkerSelect(marker: PlanMarker) {
    setSelectedPlanMarkerId(marker.id);
    setScanTool("marker");
    setAnnotationMode(marker.category);
    setSelectedMarkerLabel(marker.label);

    if (marker.category === "furniture") {
      setFurnitureDirection(marker.facingDeg ?? 0);
      setFurnitureOrientationRole(marker.orientationRole ?? defaultFurnitureOrientationRole(marker.label));
      setFurnitureScale(marker.scale ?? 1.0);
    }
  }

  function createPlanMarkerAtPercent(xPercent: number, yPercent: number) {
    const markerId = createMarkerId();
    const defaultResident = residentProfiles[0]?.label || null;
    const isSleepOrWork = selectedMarkerLabel === "Łóżko" || selectedMarkerLabel === "Biurko" || selectedMarkerLabel === "Miejsce pracy";
    const assignedResident = isSleepOrWork && residentProfiles.length === 1 ? defaultResident : null;

    const marker: PlanMarker = {
      id: markerId,
      label: selectedMarkerLabel,
      category: annotationMode,
      xPercent: Number(xPercent.toFixed(2)),
      yPercent: Number(yPercent.toFixed(2)),
      facingDeg: annotationMode === "furniture" ? furnitureDirection : null,
      scale: annotationMode === "furniture" ? furnitureScale : undefined,
      orientationRole: annotationMode === "furniture" ? furnitureOrientationRole : null,
      assignedResidentLabel: assignedResident,
      orientationNote: annotationMode === "furniture"
        ? furnitureOrientationNote(selectedMarkerLabel, furnitureOrientationRole, furnitureDirection, assignedResident)
        : null
    };

    setPlanMarkers((current) => [...current, marker].slice(-48));
    setSelectedPlanMarkerId(markerId);

    if (annotationMode === "room") {
      setRoomFunctions((current) => current.includes(selectedMarkerLabel) ? current : [...current, selectedMarkerLabel]);
    }

    if (annotationMode === "fixed") {
      setFixedElements((current) => current.includes(selectedMarkerLabel) ? current : [...current, selectedMarkerLabel]);
    }

    if (annotationMode === "furniture") {
      setFurnitureItems((current) => current.includes(selectedMarkerLabel) ? current : [...current, selectedMarkerLabel]);
    }
  }

  function addPlanMarkerAt(clientX: number, clientY: number, target: HTMLDivElement) {
    if (!hasVisualPreview) return;

    const img = planImageRef.current;
    const rect = (img && img.clientWidth > 0 && img.clientHeight > 0) ? img.getBoundingClientRect() : target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const xPercent = Math.max(1, Math.min(99, ((clientX - rect.left) / rect.width) * 100));
    const yPercent = Math.max(1, Math.min(99, ((clientY - rect.top) / rect.height) * 100));

    // If user already has a marker selected, MOVE that marker instead of duplicating it
    if (selectedPlanMarkerId) {
      setPlanMarkers((current) =>
        current.map((marker) =>
          marker.id === selectedPlanMarkerId
            ? { ...marker, xPercent: Number(xPercent.toFixed(2)), yPercent: Number(yPercent.toFixed(2)) }
            : marker
        )
      );
      return;
    }

    createPlanMarkerAtPercent(xPercent, yPercent);
  }

  function handlePlanMarkerClick(marker: PlanMarker, event?: MouseEvent) {
    lastMarkerPointerTimeRef.current = Date.now();
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    handlePlanMarkerSelect(marker);
  }

  function handleMarkerPointerDown(marker: PlanMarker, event: PointerEvent<HTMLButtonElement>) {
    lastMarkerPointerTimeRef.current = Date.now();
    event.stopPropagation();
    event.preventDefault();
    handlePlanMarkerSelect(marker);
    setDraggingMarkerId(marker.id);
    (event.currentTarget.parentElement as HTMLElement)?.setPointerCapture(event.pointerId);
  }

  function handleScanClick(event: MouseEvent<HTMLDivElement>) {
    if (Date.now() - lastMarkerPointerTimeRef.current < 450) return;
    if (suppressScanClickRef.current) {
      suppressScanClickRef.current = false;
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest(".plan-marker-wrapper, .plan-marker, .marker-floating-actions, .floating-north-compass, .north-plan-confirm, .action-btn, button")) return;
    if (scanTool !== "marker") return;
    addPlanMarkerAt(event.clientX, event.clientY, event.currentTarget);
  }

  function handleScanPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (Date.now() - lastMarkerPointerTimeRef.current < 450) return;
    if (suppressScanClickRef.current) return;
    const target = event.target as HTMLElement;
    if (target.closest(".plan-marker-wrapper, .plan-marker, .marker-floating-actions, .floating-north-compass, .north-plan-confirm, .action-btn, button")) return;
    if (scanTool !== "north" || !hasVisualPreview) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDraggingScanNorth(true);
    setNorthFromClientPoint(event.clientX, event.clientY, event.currentTarget);
  }

  function handleScanPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (draggingMarkerId) {
      const img = planImageRef.current;
      const rect = (img && img.clientWidth > 0 && img.clientHeight > 0) ? img.getBoundingClientRect() : event.currentTarget.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const xPercent = Math.max(1, Math.min(99, ((event.clientX - rect.left) / rect.width) * 100));
      const yPercent = Math.max(1, Math.min(99, ((event.clientY - rect.top) / rect.height) * 100));

      setPlanMarkers((current) =>
        current.map((marker) =>
          marker.id === draggingMarkerId
            ? { ...marker, xPercent: Number(xPercent.toFixed(2)), yPercent: Number(yPercent.toFixed(2)) }
            : marker
        )
      );
      return;
    }

    if (scanTool === "north" && isDraggingScanNorth) {
      setNorthFromClientPoint(event.clientX, event.clientY, event.currentTarget);
    }
  }

  function handleScanPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDraggingScanNorth(false);
    setDraggingMarkerId(null);
  }

  function removePlanMarker(markerId: string) {
    suppressScanClickRef.current = true;
    setPlanMarkers((current) => current.filter((marker) => marker.id !== markerId));
    setSelectedPlanMarkerId((current) => (current === markerId ? null : current));
    setTimeout(() => {
      suppressScanClickRef.current = false;
    }, 350);
  }

  function removeSelectedPlanMarker() {
    if (selectedPlanMarkerId) {
      removePlanMarker(selectedPlanMarkerId);
    }
  }

  function undoLastPlanMarker() {
    const lastMarker = planMarkers[planMarkers.length - 1];
    setPlanMarkers((current) => current.slice(0, -1));
    if (lastMarker?.id === selectedPlanMarkerId) {
      setSelectedPlanMarkerId(null);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    setFiles(selectedFiles);
    setNorthConfirmed(false);
    setScanTool("north");
    setSelectedPlanMarkerId(null);
    setIsPlanExpanded(false);
    setReport(null);
    setPersistenceMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPersistenceMessage(null);

    const fileError = validateAuditFiles(files);
    if (fileError) {
      setError(fileError);
      return;
    }

    if (!form.email.includes("@")) {
      setError("Podaj adres e-mail, żeby przypisać wejście i raport.");
      return;
    }

    const levelsCount = Number(form.levelsCount);
    if (!Number.isFinite(levelsCount) || levelsCount < 1 || levelsCount > 12) {
      setError("Liczba kondygnacji musi być między 1 a 12.");
      return;
    }

    try {
      setStatus("reading");
      const filePayloads = await Promise.all(files.map(fileToPayload));
      const usableAreaM2 = form.usableAreaM2 ? Number(form.usableAreaM2) : null;
      const orientationNote = [
        northConfirmed
          ? `Północ zatwierdzona na skanie: ${northAngle}° względem górnej krawędzi pliku; kierunek na skanie: ${scanDirectionLabel(northAngle)}.`
          : `Północ nie została zatwierdzona na skanie; nie używać warstw kompasowych jako mocnych wniosków.`,
        form.orientationNote.trim()
      ].filter(Boolean).join(" ");
      const normalizedRoomFunctions = normalizeOptionList(roomFunctions, [], roomFunctionOptions);
      const normalizedFixedElements = normalizeOptionList(fixedElements, [], fixedElementOptions);
      const normalizedFurnitureItems = normalizeOptionList(furnitureItems, [], furnitureOptions);
      const normalizedResidentProfiles = residentPayloadFromProfiles(residentProfiles);

      const payload: AuditRequestPayload = {
        email: form.email.trim(),
        planId: selectedPlan,
        propertyType: propertyKey,
        levelsCount,
        usableAreaM2: Number.isFinite(usableAreaM2) ? usableAreaM2 : null,
        purpose: form.purpose,
        addressNote: form.addressNote.trim(),
        orientationNote,
        entryNote: form.entryNote.trim(),
        constraintsNote: form.constraintsNote.trim(),
        profileNote: form.profileNote.trim(),
        orientationData: {
          northAngleDeg: northAngle,
          confirmed: northConfirmed,
          source: "manual_compass_dial",
          note: northConfirmed
            ? "Użytkownik obrócił wskazówkę północy względem wgranego planu i zatwierdził kierunek."
            : "Użytkownik nie zatwierdził północy na planie."
        },
        planAnnotations: {
          roomFunctions: normalizedRoomFunctions,
          fixedElements: normalizedFixedElements,
          markers: planMarkers,
          roomFunctionNote: form.roomFunctionNote.trim(),
          fixedElementNote: form.fixedElementNote.trim()
        },
        furnitureAnnotations: {
          keyPieces: normalizedFurnitureItems,
          furnitureNote: form.furnitureNote.trim()
        },
        buildingProfile: {
          constructionYear: form.constructionYear.trim(),
          firstOccupiedYear: form.firstOccupiedYear.trim(),
          moveInDate: form.moveInDate.trim(),
          majorRenovationYear: form.renovationYear.trim(),
          renovationNote: form.renovationNote.trim()
        },
        residentProfiles: normalizedResidentProfiles,
        selectedMethods,
        files: filePayloads
      };

      setStatus("generating");
      const result = await generateAuditReport(payload);
      setReport(result.report);

      setStatus("saving");
      const persistence = await persistAuditIntake({
        payload,
        report: result.report,
        consentMarketing: form.consentMarketing
      });
      setPersistenceMessage(persistence.reason);
      setStatus("ready");
      triggerBrandConfetti();
    } catch (submitError) {
      setStatus("idle");
      setError(submitError instanceof Error ? submitError.message : "Coś poszło nie tak podczas audytu.");
    }
  }

  function resetReport() {
    setReport(null);
    setError(null);
    setPersistenceMessage(null);
    setStatus("idle");
  }

  return (
    <section className="audit-builder" id="generator" aria-label="Generator płatnego audytu">
      <div className="audit-intro">
        <div>
          <span className="section-kicker">Generator</span>
          <h2>Przygotuj raport na podstawie realnego planu</h2>
        </div>
        <p>
          Ten krok zbiera dane, których nie wolno zgadywać: kondygnacje, orientację, wejście,
          funkcje pomieszczeń, ograniczenia zmian i cel decyzji. AI analizuje plan dopiero na tej
          podstawie.
        </p>
      </div>

      <div className={`audit-workbench${report ? " report-ready" : ""}`}>
        <form className="audit-form" onSubmit={handleSubmit}>
          <div className="audit-form-header">
            <div>
              <strong>{activePlan.title}</strong>
              <span>{activePlan.price}{activePlan.period ?? ""} · {property.title}</span>
            </div>
            <Sparkles size={22} />
          </div>

          <div className="form-row">
            <label>
              <span>E-mail do raportu</span>
              <input
                type="email"
                value={form.email}
                placeholder="adres@email.pl"
                onChange={(event) => updateField("email", event.target.value)}
              />
            </label>
            <label>
              <span>Metraż</span>
              <input
                type="number"
                min="10"
                max="2000"
                inputMode="decimal"
                value={form.usableAreaM2}
                placeholder="np. 72"
                onChange={(event) => updateField("usableAreaM2", event.target.value)}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              <span>Typ nieruchomości</span>
              <select value={propertyKey} onChange={(event) => setPropertyKey(event.target.value as PropertyKey)}>
                {propertyTypes.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Kondygnacje</span>
              <input
                type="number"
                min="1"
                max="12"
                value={form.levelsCount}
                onChange={(event) => updateField("levelsCount", event.target.value)}
              />
            </label>
          </div>

          <label>
            <span>Cel decyzji</span>
            <select value={form.purpose} onChange={(event) => updateField("purpose", event.target.value)}>
              {purposeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="file-picker">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.heif,application/pdf,image/png,image/jpeg,image/webp,image/heic,image/heif"
              multiple
              onChange={handleFileChange}
            />
            <FileUp size={24} />
            <strong>Dodaj plan PDF/JPG/PNG/HEIC</strong>
            <span>
              {files.length > 0
                ? `${files.length} plików · ${(filesSize / 1024 / 1024).toFixed(1)} MB`
                : "Obsługujemy PDF, JPG, PNG, WEBP, HEIC i HEIF · do 6 MB na plik"}
            </span>
          </label>

          {isPlanExpanded ? (
            <button
              type="button"
              className="plan-focus-backdrop"
              onClick={() => setIsPlanExpanded(false)}
              aria-label="Zamknij powiększony plan"
            />
          ) : null}

          <div
            className={`north-wizard${isPlanExpanded ? " plan-expanded" : ""}`}
            role={isPlanExpanded ? "dialog" : undefined}
            aria-modal={isPlanExpanded ? "true" : undefined}
          >
            {isPlanExpanded ? (
              <div className="plan-expanded-bar">
                <strong>Powiększony plan do oznaczania</strong>
                <button type="button" onClick={() => setIsPlanExpanded(false)}>
                  <X size={16} />
                  Wróć do formularza
                </button>
              </div>
            ) : null}

            <div className="form-section-title">
              <Compass size={20} />
              <div>
                <strong>Oznacz plan: północ, funkcje i meble</strong>
                <span>Najpierw ustaw kierunek N, potem wybierz pomieszczenie, punkt stały albo mebel.</span>
              </div>
            </div>

            <div className="north-steps" aria-label="Instrukcja ustawienia północy">
              <span>1. Otwórz kompas w telefonie.</span>
              <span>2. Obróć strzałkę N na planie.</span>
              <span>3. Wybierz typ znacznika.</span>
              <span>4. Kliknij miejsce na skanie.</span>
            </div>

            <div className="scan-workflow">
              <div className="scan-controls-pane">
                <div className="scan-tool-tabs" role="group" aria-label="Narzędzie pracy na skanie">
                <button
                  type="button"
                  className={scanTool === "north" ? "selected" : ""}
                  onClick={() => setScanTool("north")}
                >
                  <Compass size={15} />
                  <span>Północ</span>
                  <small>obróć N</small>
                </button>
                {annotationModes.map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    className={scanTool === "marker" && annotationMode === mode.key ? "selected" : ""}
                    onClick={() => handleAnnotationModeChange(mode.key)}
                  >
                    {mode.key === "room" ? <Layers3 size={15} /> : null}
                    {mode.key === "fixed" ? <MousePointer2 size={15} /> : null}
                    {mode.key === "furniture" ? <UserRound size={15} /> : null}
                    <span>{mode.label}</span>
                    <small>{mode.hint}</small>
                  </button>
                ))}
              </div>

              <div className="scan-active-state" aria-live="polite">
                <div>
                  <span>Aktywne narzędzie</span>
                  <strong>{activeScanLabel}</strong>
                </div>
                <small>{activeScanHint}</small>
                <div className="scan-active-actions">
                  {planMarkers.length > 0 ? (
                    <button
                      type="button"
                      className="plan-clear-button"
                      onClick={() => {
                        setPlanMarkers([]);
                        setSelectedPlanMarkerId(null);
                      }}
                      title="Usuń wszystkie znaczniki z planu"
                    >
                      <Trash2 size={14} />
                      <span>Wyczyść ({planMarkers.length})</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="plan-expand-button"
                    disabled={!hasVisualPreview}
                    onClick={() => setIsPlanExpanded((current) => !current)}
                  >
                    {isPlanExpanded ? <X size={15} /> : <Maximize2 size={15} />}
                    {isPlanExpanded ? "Zamknij" : "Powiększ plan"}
                  </button>
                </div>
              </div>

              {scanTool === "north" ? (
                <div className="north-controls">
                  <div
                    ref={northDialRef}
                    className={`north-dial-control${isDraggingNorth ? " dragging" : ""}${northConfirmed ? " confirmed" : ""}`}
                    style={northDialStyle}
                    role="slider"
                    tabIndex={0}
                    aria-label="Obróć wskazówkę północy"
                    aria-valuemin={0}
                    aria-valuemax={359}
                    aria-valuenow={northAngle}
                    onPointerDown={handleNorthPointerDown}
                    onPointerMove={handleNorthPointerMove}
                    onPointerUp={handleNorthPointerUp}
                    onPointerCancel={handleNorthPointerUp}
                    onKeyDown={handleNorthKeyDown}
                  >
                    <div className="north-dial-face">
                      <span className="north-mark mark-n">N</span>
                      <span className="north-mark mark-e">E</span>
                      <span className="north-mark mark-s">S</span>
                      <span className="north-mark mark-w">W</span>
                      <span className="north-hand"><span>N</span></span>
                      <span className="north-dial-center" />
                    </div>
                  </div>

                  <div className="north-reading">
                    <strong>{northSummary}</strong>
                    <span>{northConfirmed ? "Kierunek zatwierdzony dla raportu." : "Po ustawieniu kliknij zatwierdzenie."}</span>
                  </div>

                  <label className="north-slider">
                    <span>Precyzyjny obrót</span>
                    <input
                      type="range"
                      min="0"
                      max="359"
                      value={northAngle}
                      onChange={(event) => setNorthAngleValue(Number(event.target.value))}
                    />
                  </label>

                  <div className="north-presets" aria-label="Szybkie ustawienia wskazówki północy">
                    <button type="button" onClick={() => setNorthAngleValue(0)}>N u góry</button>
                    <button type="button" onClick={() => setNorthAngleValue(90)}>N po prawej</button>
                    <button type="button" onClick={() => setNorthAngleValue(180)}>N na dole</button>
                    <button type="button" onClick={() => setNorthAngleValue(270)}>N po lewej</button>
                  </div>

                  <button
                    type="button"
                    className={`north-confirm${northConfirmed ? " confirmed" : ""}`}
                    onClick={confirmNorthDirection}
                  >
                    <CheckCircle2 size={17} />
                    {northConfirmed ? "Północ zatwierdzona" : "Zatwierdź północ"}
                  </button>
                </div>
              ) : null}

              {scanTool === "marker" ? (
                <div className="marker-selection-panel">
                  <div className="marker-panel-heading">
                    <strong>
                      {annotationMode === "furniture"
                        ? "Wybierz mebel i jego kierunek"
                        : `Wybierz: ${currentAnnotationMode.label.toLocaleLowerCase("pl-PL")}`}
                    </strong>
                    <span>
                      {annotationMode === "furniture"
                        ? "Marker zapisze kierunek osoby, front, stronę głowy albo oparcie."
                        : annotationHelpText(annotationMode)}
                    </span>
                  </div>

                  <div className={`choice-grid${annotationMode === "furniture" ? " furniture-choice-grid" : ""}`} role="group" aria-label="Wybór etykiety markera">
                    {activeMarkerOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={annotationMode === "furniture" ? `furniture-tool-btn${selectedMarkerLabel === option ? " selected" : ""}` : selectedMarkerLabel === option ? "selected" : ""}
                        onClick={() => handleMarkerLabelSelect(option)}
                      >
                        {annotationMode === "furniture" ? (
                          <span className="furniture-tool-icon" aria-hidden="true">
                            {renderFurnitureSymbol(option)}
                          </span>
                        ) : null}
                        <span className="furniture-tool-name">{option}</span>
                      </button>
                    ))}
                  </div>

                  {annotationMode === "furniture" ? (
                    <div className="furniture-direction" style={furnitureDirectionStyle}>
                      <label>
                        <span>{furnitureDirectionControlLabel(selectedMarkerLabel)}</span>
                        <select
                          value={furnitureOrientationRole}
                          onChange={(event) => setFurnitureOrientationRoleValue(event.target.value)}
                        >
                          {(furnitureOrientationRoles[selectedMarkerLabel] ?? [defaultFurnitureOrientationRole(selectedMarkerLabel)]).map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </label>
                      <label className="north-slider">
                        <span>{furnitureOrientationRole}: {scanDirectionLabel(furnitureDirection)} ({furnitureDirection}°)</span>
                        <input
                          type="range"
                          min="0"
                          max="359"
                          value={furnitureDirection}
                          onChange={(event) => setFurnitureDirectionValue(Number(event.target.value))}
                        />
                        <span className="furniture-direction-preview" aria-hidden="true">
                          {renderFurnitureSymbol(selectedMarkerLabel)}
                        </span>
                      </label>
                      <div className="furniture-presets" aria-label="Szybkie ustawienia kierunku mebla">
                        <button type="button" onClick={() => setFurnitureDirectionValue(0)}>0° W górę</button>
                        <button type="button" onClick={() => setFurnitureDirectionValue(90)}>90° W prawo</button>
                        <button type="button" onClick={() => setFurnitureDirectionValue(180)}>180° W dół</button>
                        <button type="button" onClick={() => setFurnitureDirectionValue(270)}>270° W lewo</button>
                        <button type="button" onClick={() => setFurnitureDirectionValue(((furnitureDirection - 45) + 360) % 360)}>↺ -45°</button>
                        <button type="button" onClick={() => setFurnitureDirectionValue((furnitureDirection + 45) % 360)}>↻ +45°</button>
                      </div>

                      <div className="furniture-scale-box">
                        <label className="north-slider">
                          <div className="furniture-scale-header">
                            <span>Rozmiar mebla: <strong>{Math.round(furnitureScale * 100)}%</strong></span>
                            <span className="scale-size-badge">
                              {furnitureScale >= 1.6 ? "XL · Bardzo duży" : furnitureScale >= 1.25 ? "L · Duży" : furnitureScale <= 0.75 ? "S · Kompaktowy" : "M · Standard"}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="2.2"
                            step="0.05"
                            value={furnitureScale}
                            onChange={(event) => setFurnitureScaleValue(Number(event.target.value))}
                          />
                        </label>
                        <div className="scale-presets-grid" aria-label="Szybkie rozmiary mebla">
                          <button type="button" className={furnitureScale === 0.7 ? "selected" : ""} onClick={() => setFurnitureScaleValue(0.7)}>S (70%)</button>
                          <button type="button" className={furnitureScale === 1.0 ? "selected" : ""} onClick={() => setFurnitureScaleValue(1.0)}>M (100%)</button>
                          <button type="button" className={furnitureScale === 1.3 ? "selected" : ""} onClick={() => setFurnitureScaleValue(1.3)}>L (130%)</button>
                          <button type="button" className={furnitureScale === 1.6 ? "selected" : ""} onClick={() => setFurnitureScaleValue(1.6)}>XL (160%)</button>
                          <button type="button" className={furnitureScale === 2.0 ? "selected" : ""} onClick={() => setFurnitureScaleValue(2.0)}>2XL (200%)</button>
                        </div>
                      </div>
                      {(selectedMarkerLabel === "Łóżko" || selectedMarkerLabel === "Biurko" || selectedMarkerLabel === "Miejsce pracy") ? (
                        <div className="furniture-resident-box">
                          <div className="furniture-resident-header">
                            <label className="resident-picker-label">
                              <span className="resident-picker-title">
                                <UserRound size={14} />
                                <span>Przypisany domownik:</span>
                              </span>
                              <select
                                value={
                                  (selectedPlanMarkerId
                                    ? planMarkers.find((m) => m.id === selectedPlanMarkerId)?.assignedResidentLabel
                                    : "") ?? ""
                                }
                                onChange={(event) => {
                                  const residentLabel = event.target.value;
                                  if (selectedPlanMarkerId) {
                                    updateSelectedFurnitureMarker({ assignedResidentLabel: residentLabel || null });
                                  }
                                }}
                              >
                                <option value="">-- Wszyscy domownicy / brak przypisania --</option>
                                {residentProfiles.map((res, rIdx) => {
                                  const kua = calculateKua(res.birthDate, res.gender);
                                  const name = res.label || `Mieszkaniec ${rIdx + 1}`;
                                  return (
                                    <option key={res.id} value={name}>
                                      {name} {kua ? `· Kua ${kua.kua} (${kua.element} · ${kua.group})` : " (uzupełnij datę ur.)"}
                                    </option>
                                  );
                                })}
                              </select>
                            </label>

                            <button
                              type="button"
                              className="resident-manage-toggle-btn"
                              onClick={() => setShowResidentEditorInFurniture((prev) => !prev)}
                            >
                              {showResidentEditorInFurniture ? "✕ Zwiń edycję" : "✏️ Zdefiniuj domowników & Kua"}
                            </button>
                          </div>

                          {showResidentEditorInFurniture ? (
                            <div className="inline-resident-editor">
                              <div className="inline-resident-editor-head">
                                <strong>Daty urodzenia & Płeć do kalkulacji Kua:</strong>
                                <small>Wprowadź dane, aby system automatycznie obliczył Liczbę Kua i najlepsze kierunki wezgłowia / biurka.</small>
                              </div>

                              {residentProfiles.map((res, rIdx) => {
                                const kua = calculateKua(res.birthDate, res.gender);
                                return (
                                  <div key={res.id} className="inline-resident-card">
                                    <div className="inline-resident-inputs">
                                      <label>
                                        <span>Imię / Rola:</span>
                                        <input
                                          type="text"
                                          value={res.label}
                                          placeholder={`Mieszkaniec ${rIdx + 1}`}
                                          onChange={(e) => updateResidentProfile(rIdx, { label: e.target.value })}
                                        />
                                      </label>
                                      <label>
                                        <span>Data urodzenia:</span>
                                        <input
                                          type="date"
                                          value={res.birthDate}
                                          onChange={(e) => updateResidentProfile(rIdx, { birthDate: e.target.value })}
                                        />
                                      </label>
                                      <label>
                                        <span>Płeć:</span>
                                        <select
                                          value={res.gender}
                                          onChange={(e) => updateResidentProfile(rIdx, { gender: e.target.value as "female" | "male" })}
                                        >
                                          <option value="female">Kobieta</option>
                                          <option value="male">Mężczyzna</option>
                                        </select>
                                      </label>
                                    </div>

                                    {kua ? (
                                      <div className="inline-kua-summary">
                                        <div className="kua-badge-pill">
                                          <strong>Liczba Kua: {kua.kua}</strong> · {kua.element} · {kua.group}
                                        </div>
                                        <div className="kua-dir-row">
                                          <span className="kua-dir-fav">✅ Korzystne: {kua.shengChi}, {kua.tianYi}, {kua.yanNian}, {kua.fuWei}</span>
                                          <span className="kua-dir-unfav">❌ Niekorzystne: {kua.inauspicious.join(", ")}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="kua-pending-hint">
                                        Wpisz datę urodzenia (np. 1988-05-24), aby natychmiast wyznaczyć Liczbę Kua.
                                      </div>
                                    )}

                                    {residentProfiles.length > 1 ? (
                                      <button
                                        type="button"
                                        className="inline-res-remove-btn"
                                        onClick={() => removeResidentProfile(rIdx)}
                                        title="Usuń profil"
                                      >
                                        Usuń
                                      </button>
                                    ) : null}
                                  </div>
                                );
                              })}

                              <button
                                type="button"
                                className="inline-res-add-btn"
                                onClick={addResidentProfile}
                              >
                                + Dodaj kolejnego domownika
                              </button>
                            </div>
                          ) : null}

                          {(() => {
                            const marker = selectedPlanMarkerId ? planMarkers.find((m) => m.id === selectedPlanMarkerId) : null;
                            const assignedName = marker?.assignedResidentLabel;
                            const targetRes = assignedName ? residentProfiles.find((r) => r.label === assignedName) : (residentProfiles.length === 1 ? residentProfiles[0] : undefined);
                            const feedback = getKuaDirectionFeedback(targetRes, furnitureDirection, selectedMarkerLabel);
                            if (!feedback) return null;
                            return (
                              <div className={`kua-live-badge ${feedback.status}`}>
                                <strong>{feedback.title}</strong>
                                <p>{feedback.text}</p>
                              </div>
                            );
                          })()}
                        </div>
                      ) : null}

                      {selectedMarkerLabel === "Lustro" ? (
                        <div className="furniture-mirror-box">
                          <div className="mirror-info-header">
                            <span className="mirror-icon" aria-hidden="true">🪞</span>
                            <div>
                              <strong>Zasady Feng Shui dla Lustra:</strong>
                              <p>Stożek światła na symbolu pokazuje, w którą stronę odbijana jest energia Qi.</p>
                            </div>
                          </div>
                          <ul className="mirror-rules-list">
                            <li><strong>Nie odbijaj wezgłowia łóżka</strong> – widok śpiącego w lustrze wywołuje niepokój podświadomości.</li>
                            <li><strong>Nie umieszczaj naprzeciwko drzwi wejściowych</strong> – energia wchodząca do domu zostaje natychmiast odbita na zewnątrz.</li>
                            <li><strong>Odbijaj piękno i światło</strong> – skieruj taflę na widok za oknem, zieleń roślin lub stół jadalny.</li>
                          </ul>
                        </div>
                      ) : null}

                      <small>
                        {furnitureDirectionHelp(selectedMarkerLabel)}
                      </small>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {planMarkers.length > 0 ? (
                <div className="marker-legend" aria-label="Lista oznaczonych punktów na planie">
                  {planMarkers.map((marker) => (
                    <button
                      key={marker.id}
                      type="button"
                      className={`marker-legend-item ${marker.category}${marker.id === selectedPlanMarkerId ? " selected" : ""}`}
                      onClick={() => handlePlanMarkerSelect(marker)}
                    >
                      <span className="marker-legend-dot" />
                      <strong>{marker.label}</strong>
                      {marker.category === "furniture" && marker.facingDeg !== null ? (
                        <small>{marker.facingDeg}°</small>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="annotation-actions">
                <span className="annotation-status">
                  {!hasVisualPreview
                    ? "Do markerów potrzebny jest widoczny podgląd PDF, JPG, PNG albo WEBP"
                    : planMarkers.length > 0
                      ? `${markerCountText(planMarkers.length)} · ${selectedMarkerSummary}`
                      : scanTool === "marker"
                        ? "Kliknij skan, żeby dodać pierwszy marker"
                        : "Ustaw północ na planie, a potem wybierz pomieszczenie, punkt albo mebel"}
                </span>
                <div className="annotation-action-buttons">
                  <button
                    type="button"
                    className="ghost-button compact"
                    disabled={!selectedPlanMarkerId}
                    onClick={removeSelectedPlanMarker}
                  >
                    Usuń wybrany
                  </button>
                  <button
                    type="button"
                    className="ghost-button compact"
                    disabled={planMarkers.length === 0}
                    onClick={undoLastPlanMarker}
                  >
                    Cofnij marker
                  </button>
                  <button
                    type="button"
                    className="ghost-button compact"
                    disabled={planMarkers.length === 0}
                    onClick={() => {
                      setPlanMarkers([]);
                      setSelectedPlanMarkerId(null);
                    }}
                  >
                    Wyczyść
                  </button>
                </div>
              </div>
            </div>

            <div className="north-workspace">
              <div className="scan-preview">
                {previewUrl ? (
                  <div className="scan-canvas-stage">
                    {previewMimeType === "application/pdf" ? (
                      <object data={previewUrl} type="application/pdf" className="scan-image-elem" aria-label="Podgląd wgranego planu PDF">
                        <div className="scan-preview-placeholder">
                          <FileUp size={22} />
                          <span>PDF jest wczytany. Jeśli nie widzisz podglądu, dodaj eksport JPG/PNG.</span>
                        </div>
                      </object>
                    ) : previewablePlanTypes.has(previewMimeType ?? "") ? (
                      <img ref={planImageRef} src={previewUrl} alt="Podgląd wgranego planu" className="scan-image-elem" />
                    ) : (
                      <div className="scan-preview-placeholder">
                        <FileUp size={22} />
                        <span>
                          Plik {previewMimeType?.toUpperCase() || "graficzny"} jest wczytany. Raport może użyć
                          go w analizie, ale do obracania północy i markerów dodaj podgląd JPG, PNG albo WEBP.
                        </span>
                      </div>
                    )}

                    <div
                      className={`scan-annotation-layer ${scanTool}${isDraggingScanNorth ? " dragging" : ""}`}
                      onPointerDown={handleScanPointerDown}
                      onPointerMove={handleScanPointerMove}
                      onPointerUp={handleScanPointerUp}
                      onPointerCancel={handleScanPointerUp}
                      onClick={handleScanClick}
                      aria-label={
                        scanTool === "north"
                          ? "Kliknij albo przeciągnij po planie, aby obrócić wskazówkę północy"
                          : "Kliknij na planie, aby dodać wybrany marker"
                      }
                    >
                      {scanTool === "north" ? (
                        <div
                          className={`north-arrow-overlay${isDraggingScanNorth ? " dragging" : ""}${northConfirmed ? " confirmed" : ""}`}
                          style={{ transform: `rotate(${northAngle}deg)` }}
                          aria-hidden="true"
                        >
                          <div className="north-arrow-head">
                            <span className="north-arrow-tip" />
                            <span className="north-arrow-n">N</span>
                          </div>
                          <div className="north-arrow-axis" />
                          <div className="north-arrow-center">
                            <span className="north-center-pin" />
                          </div>
                          <div className="north-arrow-tail">
                            <span className="north-arrow-s">S</span>
                          </div>
                        </div>
                      ) : null}

                      <div
                        className={`floating-north-compass${northConfirmed ? " confirmed" : ""}`}
                        style={northDialStyle}
                        aria-hidden="true"
                        title={`Północ: ${Math.round(northAngle)}°`}
                      >
                        <div className="compass-dial">
                          <div className="compass-arrow-needle" />
                          <span className="compass-letter">N</span>
                        </div>
                        <span className="compass-deg-pill">{Math.round(northAngle)}°</span>
                      </div>

                      {planMarkers.map((marker, index) => {
                        const stackOffset = markerStackOffset(marker, planMarkers);
                        const isSelected = marker.id === selectedPlanMarkerId;

                        return (
                          <div
                            key={marker.id}
                            className={`plan-marker-wrapper ${marker.category}${isSelected ? " selected" : ""}`}
                            style={{
                              left: `${marker.xPercent}%`,
                              top: `${marker.yPercent}%`,
                              zIndex: isSelected ? 25 : 5 + stackOffset.stackIndex
                            }}
                          >
                            <button
                              type="button"
                              className={`plan-marker ${marker.category}${isSelected ? " selected" : ""}`}
                              style={{
                                "--marker-facing": `${marker.facingDeg ?? 0}deg`,
                                "--marker-scale": `${marker.scale ?? 1}`,
                                "--marker-offset-x": `${stackOffset.x}px`,
                                "--marker-offset-y": `${stackOffset.y}px`
                              } as CSSProperties}
                              title={`${marker.label} (${marker.facingDeg ?? 0}°, ${Math.round((marker.scale ?? 1) * 100)}%). Kliknij, aby edytować lub przeciągnąć.`}
                              onPointerDown={(event) => handleMarkerPointerDown(marker, event)}
                              onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                handlePlanMarkerClick(marker, event as unknown as MouseEvent);
                              }}
                              aria-label={`${marker.label}. Edytuj marker.`}
                            >
                              {marker.category === "furniture" ? (
                                <div className="arch-furniture-piece">
                                  {renderFurnitureSymbol(marker.label)}
                                  {marker.assignedResidentLabel ? (
                                    <span className="furniture-floating-tag">
                                      <span className="resident-tag-highlight">{getResidentInitials(marker.assignedResidentLabel)}</span>
                                    </span>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="pin-content">
                                  <span className="pin-dot" />
                                  <span className="marker-label">{markerShortLabel(marker)}</span>
                                </span>
                              )}
                            </button>

                        {isSelected ? (
                          <div
                            className="marker-floating-actions"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => event.stopPropagation()}
                          >
                            {marker.category === "furniture" ? (
                              <>
                                <button
                                  type="button"
                                  className="action-btn rotate"
                                  title="Obróć mebel o 45°"
                                  onPointerDown={(event) => {
                                    event.stopPropagation();
                                    event.preventDefault();
                                  }}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    event.preventDefault();
                                    const newDeg = (((marker.facingDeg ?? 0) + 45) % 360);
                                    setPlanMarkers((current) =>
                                      current.map((m) => (m.id === marker.id ? { ...m, facingDeg: newDeg } : m))
                                    );
                                    setFurnitureDirection(newDeg);
                                  }}
                                >
                                  <RotateCw size={13} />
                                  <span>{marker.facingDeg ?? 0}°</span>
                                </button>

                                <div className="action-scale-group">
                                  <button
                                    type="button"
                                    className="action-btn scale-btn"
                                    title="Zmniejsz rozmiar mebla (-15%)"
                                    onPointerDown={(event) => {
                                      event.stopPropagation();
                                      event.preventDefault();
                                    }}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      event.preventDefault();
                                      const curScale = marker.scale ?? 1.0;
                                      const newScale = Math.round(Math.max(0.5, curScale - 0.15) * 100) / 100;
                                      setFurnitureScale(newScale);
                                      setPlanMarkers((current) =>
                                        current.map((m) => (m.id === marker.id ? { ...m, scale: newScale } : m))
                                      );
                                    }}
                                  >
                                    -
                                  </button>
                                  <span className="scale-pill-indicator">{Math.round((marker.scale ?? 1.0) * 100)}%</span>
                                  <button
                                    type="button"
                                    className="action-btn scale-btn"
                                    title="Powiększ rozmiar mebla (+15%)"
                                    onPointerDown={(event) => {
                                      event.stopPropagation();
                                      event.preventDefault();
                                    }}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      event.preventDefault();
                                      const curScale = marker.scale ?? 1.0;
                                      const newScale = Math.round(Math.min(2.5, curScale + 0.15) * 100) / 100;
                                      setFurnitureScale(newScale);
                                      setPlanMarkers((current) =>
                                        current.map((m) => (m.id === marker.id ? { ...m, scale: newScale } : m))
                                      );
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              </>
                            ) : null}

                            {(marker.label === "Łóżko" || marker.label === "Biurko" || marker.label === "Miejsce pracy") ? (
                              <button
                                type="button"
                                className="action-btn resident-toggle"
                                title="Zmień przypisanego mieszkańca (Kua)"
                                onPointerDown={(event) => {
                                  event.stopPropagation();
                                  event.preventDefault();
                                }}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  event.preventDefault();
                                  const names = ["", ...residentProfiles.map((r, rI) => r.label || `Mieszkaniec ${rI + 1}`)];
                                  const curIdx = names.indexOf(marker.assignedResidentLabel || "");
                                  const nextName = names[(curIdx + 1) % names.length];
                                  setPlanMarkers((current) =>
                                    current.map((m) => (m.id === marker.id ? { ...m, assignedResidentLabel: nextName || null } : m))
                                  );
                                }}
                              >
                                <UserRound size={13} />
                                <span>{marker.assignedResidentLabel ? getResidentInitials(marker.assignedResidentLabel) : "Przypisz"}</span>
                              </button>
                            ) : null}

                            <button
                              type="button"
                              className="action-btn"
                              title="Zatwierdź pozycję i odznacz znacznik"
                              onPointerDown={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                setSelectedPlanMarkerId(null);
                              }}
                            >
                              <CheckCircle2 size={13} />
                              <span>Gotowe</span>
                            </button>
                            <button
                              type="button"
                              className="action-btn delete"
                              title="Usuń ten marker"
                              onPointerDown={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                              }}
                              onPointerUp={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                removePlanMarker(marker.id);
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                    </div>
                  </div>
                ) : (
                  <div className="scan-preview-placeholder">
                    <FileUp size={22} />
                    <span>Po wgraniu planu tutaj pojawi się skan z nakładką północy i markerami.</span>
                  </div>
                )}
              </div>

            {scanTool === "north" && hasVisualPreview ? (
              <div className={`north-plan-confirm${northConfirmed ? " confirmed" : ""}`}>
                <div>
                  <span>{northConfirmed ? "Północ zatwierdzona" : "Ustawiasz północ"}</span>
                  <strong>{scanDirectionLabel(northAngle)} · {northAngle}°</strong>
                </div>
                <button type="button" onClick={confirmNorthDirection}>
                  <CheckCircle2 size={17} />
                  {northConfirmed ? "Przejdź do markerów" : "Zatwierdź północ"}
                </button>
              </div>
            ) : null}
          </div>
        </div>

            <label className="field-quiet">
              <span>Dodatkowa uwaga o orientacji</span>
              <input
                value={form.orientationNote}
                placeholder="np. plan od dewelopera jest obrócony albo kompas w telefonie był przy oknie"
                onChange={(event) => updateField("orientationNote", event.target.value)}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              <span>Wejście główne</span>
              <input
                value={form.entryNote}
                placeholder="np. wejście od klatki po prawej; albo zaznacz markerem na planie"
                onChange={(event) => updateField("entryNote", event.target.value)}
              />
            </label>
            <label>
              <span>Adres lub kontekst otoczenia</span>
              <input
                value={form.addressNote}
                placeholder="opcjonalnie: miasto, piętro, ekspozycja, sąsiedztwo"
                onChange={(event) => updateField("addressNote", event.target.value)}
              />
            </label>
          </div>

          <label>
            <span>Ograniczenia zmian</span>
            <textarea
              value={form.constraintsNote}
              placeholder="np. nie ruszam kuchni, niski budżet, praca z domu, małe dzieci"
              onChange={(event) => updateField("constraintsNote", event.target.value)}
            />
          </label>

          <div className="form-row">
            <label>
              <span>Funkcje pomieszczeń</span>
              <textarea
                value={form.roomFunctionNote}
                placeholder="np. salon z aneksem, łazienka bez okna, gabinet używany wieczorem"
                onChange={(event) => updateField("roomFunctionNote", event.target.value)}
              />
            </label>
            <label>
              <span>Stałe elementy planu</span>
              <textarea
                value={form.fixedElementNote}
                placeholder="np. schody zostają, kuchni nie przenosimy, okno tarasowe od ogrodu"
                onChange={(event) => updateField("fixedElementNote", event.target.value)}
              />
            </label>
          </div>

          <label>
            <span>Ustawienie mebli i kierunki</span>
            <textarea
              value={form.furnitureNote}
              placeholder="np. łóżko frontem do drzwi, biurko bokiem do okna, sofa przodem do TV"
              onChange={(event) => updateField("furnitureNote", event.target.value)}
            />
          </label>

          <div className="deep-input-grid">
            <div className="mini-fieldset">
              <div className="form-section-title compact-title">
                <CalendarClock size={18} />
                <div>
                  <strong>Czas budynku</strong>
                  <span>Przydatne dla analizy okresu, historii użytkowania i zmian.</span>
                </div>
              </div>
              <div className="form-row">
                <label>
                  <span>Rok budowy</span>
                  <input
                    type="number"
                    min="1800"
                    max="2100"
                    value={form.constructionYear}
                    placeholder="np. 2012"
                    onChange={(event) => updateField("constructionYear", event.target.value)}
                  />
                </label>
                <label>
                  <span>Pierwsze zamieszkanie</span>
                  <input
                    type="number"
                    min="1800"
                    max="2100"
                    value={form.firstOccupiedYear}
                    placeholder="np. 2014"
                    onChange={(event) => updateField("firstOccupiedYear", event.target.value)}
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  <span>Wprowadzka</span>
                  <input
                    type="date"
                    value={form.moveInDate}
                    onChange={(event) => updateField("moveInDate", event.target.value)}
                  />
                </label>
                <label>
                  <span>Duży remont</span>
                  <input
                    type="number"
                    min="1800"
                    max="2100"
                    value={form.renovationYear}
                    placeholder="np. 2021"
                    onChange={(event) => updateField("renovationYear", event.target.value)}
                  />
                </label>
              </div>
              <label>
                <span>Co zmienił remont</span>
                <input
                  value={form.renovationNote}
                  placeholder="np. przeniesiona kuchnia, połączony salon, dobudowane piętro"
                  onChange={(event) => updateField("renovationNote", event.target.value)}
                />
              </label>

              {(() => {
                const activeYear = form.renovationYear || form.constructionYear || form.firstOccupiedYear;
                if (!activeYear || isNaN(Number(activeYear))) return null;
                const pInfo = getBuildingPeriod(activeYear);
                return (
                  <div className="kua-live-badge building-period-badge" aria-label="Okres energetyczny budynku">
                    <div className="kua-header">
                      <span className="kua-number-pill">Okres {pInfo.period} ({pInfo.range})</span>
                      <strong>Żywioł: {pInfo.element} · {pInfo.trigram}</strong>
                    </div>
                    <div className="kua-details-grid">
                      <div>
                        <span>🏛️ Zapis Energetyczny Budynku (Xuan Kong Fei Xing):</span>
                        <strong>{pInfo.rulingEnergy}</strong>
                      </div>
                      <div>
                        <span>🔥 Wpływ Okresu 9 (2024–2043):</span>
                        <em>Wykres natalny określa dystrybucję Gwiazd Górskich (Zdrowie) i Wodnych (Finanse).</em>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="mini-fieldset">
              <div className="form-section-title compact-title">
                <UserRound size={18} />
                <div>
                  <strong>Mieszkańcy i użytkownicy</strong>
                  <span>Dodaj kilka osób, jeśli układ ma uwzględniać domowników lub stałych użytkowników.</span>
                </div>
              </div>
              <div className="resident-list">
                {residentProfiles.map((profile, index) => (
                  <article className="resident-card" key={profile.id}>
                    <div className="resident-card-header">
                      <strong>{profile.label || `Mieszkaniec ${index + 1}`}</strong>
                      <button
                        type="button"
                        className="ghost-button compact"
                        onClick={() => removeResidentProfile(index)}
                      >
                        Usuń
                      </button>
                    </div>
                    <div className="form-row">
                      <label>
                        <span>Nazwa / rola</span>
                        <input
                          value={profile.label}
                          placeholder={`Mieszkaniec ${index + 1}`}
                          onChange={(event) => updateResidentProfile(index, { label: event.target.value })}
                        />
                      </label>
                      <label>
                        <span>Rola w domu</span>
                        <input
                          value={profile.role}
                          placeholder="np. dorosły, dziecko, pracuje z domu"
                          onChange={(event) => updateResidentProfile(index, { role: event.target.value })}
                        />
                      </label>
                    </div>
                    <div className="form-row">
                      <label>
                        <span>Data urodzenia</span>
                        <input
                          type="date"
                          value={profile.birthDate}
                          onChange={(event) => updateResidentProfile(index, { birthDate: event.target.value })}
                        />
                      </label>
                      <label>
                        <span>Płeć (do wyliczenia Kua)</span>
                        <select
                          value={profile.gender || "male"}
                          onChange={(event) => updateResidentProfile(index, { gender: event.target.value as "male" | "female" })}
                        >
                          <option value="male">Mężczyzna</option>
                          <option value="female">Kobieta</option>
                        </select>
                      </label>
                    </div>
                    <div className="form-row">
                      <label>
                        <span>Godzina</span>
                        <input
                          type="time"
                          value={profile.birthTime}
                          onChange={(event) => updateResidentProfile(index, { birthTime: event.target.value })}
                        />
                      </label>
                      <label>
                        <span>Miejsce urodzenia</span>
                        <input
                          value={profile.birthPlace}
                          placeholder="np. Warszawa"
                          onChange={(event) => updateResidentProfile(index, { birthPlace: event.target.value })}
                        />
                      </label>
                    </div>

                    {(() => {
                      const kuaData = calculateKua(profile.birthDate, profile.gender);
                      if (!kuaData) return null;
                      return (
                        <div className="kua-live-badge" aria-label="Profil Kua mieszkańca">
                          <div className="kua-header">
                            <span className="kua-number-pill">Liczba Kua: {kuaData.kua}</span>
                            <strong>Żywioł: {kuaData.element} · {kuaData.trigram}</strong>
                            <small>({kuaData.group})</small>
                          </div>
                          <div className="kua-details-grid">
                            <div>
                              <span>🌿 Sprzyjające kierunki (Sen & Sukces):</span>
                              <strong>{kuaData.shengChi} · {kuaData.tianYi}</strong>
                            </div>
                            <div>
                              <span>🛏️ Rekomendacja dla wezgłowia / biurka:</span>
                              <em>{kuaData.bedAdvice}</em>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {planMarkers.filter((m) => m.category === "furniture" || m.category === "room").length > 0 ? (
                      <label className="field-quiet">
                        <span>Przypisany mebel / pokój dla tej osoby</span>
                        <select
                          value={profile.assignedFurniture?.[0] || ""}
                          onChange={(event) =>
                            updateResidentProfile(index, {
                              assignedFurniture: event.target.value ? [event.target.value] : []
                            })
                          }
                        >
                          <option value="">Wybierz z oznaczonych na planie...</option>
                          {planMarkers
                            .filter((m) => m.category === "furniture" || m.category === "room")
                            .map((m) => (
                              <option key={m.id} value={`${m.label} (${m.id})`}>
                                {m.label} {m.facingDeg !== null ? `· ${m.facingDeg}°` : ""}
                              </option>
                            ))}
                        </select>
                      </label>
                    ) : null}

                    <label>
                      <span>Notatka o osobie</span>
                      <input
                        value={profile.note}
                        placeholder="np. sen, praca, zdrowie, prywatność, ulubione miejsce"
                        onChange={(event) => updateResidentProfile(index, { note: event.target.value })}
                      />
                    </label>
                  </article>
                ))}
              </div>
              <button type="button" className="secondary-button add-resident-button" onClick={addResidentProfile}>
                <UserRound size={17} />
                Dodaj mieszkańca
              </button>
              <label>
                <span>Profil użytkowania całej nieruchomości</span>
                <textarea
                  value={form.profileNote}
                  placeholder="np. ile osób, praca z domu, sen, prywatność, dzieci, goście, rytm dnia"
                  onChange={(event) => updateField("profileNote", event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="plan-selector" role="group" aria-label="Wybór wejścia">
            {pricePlans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                className={plan.id === selectedPlan ? "selected" : ""}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <span>{plan.title}</span>
                <strong>{plan.price}{plan.period ?? ""}</strong>
              </button>
            ))}
          </div>

          <label className="consent-line">
            <input
              type="checkbox"
              checked={form.consentMarketing}
              onChange={(event) => updateField("consentMarketing", event.target.checked)}
            />
            <span>Chcę dostać wskazówki i aktualizacje produktu na e-mail.</span>
          </label>

          {error ? (
            <div className="form-alert error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          ) : null}

          <button className="primary-button audit-submit" type="submit" disabled={isBusy}>
            {isBusy ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
            {status === "reading"
              ? "Odczytuję pliki"
              : status === "generating"
                ? "Tworzę raport"
                : status === "saving"
                  ? "Zapisuję wynik"
                  : "Wygeneruj raport"}
          </button>
        </form>

        <aside className="audit-result" aria-live="polite">
          {report ? (
            <>
              <div className="result-cover">
                <div className={`result-mode ${report.ai_mode}`}>
                  {report.ai_mode === "live" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{reportModeLabel(report)}</span>
                </div>
                <div className="result-cover-grid">
                  <div className="result-score">
                    <span>Wynik</span>
                    <strong>{report.score}/100</strong>
                    <small>Pewność: {confidenceLabel(report.confidence)}</small>
                  </div>
                  <div className="result-decision">
                    <span>Decyzja</span>
                    <p>{report.purchase_decision}</p>
                  </div>
                </div>
                <p className="result-summary">{report.executive_summary}</p>
              </div>

              <div className="result-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    downloadReportPdf(report, { planFile: files[0] ?? null, northAngleDeg: northAngle, planMarkers })
                      .then(() => triggerBrandConfetti())
                      .catch(() => {
                        setError("Nie udało się przygotować PDF. Pobierz JSON albo spróbuj ponownie.");
                      });
                  }}
                >
                  <Download size={17} />
                  Pobierz PDF
                </button>
                <button type="button" className="ghost-button compact" onClick={() => downloadReportJson(report)}>
                  <Download size={17} />
                  JSON
                </button>
                <button type="button" className="ghost-button compact" onClick={resetReport}>
                  <RotateCcw size={17} />
                  Nowy audyt
                </button>
              </div>

              <div className="result-columns">
                <div>
                  <strong>Dane rozpoznane</strong>
                  <ul>
                    {report.detected_inputs.slice(0, 6).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Do uzupełnienia</strong>
                  <ul>
                    {report.missing_inputs.length > 0 ? (
                      report.missing_inputs.slice(0, 6).map((item) => (
                        <li key={item}>{item}</li>
                      ))
                    ) : (
                      <li>Raport ma komplet danych bazowych do pierwszej analizy.</li>
                    )}
                  </ul>
                </div>
              </div>

              {previewUrl ? (
                <section className="rich-report-section">
                  <div className="rich-report-heading">
                    <span>00</span>
                    <h3>Schematyczny rzut CAD i mapa 9 sektorów</h3>
                    <p>Oczyszczony schemat architektoniczny z naniesionymi 9 pałacami Bagua, orientacją północy ({Math.round(northAngle)}°) oraz rozmieszczeniem mebli.</p>
                  </div>
                  <div className="report-plan-viewport">
                    {schematicReportUrl ? (
                      <div className="schematic-cad-container">
                        <img
                          src={schematicReportUrl}
                          alt="Schematyczny rzut architektoniczny z umeblowaniem i strefami Bagua"
                          className="schematic-cad-img"
                        />
                      </div>
                    ) : (
                      <div className="scan-canvas-stage">
                        <img src={previewUrl} alt="Schemat rzutu" className="scan-image-elem" />
                        <div className="scan-annotation-layer view-only">
                          <div
                            className="floating-north-compass confirmed"
                            style={northDialStyle}
                            aria-hidden="true"
                          >
                            <div className="compass-dial">
                              <div className="compass-arrow-needle" />
                              <span className="compass-letter">N</span>
                            </div>
                            <span className="compass-deg-pill">{Math.round(northAngle)}°</span>
                          </div>
                          {planMarkers.map((marker) => (
                            <div
                              key={marker.id}
                              className={`plan-marker-wrapper ${marker.category}`}
                              style={{
                                left: `${marker.xPercent}%`,
                                top: `${marker.yPercent}%`
                              }}
                            >
                              <div
                                className={`plan-marker ${marker.category}`}
                                style={{
                                  "--marker-facing": `${marker.facingDeg ?? 0}deg`
                                } as CSSProperties}
                              >
                                {marker.category === "furniture" ? (
                                  <div className="arch-furniture-piece">
                                    {renderFurnitureSymbol(marker.label)}
                                    <span className="furniture-floating-tag">{markerShortLabel(marker)}</span>
                                  </div>
                                ) : (
                                  <span className="pin-content">
                                    <span className="pin-dot" />
                                    <span className="marker-label">{markerShortLabel(marker)}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              ) : null}

              <section className="rich-report-section">
                <div className="rich-report-heading">
                  <span>01</span>
                  <h3>Priorytety decyzji</h3>
                  <p>Najpierw działania, które zmieniają przepływ, widok, prywatność i realne używanie przestrzeni.</p>
                </div>
                <div className="result-list expanded">
                  {report.priority_actions.slice(0, 8).map((action) => (
                    <article key={action.title}>
                      <span>{action.method}</span>
                      <h3>{action.title}</h3>
                      <p>{action.why}</p>
                      <small>{action.impact} · {action.effort} · pewność {confidenceLabel(action.confidence)}</small>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rich-report-section">
                <div className="rich-report-heading">
                  <span>02</span>
                  <h3>Kierunki i sektory</h3>
                  <p>Warstwa kompasowa jest łączona z funkcją pomieszczeń, centrum planu i oznaczoną północą.</p>
                </div>
                <div className="direction-insight-grid">
                  {report.directional_insights.slice(0, 6).map((insight) => (
                    <article key={insight.title}>
                      <span>{insight.direction}</span>
                      <h4>{insight.title}</h4>
                      <p>{insight.meaning}</p>
                      <strong>{insight.recommendation}</strong>
                    </article>
                  ))}
                </div>
                <div className="sector-report-grid">
                  {report.sector_map.map((sector) => (
                    <article key={`${sector.direction}-${sector.sector}`}>
                      <span>{sector.direction}</span>
                      <h4>{sector.sector}</h4>
                      <small>{sector.element} · priorytet {sector.priority}</small>
                      <p className="sector-current">{sector.current_use}</p>
                      <p>{sector.assessment}</p>
                      <strong>{sector.advice}</strong>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rich-report-section">
                <div className="rich-report-heading">
                  <span>03</span>
                  <h3>Pomieszczenia</h3>
                  <p>Każda oznaczona przestrzeń dostaje własną diagnozę, ryzyka i rady do zastosowania.</p>
                </div>
                <div className="room-report-grid">
                  {report.room_recommendations.map((room) => (
                    <article key={`${room.room}-${room.function}`}>
                      <span>{room.function} · {room.method}</span>
                      <h4>{room.room}</h4>
                      <p>{room.diagnosis}</p>
                      <div className="advice-columns">
                        <div>
                          <strong>Mocne strony</strong>
                          <ul>
                            {room.strengths.map((item) => <li key={item}>{item}</li>)}
                          </ul>
                        </div>
                        <div>
                          <strong>Ryzyka</strong>
                          <ul>
                            {room.risks.map((item) => <li key={item}>{item}</li>)}
                          </ul>
                        </div>
                      </div>
                      <div className="recommendation-list">
                        <strong>Porady</strong>
                        <ul>
                          {room.recommendations.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rich-report-section">
                <div className="rich-report-heading">
                  <span>04</span>
                  <h3>Meble i kierunki osób</h3>
                  <p>Kierunek łóżka, biurka, sofy, stołu i kuchenki jest czytany przez realny sposób korzystania, nie przez niemożliwe ustawienia.</p>
                </div>
                <div className="furniture-report-grid">
                  {report.furniture_recommendations.map((item) => (
                    <article key={`${item.item}-${item.orientation_role}`}>
                      <span>{item.orientation_role}</span>
                      <h4>{item.item}</h4>
                      <small>{item.direction}</small>
                      <p>{item.assessment}</p>
                      <div className="practical-limit">
                        <strong>Ograniczenie praktyczne</strong>
                        <p>{item.practical_limit}</p>
                      </div>
                      <ul>
                        {item.recommendations.map((recommendation) => (
                          <li key={recommendation}>{recommendation}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rich-report-section">
                <div className="rich-report-heading">
                  <span>05</span>
                  <h3>Warstwy analizy</h3>
                  <p>Raport oddziela tradycyjne ramy feng shui od ergonomii, światła, funkcji i komfortu.</p>
                </div>
                <div className="analysis-report-grid">
                  {[...report.traditional_analysis, ...report.practical_analysis].map((section) => (
                    <article key={section.title}>
                      <h4>{section.title}</h4>
                      <p>{section.body}</p>
                      <ul>
                        {section.bullets.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rich-report-section compact">
                <div className="rich-report-heading">
                  <span>06</span>
                  <h3>Korekty bez remontu</h3>
                  <p>Rzeczy, które można zrobić przed dużą decyzją projektową.</p>
                </div>
                <div className="change-report-grid">
                  {report.practical_changes.slice(0, 8).map((item) => (
                    <article key={item.title}>
                      <h4>{item.title}</h4>
                      <p>{item.cost}</p>
                      <small>{item.when}</small>
                    </article>
                  ))}
                </div>
              </section>

              {report.levels.length > 0 ? (
                <div className="level-strip">
                  <Layers3 size={18} />
                  <span>{report.levels.map((level) => `${level.label}: ${level.score}/100`).join(" · ")}</span>
                </div>
              ) : null}

              <section className="rich-report-section compact">
                <div className="rich-report-heading">
                  <span>07</span>
                  <h3>Źródła i standardy</h3>
                  <p>Wynik pokazuje, z których warstw wiedzy korzysta raport i gdzie pewność jest niższa.</p>
                </div>
                <div className="source-report-list">
                  {report.source_ledger.map((source) => (
                    <article key={source.source}>
                      <strong>{source.source}</strong>
                      <p>{source.used_for}</p>
                      <small>pewność: {confidenceLabel(source.confidence)}</small>
                    </article>
                  ))}
                </div>
              </section>

              <small className="result-disclaimer">{report.disclaimer}</small>

              {persistenceMessage ? (
                <div className="form-alert success">
                  <DatabaseZap size={18} />
                  <span>{persistenceMessage}</span>
                </div>
              ) : null}
            </>
          ) : (
            <div className="result-empty">
              <DatabaseZap size={34} />
              <h3>Po wygenerowaniu zobaczysz pełny raport online i PDF</h3>
              <p>
                Wynik obejmie priorytety, kierunki, 9 sektorów, pomieszczenia, meble, kondygnacje,
                zmiany bez remontu i rejestr źródeł użytych w analizie.
              </p>
              <div className="method-tags">
                {methods.slice(0, 6).map((method) => (
                  <span key={method.name}>{method.name}</span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
