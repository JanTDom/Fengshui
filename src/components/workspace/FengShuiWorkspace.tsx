import { useState, useRef, useEffect, type CSSProperties, type ChangeEvent, type PointerEvent, type MouseEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Compass,
  FileUp,
  FlipHorizontal,
  Layers3,
  Lightbulb,
  Maximize2,
  Minimize2,
  Minus,
  MousePointer2,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
  Undo2,
  UserRound,
  ZoomIn,
  ZoomOut,
  Layers,
  Info,
  CalendarClock
} from "lucide-react";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { EmptyWorkspaceState } from "./EmptyWorkspaceState";
import { ReportModal } from "./ReportModal";
import type {
  AuditReport,
  AuditRequestPayload,
  PlanMarker,
  ResidentProfile
} from "../../auditTypes";
import type { PropertyKey } from "../../data";
import {
  fileToPayload,
  generateAuditReport,
  inferMimeType,
  persistAuditIntake,
  validateAuditFiles
} from "../../lib/auditClient";
import { calculateKua, calculateBaZiHourPillar } from "../../lib/kuaEngine";
import { getBuildingPeriod } from "../../lib/natalChartEngine";
import { triggerBrandConfetti } from "../../lib/confetti";

interface FengShuiWorkspaceProps {
  userEmail: string;
  selectedPlanId: string;
  propertyKey: PropertyKey;
  initialPlanFile?: File | null;
  onExitToHome: () => void;
}

type AnnotationMode = "room" | "fixed" | "furniture";

const roomFunctionOptions = [
  "Salon",
  "Salon z aneksem",
  "Sypialnia",
  "Gabinet",
  "Kuchnia",
  "Łazienka",
  "Łazienka z WC",
  "WC",
  "Korytarz",
  "Garderoba",
  "Balkon / Taras",
  "Jadalnia"
];

const fixedElementOptions = [
  "Drzwi wejściowe",
  "Drzwi wewnętrzne",
  "Drzwi balkonowe",
  "Okno",
  "Schody (w górę ↑)",
  "Schody (w dół ↓)",
  "Pion wod-kan",
  "Komin / Wentylacja",
  "Ściana nośna",
  "Słup konstrukcyjny"
];

const furnitureOptions = [
  "Łóżko",
  "Biurko",
  "Sofa",
  "Lustro",
  "Szafa",
  "Stół jadalny",
  "Płyta kuchenna"
];

const previewablePlanTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

function defaultFurnitureOrientationRole(label: string) {
  if (label === "Łóżko") return "Wezgłowie (kierunek głowy podczas snu)";
  if (label === "Biurko") return "Kierunek wzroku podczas pracy";
  if (label === "Sofa") return "Oparcie (plecy przy ścianie)";
  if (label === "Lustro") return "Tafla lustra (kierunek odbicia)";
  if (label === "Płyta kuchenna") return "Pokrętła / front gotującego";
  if (label === "Szafa") return "Front drzwi / szafy";
  return "Kierunek frontu mebla";
}

function normalizeAngle(angle: number): number {
  const mod = angle % 360;
  return mod < 0 ? mod + 360 : mod;
}

export function FengShuiWorkspace({
  userEmail,
  selectedPlanId,
  propertyKey,
  initialPlanFile,
  onExitToHome
}: FengShuiWorkspaceProps) {
  const [projectTitle, setProjectTitle] = useState("Mój Dom - Aranżacja & Feng Shui");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState<string | null>(null);
  const [previewAspectRatio, setPreviewAspectRatio] = useState<string | null>(null);
  const [scanTool, setScanTool] = useState<"north" | "marker">("marker");
  const [annotationMode, setAnnotationMode] = useState<AnnotationMode>("furniture");
  const [selectedMarkerLabel, setSelectedMarkerLabel] = useState<string>("Łóżko");
  const [selectedPlanMarkerId, setSelectedPlanMarkerId] = useState<string | null>(null);
  const [planMarkers, setPlanMarkers] = useState<PlanMarker[]>([]);
  const [northAngle, setNorthAngle] = useState(0);
  const [northConfirmed, setNorthConfirmed] = useState(false);
  const [showBaguaOverlay, setShowBaguaOverlay] = useState(false);
  const [cadFilterMode, setCadFilterMode] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (initialPlanFile && files.length === 0) {
      setFiles([initialPlanFile]);
    }
  }, [initialPlanFile]);

  // Furniture adjustment state
  const [furnitureDirection, setFurnitureDirection] = useState(0);
  const [furnitureScale, setFurnitureScale] = useState(1.0);
  const [furnitureOrientationRole, setFurnitureOrientationRole] = useState(
    defaultFurnitureOrientationRole("Łóżko")
  );

  // Consultation Goals & Parameters
  const [consultationPurpose, setConsultationPurpose] = useState(
    "Wszystko (Kompleksowy audyt: sen, praca, relacje, finanse, zdrowie)"
  );
  const [floorLevel, setFloorLevel] = useState("Parter / Mieszkanie jednopoziomowe");
  const [usableAreaM2, setUsableAreaM2] = useState(64);
  const [levelsCount, setLevelsCount] = useState(1);
  const [addressNote, setAddressNote] = useState("Lokalizacja prywatna");

  // Surroundings (Szkoła Formy)
  const [roadType, setRoadType] = useState("Spokojna ulica osiedlowa");
  const [landscapeForm, setLandscapeForm] = useState("Wyższy budynek / wzniesienie z tyłu (Czarny Żółw - oparcie)");
  const [shaQiHazards, setShaQiHazards] = useState<string[]>(["Brak widocznych zagrożeń"]);

  // Residents
  const [residents, setResidents] = useState<ResidentProfile[]>([
    {
      label: "Główny domownik",
      role: "Właściciel / Praca z domu",
      birthDate: "1988-05-24",
      birthTime: "12:00",
      birthPlace: "Warszawa",
      gender: "male",
      formulaCategory: "Kua",
      note: ""
    }
  ]);

  // Building Year
  const [constructionYear, setConstructionYear] = useState("2018");
  const [renovationYear, setRenovationYear] = useState("");

  // Analysis & Report State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [report, setReport] = useState<AuditReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Interaction refs
  const planImageRef = useRef<HTMLImageElement | null>(null);
  const suppressCanvasClickRef = useRef(false);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);

  function suppressCanvasClickTemporarily(ms = 350) {
    suppressCanvasClickRef.current = true;
    setTimeout(() => {
      suppressCanvasClickRef.current = false;
    }, ms);
  }

  useEffect(() => {
    const firstFile = files[0];

    if (!firstFile) {
      setPreviewUrl(null);
      setPreviewMimeType(null);
      setPreviewAspectRatio(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(firstFile);
    setPreviewUrl(nextPreviewUrl);
    setPreviewMimeType(inferMimeType(firstFile.name, firstFile.type));
    setPreviewAspectRatio(null);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [files]);

  // Load sample plan
  async function handleLoadSamplePlan() {
    try {
      const response = await fetch("/assets/floor-plan-premium.webp");
      const blob = await response.blob();
      const file = new File([blob], "rzut_mieszkania_64m2.webp", { type: "image/webp" });
      setFiles([file]);
      setNorthAngle(335);
      setNorthConfirmed(true);
      setScanTool("marker");

      // Place default starting markers
      setPlanMarkers([
        {
          id: "m_bed1",
          label: "Łóżko",
          category: "furniture",
          xPercent: 78,
          yPercent: 42,
          facingDeg: 270,
          scale: 1.1,
          assignedResidentLabel: "Główny domownik",
          orientationRole: "Wezgłowie (kierunek głowy podczas snu)"
        },
        {
          id: "m_desk1",
          label: "Biurko",
          category: "furniture",
          xPercent: 28,
          yPercent: 32,
          facingDeg: 180,
          scale: 1.0,
          assignedResidentLabel: "Główny domownik",
          orientationRole: "Kierunek wzroku podczas pracy"
        },
        {
          id: "m_sofa1",
          label: "Sofa",
          category: "furniture",
          xPercent: 42,
          yPercent: 68,
          facingDeg: 0,
          scale: 1.15,
          orientationRole: "Oparcie (plecy przy ścianie)"
        }
      ]);
    } catch (err) {
      console.error("Błąd ładowania przykładowego rzutu:", err);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";

    if (selectedFiles.length === 0) return;

    const validation = validateAuditFiles(selectedFiles);
    if (validation) {
      setErrorMessage(validation);
      return;
    }

    setErrorMessage(null);
    setFiles(selectedFiles);
    setNorthConfirmed(false);
    setScanTool("north");
  }

  function handleAddResident() {
    setResidents((curr) => [
      ...curr,
      {
        label: `Domownik ${curr.length + 1}`,
        role: "Mieszkaniec",
        birthDate: "1992-08-15",
        birthTime: "10:00",
        birthPlace: "",
        gender: "female",
        formulaCategory: "Kua",
        note: ""
      }
    ]);
  }

  function handleUpdateResident(idx: number, updates: Partial<ResidentProfile>) {
    setResidents((curr) =>
      curr.map((r, i) => (i === idx ? { ...r, ...updates } : r))
    );
  }

  function handleRemoveResident(idx: number) {
    setResidents((curr) => curr.filter((_, i) => i !== idx));
  }

  // Marker creation & manipulation
  function handleSelectTool(mode: AnnotationMode, label: string) {
    setAnnotationMode(mode);
    setSelectedMarkerLabel(label);
    setScanTool("marker");
    setSelectedPlanMarkerId(null);
    if (mode === "furniture") {
      setFurnitureOrientationRole(defaultFurnitureOrientationRole(label));
    }
  }

  function handleCanvasClick(event: MouseEvent<HTMLDivElement>) {
    if (suppressCanvasClickRef.current) {
      suppressCanvasClickRef.current = false;
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest(".marker-floating-actions, .floating-north-compass, .plan-marker, button, input")) {
      return;
    }

    const img = planImageRef.current;
    const rect = img && img.clientWidth > 0 ? img.getBoundingClientRect() : event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const xPercent = Math.max(1, Math.min(99, ((event.clientX - rect.left) / rect.width) * 100));
    const yPercent = Math.max(1, Math.min(99, ((event.clientY - rect.top) / rect.height) * 100));

    const newMarkerId = `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
    const isFurniture = annotationMode === "furniture";
    const isFixed = annotationMode === "fixed";
    const assignedResident = isFurniture && (selectedMarkerLabel === "Łóżko" || selectedMarkerLabel === "Biurko")
      ? (residents[0]?.label || null)
      : null;

    const newMarker: PlanMarker = {
      id: newMarkerId,
      label: selectedMarkerLabel,
      category: annotationMode,
      xPercent: Number(xPercent.toFixed(2)),
      yPercent: Number(yPercent.toFixed(2)),
      facingDeg: isFurniture || isFixed ? furnitureDirection : null,
      scale: isFurniture || isFixed ? furnitureScale : undefined,
      orientationRole: isFurniture ? furnitureOrientationRole : null,
      assignedResidentLabel: assignedResident
    };

    setPlanMarkers((curr) => [...curr, newMarker]);
    setSelectedPlanMarkerId(newMarkerId);
  }

  function handleMarkerPointerDown(marker: PlanMarker, event: PointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    suppressCanvasClickTemporarily();
    setSelectedPlanMarkerId(marker.id);
    setDraggingMarkerId(marker.id);
    if (marker.category === "furniture" || marker.category === "fixed") {
      setFurnitureDirection(marker.facingDeg ?? 0);
      setFurnitureScale(marker.scale ?? 1.0);
      setFurnitureOrientationRole(marker.orientationRole ?? defaultFurnitureOrientationRole(marker.label));
    }
    (event.currentTarget.parentElement as HTMLElement)?.setPointerCapture(event.pointerId);
  }

  function handleCanvasPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (draggingMarkerId) {
      const img = planImageRef.current;
      const rect = img && img.clientWidth > 0 ? img.getBoundingClientRect() : event.currentTarget.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const xPercent = Math.max(1, Math.min(99, ((event.clientX - rect.left) / rect.width) * 100));
      const yPercent = Math.max(1, Math.min(99, ((event.clientY - rect.top) / rect.height) * 100));

      setPlanMarkers((curr) =>
        curr.map((m) =>
          m.id === draggingMarkerId
            ? { ...m, xPercent: Number(xPercent.toFixed(2)), yPercent: Number(yPercent.toFixed(2)) }
            : m
        )
      );
      return;
    }
  }

  function handleCanvasPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (draggingMarkerId) {
      suppressCanvasClickTemporarily(200);
    }
    setDraggingMarkerId(null);
  }

  function handleUpdateSelectedMarker(updates: Partial<PlanMarker>) {
    if (!selectedPlanMarkerId) return;
    setPlanMarkers((curr) =>
      curr.map((m) => (m.id === selectedPlanMarkerId ? { ...m, ...updates } : m))
    );
  }

  function handleRotateSelectedMarker(step = 45) {
    suppressCanvasClickTemporarily();
    if (!selectedPlanMarkerId) return;
    const current = planMarkers.find((m) => m.id === selectedPlanMarkerId);
    const nextDeg = normalizeAngle((current?.facingDeg ?? 0) + step);
    setFurnitureDirection(nextDeg);
    handleUpdateSelectedMarker({ facingDeg: nextDeg });
  }

  function handleScaleSelectedMarker(delta: number) {
    suppressCanvasClickTemporarily();
    if (!selectedPlanMarkerId) return;
    const current = planMarkers.find((m) => m.id === selectedPlanMarkerId);
    const nextScale = Math.max(0.6, Math.min(2.5, Number(((current?.scale ?? 1.0) + delta).toFixed(2))));
    setFurnitureScale(nextScale);
    handleUpdateSelectedMarker({ scale: nextScale });
  }

  function handleToggleFlipSelectedMarker() {
    suppressCanvasClickTemporarily();
    if (!selectedPlanMarkerId) return;
    const current = planMarkers.find((m) => m.id === selectedPlanMarkerId);
    const nextFlip = !current?.flipX;
    handleUpdateSelectedMarker({ flipX: nextFlip });
  }

  function handleDeleteSelectedMarker() {
    suppressCanvasClickTemporarily();
    if (!selectedPlanMarkerId) return;
    setPlanMarkers((curr) => curr.filter((m) => m.id !== selectedPlanMarkerId));
    setSelectedPlanMarkerId(null);
  }

  // Run Feng Shui Analysis Action
  async function handleRunAnalysis() {
    if (!previewUrl || files.length === 0) {
      setErrorMessage("Najpierw wgraj rzut mieszkania lub załaduj plan przykładowy.");
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);
    setGenerationStep("Odczytywanie układu i osi ścian...");

    try {
      const filePayloads = await Promise.all(files.map((f) => fileToPayload(f)));

      setGenerationStep("Nakładanie siatki 9 stref Bagua & obliczenia kompasowe...");
      await new Promise((r) => setTimeout(r, 600));

      setGenerationStep("Analiza pozycji mebli, strefy wejścia i profili Kua domowników...");

      const payload: AuditRequestPayload = {
        email: userEmail || "kontakt@multinewsroom.pl",
        planId: selectedPlanId,
        propertyType: propertyKey,
        floorLevel,
        levelsCount,
        usableAreaM2,
        purpose: consultationPurpose,
        addressNote,
        orientationNote: northConfirmed ? "Północ zatwierdzona przez użytkownika." : "",
        entryNote: floorLevel.includes("Piętro") ? "Wejście na kondygnację ze schodów" : "Drzwi wejściowe na kondygnacji",
        constraintsNote: "Bez wyburzania ścian nośnych",
        profileNote: "Komfort domowników i praca w skupieniu",
        surroundings: {
          roadType,
          landscapeForm,
          shaQiHazards,
          notes: addressNote
        },
        orientationData: {
          northAngleDeg: northAngle,
          confirmed: northConfirmed,
          source: "manual_compass_dial",
          note: "Orientacja wprowadzona w Studio Planowania"
        },
        planAnnotations: {
          roomFunctions: planMarkers.filter((m) => m.category === "room").map((m) => m.label),
          fixedElements: planMarkers.filter((m) => m.category === "fixed").map((m) => m.label),
          markers: planMarkers,
          roomFunctionNote: "",
          fixedElementNote: ""
        },
        furnitureAnnotations: {
          keyPieces: planMarkers.filter((m) => m.category === "furniture").map((m) => m.label),
          furnitureNote: ""
        },
        buildingProfile: {
          constructionYear,
          firstOccupiedYear: constructionYear,
          moveInDate: "",
          majorRenovationYear: renovationYear,
          renovationNote: "",
          floorLevel,
          surroundings: {
            roadType,
            landscapeForm,
            shaQiHazards,
            notes: addressNote
          }
        },
        residentProfiles: residents,
        selectedMethods: ["Szkoła Formy", "Siatka Bagua", "Kua Domowników", "Xuan Kong Fei Xing"],
        files: filePayloads
      };

      const result = await generateAuditReport(payload);
      setReport(result.report);
      setIsGenerating(false);
      setIsReportModalOpen(true);
      triggerBrandConfetti();

      // Persist audit intake
      persistAuditIntake({
        payload,
        report: result.report,
        consentMarketing: true
      }).catch((e) => console.log("Persistence note:", e));
    } catch (err) {
      setIsGenerating(false);
      setErrorMessage(err instanceof Error ? err.message : "Błąd podczas generowania analizy.");
    }
  }

  // Selected item contextual intel
  const selectedMarker = selectedPlanMarkerId
    ? planMarkers.find((m) => m.id === selectedPlanMarkerId)
    : null;

  const activeResident = residents.find(
    (r) => r.label === selectedMarker?.assignedResidentLabel
  ) || residents[0];
  const kuaData = activeResident?.birthDate
    ? calculateKua(activeResident.birthDate, activeResident.gender)
    : null;

  const buildingPeriodData = getBuildingPeriod(renovationYear || constructionYear || "2020");
  const isImagePreview = previewablePlanTypes.has(previewMimeType ?? "");
  const isPdfPreview = previewMimeType === "application/pdf";
  const canAnnotatePreview = Boolean(previewUrl && (isImagePreview || isPdfPreview));
  const previewFileName = files[0]?.name ?? "wybrany plik";
  const scanStageClassName = [
    "scan-canvas-stage",
    isPdfPreview ? "pdf-preview" : isImagePreview ? "image-preview" : "file-preview"
  ].join(" ");
  const scanStageStyle = isImagePreview && previewAspectRatio
    ? ({ "--scan-aspect-ratio": previewAspectRatio } as CSSProperties)
    : undefined;

  return (
    <div className="workspace-root">
      <WorkspaceHeader
        projectTitle={projectTitle}
        onUpdateProjectTitle={setProjectTitle}
        onExitToHome={onExitToHome}
        onLoadSamplePlan={handleLoadSamplePlan}
        hasPlan={Boolean(previewUrl)}
      />

      <div className="workspace-main-grid">
        {/* ================= LEFT TOOLS PANEL ================= */}
        <aside className="workspace-tools-panel" aria-label="Narzędzia planowania">
          <div className="tools-panel-section">
            <span className="tools-section-title">Tryb pracy na rzucie</span>
            <div className="tools-mode-grid">
              <button
                type="button"
                className={`tool-mode-tab ${scanTool === "north" ? "active" : ""}`}
                onClick={() => setScanTool("north")}
              >
                <Compass size={18} />
                <span>Północ (N)</span>
              </button>
              <button
                type="button"
                className={`tool-mode-tab ${scanTool === "marker" && annotationMode === "furniture" ? "active" : ""}`}
                onClick={() => handleSelectTool("furniture", "Łóżko")}
              >
                <Sparkles size={18} />
                <span>Meble CAD</span>
              </button>
              <button
                type="button"
                className={`tool-mode-tab ${scanTool === "marker" && annotationMode === "room" ? "active" : ""}`}
                onClick={() => handleSelectTool("room", "Salon")}
              >
                <Layers3 size={18} />
                <span>Pokoje</span>
              </button>
              <button
                type="button"
                className={`tool-mode-tab ${scanTool === "marker" && annotationMode === "fixed" ? "active" : ""}`}
                onClick={() => handleSelectTool("fixed", "Drzwi wejściowe")}
              >
                <MousePointer2 size={18} />
                <span>Punkty stałe</span>
              </button>
            </div>
          </div>

          {/* PALETTE ITEMS */}
          <div className="tools-palette-container">
            {scanTool === "north" ? (
              <div className="north-tool-card">
                <div className="north-tool-info">
                  <strong>Ustawienie igły Północy</strong>
                  <p>Ustaw kąt Północy N na rzucie lokalu.</p>
                </div>

                <div className="north-stepper-row" style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "8px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "24px", minHeight: "24px", maxHeight: "24px", overflow: "hidden" }}>
                    <span style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                      Kąt N: <strong style={{ color: "var(--ink)", fontSize: "0.92rem", display: "inline-block", width: "42px" }}>{northAngle}°</strong>
                    </span>
                    <span style={{ fontSize: "0.74rem", color: "#C49544", fontWeight: 700, whiteSpace: "nowrap", textAlign: "right" }}>
                      {getShortDirectionLabel(northAngle)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="355"
                    step="5"
                    value={northAngle}
                    onChange={(e) => setNorthAngle(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#C49544", cursor: "pointer", height: "6px" }}
                  />

                  <div className="stepper-btns" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px" }}>
                    <button type="button" onClick={() => setNorthAngle(0)} style={{ height: "30px", fontWeight: northAngle === 0 ? 800 : 500 }}>N (0°)</button>
                    <button type="button" onClick={() => setNorthAngle(90)} style={{ height: "30px", fontWeight: northAngle === 90 ? 800 : 500 }}>E (90°)</button>
                    <button type="button" onClick={() => setNorthAngle(180)} style={{ height: "30px", fontWeight: northAngle === 180 ? 800 : 500 }}>S (180°)</button>
                    <button type="button" onClick={() => setNorthAngle(270)} style={{ height: "30px", fontWeight: northAngle === 270 ? 800 : 500 }}>W (270°)</button>
                  </div>

                  <div className="stepper-btns" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px" }}>
                    <button type="button" onClick={() => setNorthAngle((a) => normalizeAngle(a - 15))} style={{ height: "30px" }}>-15°</button>
                    <button type="button" onClick={() => setNorthAngle((a) => normalizeAngle(a - 5))} style={{ height: "30px" }}>-5°</button>
                    <button type="button" onClick={() => setNorthAngle((a) => normalizeAngle(a + 5))} style={{ height: "30px" }}>+5°</button>
                    <button type="button" onClick={() => setNorthAngle((a) => normalizeAngle(a + 15))} style={{ height: "30px" }}>+15°</button>
                  </div>
                </div>

                <button
                  type="button"
                  className={`primary-button full-width ${northConfirmed ? "success-state" : ""}`}
                  onClick={() => {
                    setNorthConfirmed(true);
                    setScanTool("marker");
                  }}
                  style={{ marginTop: "4px", height: "38px" }}
                >
                  <CheckCircle2 size={16} />
                  <span>{northConfirmed ? "Północ zatwierdzona" : "Zatwierdź orientację N"}</span>
                </button>
              </div>
            ) : annotationMode === "furniture" ? (
              <div className="furniture-palette-box">
                <span className="palette-subhead">Wybierz mebel do postawienia:</span>
                <div className="cad-furniture-grid">
                  {furnitureOptions.map((furn) => (
                    <button
                      key={furn}
                      type="button"
                      className={`cad-furn-btn ${selectedMarkerLabel === furn ? "active" : ""}`}
                      onClick={() => handleSelectTool("furniture", furn)}
                    >
                      <div className="cad-furn-preview">
                        {renderCadSymbolSvg(furn)}
                      </div>
                      <span className="cad-furn-title">{furn}</span>
                    </button>
                  ))}
                </div>
                <small className="palette-help-hint">
                  Kliknij na planie w miejscu, gdzie ma stanąć {selectedMarkerLabel.toLowerCase()}.
                </small>
              </div>
            ) : annotationMode === "room" ? (
              <div className="rooms-palette-box">
                <span className="palette-subhead">Wybierz funkcję pomieszczenia:</span>
                <div className="simple-tags-grid">
                  {roomFunctionOptions.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`room-tag-btn ${selectedMarkerLabel === r ? "active" : ""}`}
                      onClick={() => handleSelectTool("room", r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="fixed-palette-box">
                <span className="palette-subhead">Punkty stałe na rzucie:</span>
                <div className="simple-tags-grid">
                  {fixedElementOptions.map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`fixed-tag-btn ${selectedMarkerLabel === f ? "active" : ""}`}
                      onClick={() => handleSelectTool("fixed", f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Placed Elements List & Quick Actions */}
          <div className="tools-placed-summary">
            <div className="placed-summary-head">
              <span>Elementy na rzucie ({planMarkers.length})</span>
              {planMarkers.length > 0 ? (
                <button
                  type="button"
                  className="clear-all-btn"
                  onClick={() => {
                    setPlanMarkers([]);
                    setSelectedPlanMarkerId(null);
                  }}
                  title="Wyczyść wszystkie znaczniki"
                >
                  Wyczyść
                </button>
              ) : null}
            </div>

            <div className="placed-markers-scroll">
              {planMarkers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`placed-marker-chip ${m.category} ${m.id === selectedPlanMarkerId ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedPlanMarkerId(m.id);
                    if (m.category === "furniture") {
                      setFurnitureDirection(m.facingDeg ?? 0);
                      setFurnitureScale(m.scale ?? 1.0);
                    }
                  }}
                >
                  <span className="marker-dot" />
                  <span className="marker-label">{m.label}</span>
                  {m.facingDeg !== null ? <small>{m.facingDeg}°</small> : null}
                  {m.assignedResidentLabel ? (
                    <span className="res-initial">{getInitials(m.assignedResidentLabel)}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ================= CENTER CANVAS STAGE (65-75% OF SCREEN) ================= */}
        <main className="workspace-center-stage" aria-label="Główny obszar rzutu">
          {!previewUrl ? (
            <EmptyWorkspaceState
              onFileSelect={handleFileChange}
              onLoadSamplePlan={handleLoadSamplePlan}
            />
          ) : (
            <div className="workspace-canvas-viewport">
              <div
                className="workspace-canvas-wrapper"
                style={{ transform: `scale(${zoomLevel})` }}
                onClick={handleCanvasClick}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
              >
                <div className={scanStageClassName} style={scanStageStyle}>
                  {isPdfPreview ? (
                    <object
                      data={previewUrl}
                      type="application/pdf"
                      className="scan-image-elem scan-pdf-elem"
                      aria-label={`Podgląd PDF: ${previewFileName}`}
                    >
                      <div className="scan-preview-placeholder scan-preview-file-loaded">
                        <FileUp size={32} />
                        <strong>{previewFileName}</strong>
                        <span>PDF został wczytany. Jeśli podgląd nie pokaże się w przeglądarce, nadal możesz uruchomić analizę.</span>
                      </div>
                    </object>
                  ) : isImagePreview ? (
                    <img
                      ref={planImageRef}
                      src={previewUrl}
                      alt="Rzut lokalu do aranżacji"
                      className="scan-image-elem"
                      style={{
                        filter: cadFilterMode ? "grayscale(100%) contrast(165%) brightness(106%)" : "none",
                        transition: "filter 0.25s ease"
                      }}
                      draggable={false}
                      onLoad={(event) => {
                        const image = event.currentTarget;
                        if (image.naturalWidth > 0 && image.naturalHeight > 0) {
                          setPreviewAspectRatio(`${image.naturalWidth} / ${image.naturalHeight}`);
                        }
                      }}
                      onError={() => setErrorMessage("Plik został dodany, ale Chrome nie potrafi wyświetlić jego podglądu. Spróbuj PNG, JPG, WEBP lub PDF.")}
                    />
                  ) : (
                    <div className="scan-preview-placeholder scan-preview-file-loaded">
                      <FileUp size={32} />
                      <strong>{previewFileName}</strong>
                      <span>Plik został wczytany, ale ten format nie ma podglądu w przeglądarce. Do oznaczania na rzucie użyj PNG, JPG, WEBP albo PDF.</span>
                    </div>
                  )}

                  {canAnnotatePreview ? (
                    <div className="scan-annotation-layer">
                    {/* BAGUA 9-SECTOR OVERLAY */}
                    {showBaguaOverlay ? (
                      <div
                        className="workspace-bagua-grid-overlay"
                        style={{ transform: `rotate(${northAngle}deg)` }}
                      >
                        <div className="bagua-cell cell-se"><span>SE · Bogactwo (Drewno)</span></div>
                        <div className="bagua-cell cell-s"><span>S · Sława (Ogień)</span></div>
                        <div className="bagua-cell cell-sw"><span>SW · Relacje (Ziemia)</span></div>
                        <div className="bagua-cell cell-e"><span>E · Rodzina (Drewno)</span></div>
                        <div className="bagua-cell cell-center"><span>Tai Qi · Centrum</span></div>
                        <div className="bagua-cell cell-w"><span>W · Dzieci (Metal)</span></div>
                        <div className="bagua-cell cell-ne"><span>NE · Wiedza (Ziemia)</span></div>
                        <div className="bagua-cell cell-n"><span>N · Kariera (Woda)</span></div>
                        <div className="bagua-cell cell-nw"><span>NW · Pomocnicy (Metal)</span></div>
                      </div>
                    ) : null}

                    {/* 1. LARGE CENTER NORTH CALIBRATOR (Visible ONLY during North calibration mode) */}
                    {scanTool === "north" ? (
                      <div className="north-center-calibrator" onClick={(e) => e.stopPropagation()}>
                        <div
                          className="north-calibrator-disc"
                          onClick={() => setNorthAngle((a) => normalizeAngle(a + 45))}
                          title="Kliknij tarczę, aby obrócić o 45°"
                        >
                          {renderLargeCenterNorthCompass(northAngle)}
                        </div>
                        <div className="north-calibrator-card">
                          <span className="calibrator-readout">
                            Kierunek N: <strong>{northAngle}°</strong> ({getShortDirectionLabel(northAngle)})
                          </span>
                          <div className="calibrator-steppers">
                            <button type="button" onClick={() => setNorthAngle((a) => normalizeAngle(a - 15))}>-15°</button>
                            <button type="button" onClick={() => setNorthAngle((a) => normalizeAngle(a + 15))}>+15°</button>
                            <button type="button" onClick={() => setNorthAngle((a) => normalizeAngle(a + 45))}>+45°</button>
                            <button type="button" onClick={() => setNorthAngle(0)}>Reset N (0°)</button>
                          </div>
                          <button
                            type="button"
                            className="calibrator-submit-btn"
                            onClick={() => {
                              setNorthConfirmed(true);
                              setScanTool("marker");
                            }}
                          >
                            <CheckCircle2 size={16} />
                            <span>Zatwierdź Północ (Przejdź do mebli)</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* 2. DISCREET CORNER BADGE (Visible in marker mode, allows instant correction anytime) */
                      <button
                        type="button"
                        className="floating-north-indicator"
                        onClick={(e) => {
                          e.stopPropagation();
                          setScanTool("north");
                        }}
                        title="Kliknij, aby skorygować kierunek Północy N"
                      >
                        <Compass size={14} />
                        <span>N: {northAngle}°</span>
                        <span className="recalibrate-tag">Koryguj Północ</span>
                      </button>
                    )}

                    {/* PLACED PLAN MARKERS */}
                    {planMarkers.map((marker) => {
                      const isSelected = marker.id === selectedPlanMarkerId;
                      const isFurniture = marker.category === "furniture";
                      const isFixed = marker.category === "fixed";
                      const isLinear = marker.label?.includes("Okno") ||
                        marker.label?.includes("Drzwi") ||
                        marker.label?.includes("Szafa") ||
                        marker.label?.includes("Garderoba") ||
                        marker.label?.includes("Ściana");

                      const scaleVal = marker.scale ?? 1.0;
                      const scaleX = scaleVal;
                      const scaleY = isLinear ? 1.0 : scaleVal;

                      return (
                        <div
                          key={marker.id}
                          className={`plan-marker-wrapper ${marker.category} ${isSelected ? "selected" : ""}`}
                          style={{
                            left: `${marker.xPercent}%`,
                            top: `${marker.yPercent}%`,
                            zIndex: isSelected ? 15 : isFurniture ? 8 : isFixed ? 5 : 3
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            suppressCanvasClickTemporarily();
                            setSelectedPlanMarkerId(marker.id);
                          }}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            suppressCanvasClickTemporarily();
                          }}
                        >
                          <div
                            className={`plan-marker ${marker.category} ${isSelected ? "selected" : ""}`}
                            style={{
                              "--marker-facing": `${marker.facingDeg ?? 0}deg`,
                              "--marker-scale": scaleVal,
                              "--marker-scale-x": scaleX,
                              "--marker-scale-y": scaleY
                            } as CSSProperties}
                            onClick={(e) => {
                              e.stopPropagation();
                              suppressCanvasClickTemporarily();
                              setSelectedPlanMarkerId(marker.id);
                            }}
                            onPointerDown={(e) => handleMarkerPointerDown(marker, e)}
                          >
                            {isFurniture ? (
                              <div className="arch-furniture-piece">
                                {renderCadSymbolSvg(marker.label)}
                              </div>
                            ) : isFixed ? (
                              <div className="arch-fixed-piece">
                                {renderFixedCadSymbolSvg(marker.label, marker.flipX) || (
                                  <div className="pin-marker-pill fixed-pill">
                                    <span>{marker.label}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="pin-marker-pill room-pill">
                                <span>{marker.label}</span>
                              </div>
                            )}

                            {marker.assignedResidentLabel ? (
                              <span className="furniture-floating-tag">
                                {getInitials(marker.assignedResidentLabel)}
                              </span>
                            ) : null}
                          </div>

                          {/* CONTEXTUAL FLOATING ACTION TOOLBAR */}
                          {isSelected && (isFurniture || isFixed) ? (
                            <div
                              className="marker-floating-actions"
                              onClick={(e) => {
                                e.stopPropagation();
                                suppressCanvasClickTemporarily();
                              }}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                suppressCanvasClickTemporarily();
                              }}
                            >
                              <button
                                type="button"
                                className="action-btn rotate"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRotateSelectedMarker(45);
                                }}
                                title="Obróć o 45°"
                              >
                                <RotateCw size={13} />
                                <span>{marker.facingDeg ?? 0}°</span>
                              </button>

                              <div className="action-stepper" title="Szerokość / Skala">
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleScaleSelectedMarker(-0.1); }}>-</button>
                                <span>{Math.round((marker.scale ?? 1.0) * 100)}%</span>
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleScaleSelectedMarker(0.1); }}>+</button>
                              </div>

                              {marker.label?.includes("Drzwi") ? (
                                <button
                                  type="button"
                                  className="action-btn flip"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFlipSelectedMarker();
                                  }}
                                  title="Odwróć skrzydło drzwi (Lewe / Prawe)"
                                >
                                  <FlipHorizontal size={13} />
                                  <span>{marker.flipX ? "Prawe (P)" : "Lewe (L)"}</span>
                                </button>
                              ) : null}

                              {marker.label?.includes("Schody") ? (
                                <button
                                  type="button"
                                  className="action-btn stairs-toggle"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextL = marker.label.includes("w dół") ? "Schody (w górę ↑)" : "Schody (w dół ↓)";
                                    handleUpdateSelectedMarker({ label: nextL });
                                  }}
                                  title="Zmień kierunek schodów (W górę / W dół)"
                                >
                                  <span>{marker.label.includes("w dół") ? "↓ W dół" : "↑ W górę"}</span>
                                </button>
                              ) : null}

                              {isFurniture ? (
                                <button
                                  type="button"
                                  className="action-btn resident-pick"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const curName = marker.assignedResidentLabel;
                                    const nextRes = residents.find((r) => r.label !== curName) || null;
                                    handleUpdateSelectedMarker({ assignedResidentLabel: nextRes ? nextRes.label : null });
                                  }}
                                  title="Przypisz domownika"
                                >
                                  <UserRound size={13} />
                                  <span>{marker.assignedResidentLabel ? getInitials(marker.assignedResidentLabel) : "Osoba"}</span>
                                </button>
                              ) : null}

                              <button
                                type="button"
                                className="action-btn done"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  suppressCanvasClickTemporarily();
                                  setSelectedPlanMarkerId(null);
                                }}
                                title="Zatwierdź"
                              >
                                <CheckCircle2 size={13} />
                              </button>

                              <button
                                type="button"
                                className="action-btn delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSelectedMarker();
                                }}
                                title="Usuń element"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* CANVAS FLOATING TOOLBAR */}
              <div className="canvas-floating-controls">
                <div className="zoom-controls-group">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
                    title="Pomniejsz"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="zoom-val-text">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(2.2, Number((z + 0.15).toFixed(2))))}
                    title="Powiększ"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    type="button"
                    className="fit-canvas-btn"
                    onClick={() => setZoomLevel(1)}
                  >
                    Dopasuj
                  </button>
                </div>

                <div className="overlay-toggle-group">
                  <button
                    type="button"
                    className={`overlay-btn ${cadFilterMode ? "active" : ""}`}
                    onClick={() => setCadFilterMode((c) => !c)}
                    title="Przełącz schematyczny filtr architektoniczny CAD"
                  >
                    <Sparkles size={15} />
                    <span>{cadFilterMode ? "Styl CAD (włączony)" : "Oczyść do CAD"}</span>
                  </button>

                  <button
                    type="button"
                    className={`overlay-btn ${showBaguaOverlay ? "active" : ""}`}
                    onClick={() => setShowBaguaOverlay((s) => !s)}
                  >
                    <Layers size={15} />
                    <span>{showBaguaOverlay ? "Ukryj siatkę Bagua" : "Pokaż siatkę Bagua"}</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="primary-button run-analysis-btn"
                  onClick={handleRunAnalysis}
                  disabled={isGenerating}
                >
                  <Sparkles size={18} />
                  <span>{isGenerating ? "Generowanie analizy..." : "Analizuj Feng Shui"}</span>
                </button>
              </div>

              {/* PROGRESS BANNER */}
              {isGenerating ? (
                <div className="generation-progress-overlay">
                  <div className="generation-progress-card">
                    <div className="progress-spinner" />
                    <strong>Silnik AI oblicza parametry przestrzenne</strong>
                    <p>{generationStep}</p>
                  </div>
                </div>
              ) : null}

              {errorMessage ? (
                <div className="workspace-error-toast" role="alert">
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                  <button type="button" onClick={() => setErrorMessage(null)}>✕</button>
                </div>
              ) : null}
            </div>
          )}
        </main>

        {/* ================= RIGHT FENG SHUI INTELLIGENCE PANEL ================= */}
        <aside className="workspace-intel-panel" aria-label="Inteligencja Feng Shui">
          <div className="intel-panel-header">
            <Sparkles size={18} />
            <h2>Inteligentny asystent Feng Shui</h2>
          </div>

          <div className="intel-panel-scroll">
            {/* CONTEXTUAL ITEM CARD */}
            {selectedMarker && selectedMarker.category === "furniture" ? (
              <div className="intel-card contextual-focus">
                <div className="intel-card-head">
                  <span className="focus-pill">Zaznaczony mebel</span>
                  <strong>{selectedMarker.label} ({selectedMarker.facingDeg ?? 0}°)</strong>
                </div>

                {selectedMarker.label === "Łóżko" ? (
                  <div className="focus-body">
                    <p><strong>Pozycja dominująca wezgłowia:</strong> Wezgłowie powinno przylegać do pełnej ściany, bez okna za głową i poza bezpośrednią osią drzwi (Pozycja Trumienna).</p>
                    {kuaData ? (
                      <div className="kua-focus-highlight">
                        <strong>Kua {kuaData.kua} ({activeResident.label}):</strong>
                        <span>Zalecany kierunek wezgłowia: {kuaData.shengChi} lub {kuaData.tianYi}.</span>
                      </div>
                    ) : null}
                  </div>
                ) : selectedMarker.label === "Biurko" ? (
                  <div className="focus-body">
                    <p><strong>Pozycja dowodzenia:</strong> Siedzący powinien widzieć drzwi wejściowe z oparciem ściany za plecami, unikając cienia na biurku.</p>
                    {kuaData ? (
                      <div className="kua-focus-highlight">
                        <strong>Kua {kuaData.kua} ({activeResident.label}):</strong>
                        <span>Kierunek wzroku sprzyjający pracy: {kuaData.shengChi} (Sukces) / {kuaData.fuWei} (Koncentracja).</span>
                      </div>
                    ) : null}
                  </div>
                ) : selectedMarker.label === "Lustro" ? (
                  <div className="focus-body">
                    <p><strong>Zasada odbicia Qi:</strong> Stożek światła na symbolu wskazuje kierunek odbicia. Nie odbijaj łóżka ani drzwi wejściowych!</p>
                  </div>
                ) : (
                  <div className="focus-body">
                    <p>Oparcie i stabilność mebla zapewniają spokojny przepływ energii Qi w pokoju.</p>
                  </div>
                )}
              </div>
            ) : null}

            {/* CONSULTATION GOALS & METADATA CARD */}
            <div className="intel-card">
              <div className="intel-card-head">
                <Lightbulb size={16} />
                <strong>Cel konsultacji & Parametry</strong>
              </div>
              <div className="consultation-intel-body" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label className="res-field-label" style={{ display: "block", marginBottom: "4px", fontSize: "0.75rem", fontWeight: 700, color: "var(--ink)" }}>
                    Główny cel audytu:
                  </label>
                  <select
                    className="res-name-input"
                    value={consultationPurpose}
                    onChange={(e) => setConsultationPurpose(e.target.value)}
                    style={{ width: "100%", fontSize: "0.8rem", padding: "6px 8px" }}
                  >
                    <option value="Wszystko (Kompleksowy audyt: sen, praca, relacje, finanse, zdrowie)">
                      Wszystko (Kompleksowy audyt: sen, praca, relacje, finanse, zdrowie)
                    </option>
                    <option value="Sen & Zdrowie (Głęboka regeneracja nocna i ochrona sypialni)">
                      Sen & Zdrowie (Głęboka regeneracja nocna i ochrona sypialni)
                    </option>
                    <option value="Kariera & Biznes (Maksymalizacja koncentracji, pozycji dowodzenia i dochodów)">
                      Kariera & Biznes (Maksymalizacja koncentracji i dochodów)
                    </option>
                    <option value="Relacje & Rodzina (Harmonizacja domowników, spokój i redukcja napięć)">
                      Relacje & Rodzina (Harmonizacja domowników i spokój)
                    </option>
                    <option value="Zakup / Wykończenie (Audyt przedzakupowy lokalu i aranżacja przestrzeni)">
                      Zakup / Wykończenie (Audyt przedzakupowy i aranżacja)
                    </option>
                  </select>
                </div>

                <div style={{ marginTop: "2px" }}>
                  <label className="res-field-label" style={{ display: "block", marginBottom: "4px", fontSize: "0.75rem", fontWeight: 700, color: "var(--ink)" }}>
                    Kondygnacja analizowanego rzutu:
                  </label>
                  <select
                    className="res-name-input"
                    value={floorLevel}
                    onChange={(e) => setFloorLevel(e.target.value)}
                    style={{ width: "100%", fontSize: "0.8rem", padding: "6px 8px" }}
                  >
                    <option value="Parter / Mieszkanie jednopoziomowe">Parter / Mieszkanie jednopoziomowe (Główne wejście)</option>
                    <option value="Piętro / Poddasze (dom wielopoziomowy)">Piętro / Poddasze (Wejście przez schody)</option>
                    <option value="Przyziemie / Piwnica">Przyziemie / Piwnica</option>
                  </select>
                </div>

                <div className="form-row-compact" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <label>
                    <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Metraż (m²):</span>
                    <input
                      type="number"
                      value={usableAreaM2}
                      onChange={(e) => setUsableAreaM2(Number(e.target.value) || 0)}
                      style={{ width: "100%", padding: "4px 6px", fontSize: "0.8rem" }}
                    />
                  </label>
                  <label>
                    <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Kondygnacje:</span>
                    <input
                      type="number"
                      value={levelsCount}
                      min={1}
                      max={4}
                      onChange={(e) => setLevelsCount(Number(e.target.value) || 1)}
                      style={{ width: "100%", padding: "4px 6px", fontSize: "0.8rem" }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* SURROUNDINGS / OTOCZENIE ZEWNĘTRZNE CARD */}
            <div className="intel-card">
              <div className="intel-card-head">
                <Compass size={16} />
                <strong>Otoczenie zewnętrzne i ulica (Szkoła Formy)</strong>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label className="res-field-label" style={{ display: "block", marginBottom: "4px", fontSize: "0.74rem", fontWeight: 700, color: "var(--ink)" }}>
                    Droga dojazdowa / ruch:
                  </label>
                  <select
                    className="res-name-input"
                    value={roadType}
                    onChange={(e) => setRoadType(e.target.value)}
                    style={{ width: "100%", fontSize: "0.78rem", padding: "5px 8px" }}
                  >
                    <option value="Spokojna ulica osiedlowa">Spokojna ulica osiedlowa (płynny ruch)</option>
                    <option value="Ruchliwa arteria miejska">Ruchliwa ulica / arteria miejska (szybka energia)</option>
                    <option value="Ślepa uliczka (sięgacz)">Ślepa uliczka / sięgacz (akumulacja Qi)</option>
                    <option value="Strefa piesza / park">Strefa piesza / otoczenie zieleni</option>
                  </select>
                </div>

                <div>
                  <label className="res-field-label" style={{ display: "block", marginBottom: "4px", fontSize: "0.74rem", fontWeight: 700, color: "var(--ink)" }}>
                    Ukształtowanie i sąsiedztwo (4 Zwierzęta):
                  </label>
                  <select
                    className="res-name-input"
                    value={landscapeForm}
                    onChange={(e) => setLandscapeForm(e.target.value)}
                    style={{ width: "100%", fontSize: "0.78rem", padding: "5px 8px" }}
                  >
                    <option value="Wyższy budynek / wzniesienie z tyłu (Czarny Żółw - oparcie)">Wyższy budynek z tyłu (Stabilne oparcie Żółwia)</option>
                    <option value="Otwarta, jasna przestrzeń przed oknami (Czerwony Feniks)">Otwarta przestrzeń przed oknami (Feniks)</option>
                    <option value="Zieleń i budynki po bokach (Smok i Tygrys)">Zieleń i budynki po bokach (Smok i Tygrys)</option>
                    <option value="Płaski, gęsty teren miejski">Płaski, jednolity teren miejski</option>
                  </select>
                </div>

                <div>
                  <label className="res-field-label" style={{ display: "block", marginBottom: "4px", fontSize: "0.74rem", fontWeight: 700, color: "var(--ink)" }}>
                    Cechy otoczenia (Sha Qi):
                  </label>
                  <select
                    className="res-name-input"
                    value={shaQiHazards[0] || "Brak widocznych zagrożeń"}
                    onChange={(e) => setShaQiHazards([e.target.value])}
                    style={{ width: "100%", fontSize: "0.78rem", padding: "5px 8px" }}
                  >
                    <option value="Brak widocznych zagrożeń">Brak widocznych zagrożeń (Czyste otoczenie)</option>
                    <option value="Ostry narożnik sąsiedniego budynku w oknach">Ostry narożnik budynku w oknach (Zatruta Strzała)</option>
                    <option value="Słup energetyczny / transformator za oknem">Słup energetyczny / transformator w pobliżu</option>
                    <option value="Droga uderzająca prostopadle w budynek">Droga uderzająca prostopadle (T-skrzyżowanie)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* RESIDENTS PROFILE CARD */}
            <div className="intel-card">
              <div className="intel-card-head">
                <UserRound size={16} />
                <strong>Domownicy i osobiste Kua ({residents.length})</strong>
              </div>

              <div className="residents-intel-list">
                {residents.map((r, idx) => {
                  const kua = r.birthDate ? calculateKua(r.birthDate, r.gender) : null;
                  const hourPillar = r.birthTime ? calculateBaZiHourPillar(r.birthTime) : null;

                  return (
                    <div key={idx} className="resident-intel-item">
                      <div className="res-row-head">
                        <input
                          type="text"
                          className="res-name-input"
                          value={r.label}
                          onChange={(e) => handleUpdateResident(idx, { label: e.target.value })}
                          placeholder="Imię domownika"
                        />
                        <select
                          className="res-gender-select"
                          value={r.gender || "male"}
                          onChange={(e) => handleUpdateResident(idx, { gender: e.target.value as "male" | "female" })}
                        >
                          <option value="male">Mężczyzna</option>
                          <option value="female">Kobieta</option>
                        </select>
                        {residents.length > 1 ? (
                          <button
                            type="button"
                            className="res-del-btn"
                            onClick={() => handleRemoveResident(idx)}
                            title="Usuń domownika"
                          >
                            ✕
                          </button>
                        ) : null}
                      </div>

                      <div className="res-birth-row">
                        <div className="res-input-col">
                          <label className="res-field-label">Data urodzenia:</label>
                          <input
                            type="date"
                            value={r.birthDate}
                            onChange={(e) => handleUpdateResident(idx, { birthDate: e.target.value })}
                          />
                        </div>
                        <div className="res-input-col">
                          <label className="res-field-label">Godzina (opcjonalnie):</label>
                          <input
                            type="time"
                            value={r.birthTime || ""}
                            onChange={(e) => handleUpdateResident(idx, { birthTime: e.target.value })}
                            title="Godzina urodzenia (opcjonalnie) — pozwala obliczyć Filar Godziny BaZi"
                          />
                        </div>
                      </div>

                      {kua ? (
                        <div className="res-kua-summary">
                          <span className="kua-badge">Kua {kua.kua} · {kua.element} ({kua.group})</span>
                          <small className="kua-dirs-text">✨ Sprzyjające: {kua.shengChi}, {kua.tianYi}</small>
                          {hourPillar ? (
                            <small className="kua-hour-text">⏳ Filar Godziny BaZi: {hourPillar.animal} ({hourPillar.element})</small>
                          ) : (
                            <small className="kua-hour-hint">💡 Godzina pozwala obliczyć Filar Godziny BaZi</small>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="secondary-button compact-btn add-res-btn"
                  onClick={handleAddResident}
                >
                  + Dodaj kolejnego domownika
                </button>
              </div>
            </div>

            {/* FLYING STAR / BUILDING PERIOD */}
            <div className="intel-card">
              <div className="intel-card-head">
                <CalendarClock size={16} />
                <strong>Okres budynku i gwiazdy</strong>
              </div>
              <div className="building-period-intel">
                <div className="form-row-compact">
                  <label>
                    <span>Rok budowy:</span>
                    <input
                      type="number"
                      value={constructionYear}
                      onChange={(e) => setConstructionYear(e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Remont:</span>
                    <input
                      type="number"
                      value={renovationYear}
                      placeholder="brak"
                      onChange={(e) => setRenovationYear(e.target.value)}
                    />
                  </label>
                </div>
                <div className="period-badge-box">
                  <strong>Okres {buildingPeriodData.period} ({buildingPeriodData.range})</strong>
                  <p>Żywioł wiodący: {buildingPeriodData.element} · {buildingPeriodData.rulingEnergy}</p>
                </div>
              </div>
            </div>

            {/* READINESS CHECKLIST */}
            <div className="intel-card">
              <div className="intel-card-head">
                <CheckCircle2 size={16} />
                <strong>Gotowość do pełnego audytu</strong>
              </div>
              <ul className="readiness-list">
                <li className={previewUrl ? "ready" : "pending"}>
                  <span>{previewUrl ? "✓ Rzut lokalu wgrany" : "○ Wgraj plan mieszkania"}</span>
                </li>
                <li className={northConfirmed ? "ready" : "pending"}>
                  <span>{northConfirmed ? "✓ Orientacja N zatwierdzona" : "○ Ustaw kierunek Północy (N)"}</span>
                </li>
                <li className={planMarkers.length >= 2 ? "ready" : "pending"}>
                  <span>{planMarkers.length >= 2 ? `✓ Naniesiono ${planMarkers.length} elementów` : "○ Oznacz kluczowe meble (łóżko/biurko)"}</span>
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {/* REPORT MODAL / DRAWER */}
      <ReportModal
        report={report}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onNewAudit={() => {
          setIsReportModalOpen(false);
          setPlanMarkers([]);
          setSelectedPlanMarkerId(null);
        }}
        planFile={files[0] ?? null}
        northAngleDeg={northAngle}
        planMarkers={planMarkers}
      />
    </div>
  );
}

function getInitials(name: string): string {
  if (!name) return "G";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getShortDirectionLabel(deg: number): string {
  const norm = normalizeAngle(deg);
  if (norm >= 337.5 || norm < 22.5) return "Północ (N)";
  if (norm >= 22.5 && norm < 67.5) return "Pn-Wsch (NE)";
  if (norm >= 67.5 && norm < 112.5) return "Wschód (E)";
  if (norm >= 112.5 && norm < 157.5) return "Pd-Wsch (SE)";
  if (norm >= 157.5 && norm < 202.5) return "Południe (S)";
  if (norm >= 202.5 && norm < 247.5) return "Pd-Zach (SW)";
  if (norm >= 247.5 && norm < 292.5) return "Zachód (W)";
  return "Pn-Zach (NW)";
}

function renderLargeCenterNorthCompass(angle: number) {
  return (
    <svg viewBox="0 0 160 160" width="160" height="160" aria-label="Duża tarcza kalibracji Północy">
      {/* Outer Crisp Disc */}
      <circle cx="80" cy="80" r="76" fill="#FFFFFF" fillOpacity="0.96" stroke="#1A2B27" strokeWidth="2.5" />
      <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(26, 43, 39, 0.22)" strokeWidth="1" strokeDasharray="3 3" />

      {/* Fixed Cardinal Marks */}
      <text x="80" y="22" fill="#1A2B27" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">N</text>
      <text x="144" y="85" fill="#1A2B27" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">E</text>
      <text x="80" y="148" fill="#1A2B27" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">S</text>
      <text x="16" y="85" fill="#1A2B27" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">W</text>

      {/* Rotating Main Arrow */}
      <g transform={`rotate(${angle} 80 80)`}>
        {/* North Arrowhead: Solid Dark Left, Cream Right with Bold Border */}
        <polygon points="80,18 92,80 80,72" fill="#1A2B27" stroke="#1A2B27" strokeWidth="1.5" />
        <polygon points="80,18 68,80 80,72" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="1.5" />

        {/* South Needle */}
        <polygon points="80,142 88,80 80,88" fill="#52645D" stroke="#1A2B27" strokeWidth="1.2" />
        <polygon points="80,142 72,80 80,88" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.2" />

        {/* Center Brass Pivot */}
        <circle cx="80" cy="80" r="7" fill="#C49544" stroke="#1A2B27" strokeWidth="2" />
        <circle cx="80" cy="80" r="2.5" fill="#FFFFFF" />

        {/* Bold N at needle tip */}
        <text x="80" y="15" fill="#C49544" fontSize="12" fontWeight="900" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">N</text>
      </g>
    </svg>
  );
}

function renderNorthCompassRose(angle: number) {
  return (
    <svg viewBox="0 0 50 50" className="architectural-compass-svg" width="46" height="46" aria-label="Kierunek Północy N">
      {/* Clean White Architectural Disc with Thin CAD Border */}
      <circle cx="25" cy="25" r="22" fill="#FFFFFF" fillOpacity="0.95" stroke="#1A2B27" strokeWidth="1.3" />
      <circle cx="25" cy="25" r="19.5" fill="none" stroke="rgba(26, 43, 39, 0.16)" strokeWidth="0.6" />

      {/* Rotating Architectural Needle */}
      <g transform={`rotate(${angle} 25 25)`}>
        {/* North Arrowhead: Black Solid Left, White Right (Classic CAD Standard) */}
        <polygon points="25,7 28.5,24 25,21.5" fill="#1A2B27" stroke="#1A2B27" strokeWidth="0.6" />
        <polygon points="25,7 21.5,24 25,21.5" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="0.6" />

        {/* South Needle Line */}
        <line x1="25" y1="21.5" x2="25" y2="41" stroke="#1A2B27" strokeWidth="1.2" />

        {/* Center Point */}
        <circle cx="25" cy="25" r="2" fill="#1A2B27" />

        {/* Clean, Bold 'N' above the arrow */}
        <text x="25" y="6" fill="#1A2B27" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">N</text>
      </g>
    </svg>
  );
}

function renderFixedCadSymbolSvg(label: string, flipX?: boolean) {
  if (label.includes("Drzwi wejściowe") || label.includes("Drzwi wewnętrzne") || (label.includes("Drzwi") && !label.includes("balkonowe"))) {
    const isMain = label.includes("wejściowe");
    return (
      <svg
        viewBox="0 0 72 72"
        className={`arch-fixed-svg door-svg ${isMain ? "main-door" : "interior-door"}`}
        aria-hidden="true"
        style={{ transform: flipX ? "scaleX(-1)" : "none" }}
      >
        <rect x="6" y="56" width="6" height="8" fill="#1A2B27" stroke="#1A2B27" strokeWidth="1" />
        <rect x="60" y="56" width="6" height="8" fill="#1A2B27" stroke="#1A2B27" strokeWidth="1" />
        <line x1="12" y1="60" x2="60" y2="60" stroke="#7A6E5D" strokeWidth="1.2" strokeDasharray="2 2" />
        <path d="M 12 12 A 48 48 0 0 1 60 60" fill="none" stroke={isMain ? "#2B536D" : "#52645D"} strokeWidth={isMain ? 1.6 : 1.3} strokeDasharray="3 2" />
        <line x1="12" y1="60" x2="12" y2="12" stroke="#1A2B27" strokeWidth={isMain ? 2.6 : 2.0} />
        <circle cx="16" cy="18" r="1.8" fill={isMain ? "#C49544" : "#1A2B27"} />
      </svg>
    );
  }
  if (label.includes("Drzwi balkonowe")) {
    return (
      <svg
        viewBox="0 0 72 72"
        className="arch-fixed-svg balcony-door-svg"
        aria-hidden="true"
        style={{ transform: flipX ? "scaleX(-1)" : "none" }}
      >
        <rect x="4" y="56" width="6" height="8" fill="#1A2B27" />
        <rect x="62" y="56" width="6" height="8" fill="#1A2B27" />
        <path d="M 10 28 A 28 28 0 0 1 36 60" fill="none" stroke="#2B536D" strokeWidth="1.3" strokeDasharray="2 2" />
        <path d="M 62 28 A 28 28 0 0 0 36 60" fill="none" stroke="#2B536D" strokeWidth="1.3" strokeDasharray="2 2" />
        <line x1="10" y1="60" x2="10" y2="28" stroke="#1A2B27" strokeWidth="2" />
        <line x1="62" y1="60" x2="62" y2="28" stroke="#1A2B27" strokeWidth="2" />
      </svg>
    );
  }
  if (label === "Okno") {
    return (
      <svg viewBox="0 0 72 72" className="arch-fixed-svg window-svg" aria-hidden="true">
        <rect x="4" y="24" width="8" height="24" fill="#1A2B27" />
        <rect x="60" y="24" width="8" height="24" fill="#1A2B27" />
        <line x1="12" y1="26" x2="60" y2="26" stroke="#1A2B27" strokeWidth="2" />
        <line x1="12" y1="46" x2="60" y2="46" stroke="#1A2B27" strokeWidth="2" />
        <line x1="12" y1="33" x2="60" y2="33" stroke="#2B536D" strokeWidth="1.5" />
        <line x1="12" y1="39" x2="60" y2="39" stroke="#73A8C7" strokeWidth="1.5" />
        <line x1="36" y1="26" x2="36" y2="46" stroke="#1A2B27" strokeWidth="1.8" />
      </svg>
    );
  }
  if (label === "Pion wod-kan" || label === "Komin / Wentylacja") {
    return (
      <svg viewBox="0 0 72 72" className="arch-fixed-svg shaft-svg" aria-hidden="true">
        <rect x="14" y="14" width="44" height="44" fill="#E8EEF2" stroke="#1A2B27" strokeWidth="2" />
        <line x1="14" y1="14" x2="58" y2="58" stroke="#2B536D" strokeWidth="1.5" />
        <line x1="14" y1="58" x2="58" y2="14" stroke="#2B536D" strokeWidth="1.5" />
        <circle cx="36" cy="36" r="6" fill="#2B536D" />
      </svg>
    );
  }
  if (label === "Ściana nośna" || label === "Słup konstrukcyjny") {
    return (
      <svg viewBox="0 0 72 72" className="arch-fixed-svg wall-svg" aria-hidden="true">
        <rect x="10" y="22" width="52" height="28" fill="#1A2B27" stroke="#1A2B27" strokeWidth="2" />
        <line x1="18" y1="22" x2="18" y2="50" stroke="#FFFFFF" strokeWidth="1.2" strokeDasharray="2 2" />
        <line x1="36" y1="22" x2="36" y2="50" stroke="#FFFFFF" strokeWidth="1.2" strokeDasharray="2 2" />
        <line x1="54" y1="22" x2="54" y2="50" stroke="#FFFFFF" strokeWidth="1.2" strokeDasharray="2 2" />
      </svg>
    );
  }
  if (label.includes("Schody")) {
    const isDown = label.includes("w dół");
    return (
      <svg viewBox="0 0 72 72" className="arch-fixed-svg stairs-svg" aria-hidden="true">
        <rect x="10" y="10" width="52" height="52" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="1.6" />
        <line x1="10" y1="18" x2="62" y2="18" stroke="#1A2B27" strokeWidth="1.1" />
        <line x1="10" y1="26" x2="62" y2="26" stroke="#1A2B27" strokeWidth="1.1" />
        <line x1="10" y1="34" x2="62" y2="34" stroke="#1A2B27" strokeWidth="1.1" />
        <line x1="10" y1="42" x2="62" y2="42" stroke="#1A2B27" strokeWidth="1.1" />
        <line x1="10" y1="50" x2="62" y2="50" stroke="#1A2B27" strokeWidth="1.1" />
        <line x1="10" y1="58" x2="62" y2="58" stroke="#1A2B27" strokeWidth="1.1" />

        {isDown ? (
          <g>
            <path d="M 36 16 L 36 56 M 31 48 L 36 56 L 41 48" stroke="#8C3A27" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <circle cx="36" cy="16" r="2.5" fill="#8C3A27" />
          </g>
        ) : (
          <g>
            <path d="M 36 56 L 36 16 M 31 24 L 36 16 L 41 24" stroke="#2D5A46" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <circle cx="36" cy="56" r="2.5" fill="#2D5A46" />
          </g>
        )}
      </svg>
    );
  }
  return null;
}

function renderCadSymbolSvg(furn: string) {
  if (furn === "Łóżko") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg bed-svg" aria-hidden="true">
        <rect x="14" y="8" width="44" height="5" fill="#C49544" stroke="#1A2B27" strokeWidth="1.6" />
        <rect x="16" y="13" width="40" height="51" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="1.6" />
        <rect x="19" y="16" width="15" height="11" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.2" />
        <rect x="38" y="16" width="15" height="11" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.2" />
        <line x1="16" y1="36" x2="56" y2="36" stroke="#C49544" strokeWidth="1.4" strokeDasharray="3 2" />
      </svg>
    );
  }
  if (furn === "Biurko") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg desk-svg" aria-hidden="true">
        <rect x="12" y="12" width="48" height="26" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="1.6" />
        <rect x="23" y="15" width="26" height="4" fill="#1A2B27" stroke="#1A2B27" strokeWidth="1" />
        <rect x="27" y="23" width="18" height="8" fill="#FAF7F2" stroke="#C49544" strokeWidth="1.1" />
        <circle cx="36" cy="51" r="8.5" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="1.6" />
        <path d="M 31 51 Q 36 45 41 51" stroke="#C49544" strokeWidth="1.8" fill="none" strokeLinecap="square" />
        <line x1="36" y1="38" x2="36" y2="42.5" stroke="#1A2B27" strokeWidth="1.6" />
      </svg>
    );
  }
  if (furn === "Sofa") {
    return (
      <svg viewBox="0 0 84 38" className="arch-furniture-svg sofa-svg" aria-hidden="true">
        <rect x="4" y="3" width="76" height="9" rx="2" fill="#5C4724" stroke="#1A2B27" strokeWidth="1.6" />
        <rect x="4" y="12" width="10" height="23" rx="2" fill="#5C4724" stroke="#1A2B27" strokeWidth="1.6" />
        <rect x="70" y="12" width="10" height="23" rx="2" fill="#5C4724" stroke="#1A2B27" strokeWidth="1.6" />
        <rect x="14" y="12" width="18.5" height="21" rx="1.5" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="1.4" />
        <rect x="32.5" y="12" width="19" height="21" rx="1.5" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="1.4" />
        <rect x="51.5" y="12" width="18.5" height="21" rx="1.5" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="1.4" />
      </svg>
    );
  }
  if (furn === "Lustro") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg mirror-svg" aria-hidden="true">
        <rect x="16" y="8" width="40" height="5" fill="#1A2B27" stroke="#C49544" strokeWidth="1.4" />
        <path d="M 16 13 L 6 56 L 66 56 L 56 13 Z" fill="rgba(59, 122, 107, 0.12)" stroke="rgba(59, 122, 107, 0.45)" strokeWidth="1.2" strokeDasharray="3 2" />
        <circle cx="36" cy="38" r="3" fill="#C49544" />
      </svg>
    );
  }
  if (furn === "Szafa" || furn === "Garderoba") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg storage-svg" aria-hidden="true">
        <rect x="8" y="10" width="56" height="36" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="1.8" />
        <line x1="12" y1="24" x2="60" y2="24" stroke="#8C6D38" strokeWidth="1.4" strokeDasharray="3 2" />
        <line x1="8" y1="46" x2="22" y2="64" stroke="#1A2B27" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 8 46 A 24 24 0 0 0 22 64" fill="none" stroke="#C49544" strokeWidth="1.2" strokeDasharray="2 2" />
        <line x1="64" y1="46" x2="50" y2="64" stroke="#1A2B27" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 64 46 A 24 24 0 0 1 50 64" fill="none" stroke="#C49544" strokeWidth="1.2" strokeDasharray="2 2" />
      </svg>
    );
  }
  if (furn === "Stół jadalny") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg table-svg" aria-hidden="true">
        <rect x="20" y="20" width="32" height="32" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="1.8" />
        <circle cx="36" cy="36" r="3.5" fill="#EAE4D6" stroke="#C49544" strokeWidth="1" />
        <rect x="24" y="9" width="24" height="7" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.4" />
        <rect x="24" y="56" width="24" height="7" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.4" />
        <rect x="9" y="24" width="7" height="24" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.4" />
        <rect x="56" y="24" width="7" height="24" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.4" />
      </svg>
    );
  }
  if (furn === "Płyta kuchenna") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg stove-svg" aria-hidden="true">
        <rect x="12" y="12" width="48" height="48" fill="#1A2B27" stroke="#1A2B27" strokeWidth="1.8" rx="2" />
        <circle cx="25" cy="25" r="7" fill="none" stroke="#C49544" strokeWidth="1.8" />
        <circle cx="25" cy="25" r="3" fill="#C49544" />
        <circle cx="47" cy="25" r="5" fill="none" stroke="#C49544" strokeWidth="1.6" />
        <circle cx="47" cy="25" r="2" fill="#C49544" />
        <circle cx="25" cy="47" r="5" fill="none" stroke="#C49544" strokeWidth="1.6" />
        <circle cx="25" cy="47" r="2" fill="#C49544" />
        <circle cx="47" cy="47" r="8" fill="none" stroke="#C49544" strokeWidth="1.8" />
        <circle cx="47" cy="47" r="3.5" fill="#C49544" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 72 72" className="arch-furniture-svg generic-svg" aria-hidden="true">
      <rect x="14" y="14" width="44" height="44" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="1.8" />
      <path d="M 36 46 L 36 22 M 28 30 L 36 20 L 44 30" stroke="#C49544" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}
