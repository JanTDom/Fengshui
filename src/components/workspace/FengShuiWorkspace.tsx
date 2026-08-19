import { useState, useRef, useEffect, type ChangeEvent, type PointerEvent, type MouseEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Compass,
  FileUp,
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
import { calculateKua } from "../../lib/kuaEngine";
import { getBuildingPeriod } from "../../lib/natalChartEngine";
import { triggerBrandConfetti } from "../../lib/confetti";

interface FengShuiWorkspaceProps {
  userEmail: string;
  selectedPlanId: string;
  propertyKey: PropertyKey;
  onExitToHome: () => void;
}

type AnnotationMode = "room" | "fixed" | "furniture";

const roomFunctionOptions = [
  "Salon",
  "Sypialnia główna",
  "Sypialnia dziecka",
  "Gabinet / Biuro",
  "Kuchnia",
  "Jadalnia",
  "Łazienka",
  "Przedpokój / Hol",
  "Garderoba",
  "Balkon / Taras",
  "Pralnia",
  "Pomieszczenie gosp."
];

const fixedElementOptions = [
  "Drzwi wejściowe",
  "Okno",
  "Drzwi balkonowe",
  "Schody",
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
  onExitToHome
}: FengShuiWorkspaceProps) {
  const [projectTitle, setProjectTitle] = useState("Mój Dom - Aranżacja & Feng Shui");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanTool, setScanTool] = useState<"north" | "marker">("north");
  const [annotationMode, setAnnotationMode] = useState<AnnotationMode>("furniture");
  const [selectedMarkerLabel, setSelectedMarkerLabel] = useState<string>("Łóżko");
  const [selectedPlanMarkerId, setSelectedPlanMarkerId] = useState<string | null>(null);
  const [planMarkers, setPlanMarkers] = useState<PlanMarker[]>([]);
  const [northAngle, setNorthAngle] = useState(0);
  const [northConfirmed, setNorthConfirmed] = useState(false);
  const [showBaguaOverlay, setShowBaguaOverlay] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Furniture adjustment state
  const [furnitureDirection, setFurnitureDirection] = useState(0);
  const [furnitureScale, setFurnitureScale] = useState(1.0);
  const [furnitureOrientationRole, setFurnitureOrientationRole] = useState(
    defaultFurnitureOrientationRole("Łóżko")
  );

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
  const lastMarkerPointerTimeRef = useRef(0);
  const suppressScanClickRef = useRef(false);
  const [isDraggingNorth, setIsDraggingNorth] = useState(false);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);

  // Load sample plan
  async function handleLoadSamplePlan() {
    try {
      const response = await fetch("/assets/floor-plan-premium.webp");
      const blob = await response.blob();
      const file = new File([blob], "rzut_mieszkania_64m2.webp", { type: "image/webp" });
      setFiles([file]);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
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
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) return;

    const validation = validateAuditFiles(selectedFiles);
    if (validation) {
      setErrorMessage(validation);
      return;
    }

    setErrorMessage(null);
    setFiles(selectedFiles);
    const url = URL.createObjectURL(selectedFiles[0]);
    setPreviewUrl(url);
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
    if (Date.now() - lastMarkerPointerTimeRef.current < 400) return;
    if (suppressScanClickRef.current) {
      suppressScanClickRef.current = false;
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest(".plan-marker-wrapper, .marker-floating-actions, .floating-north-compass, button")) return;

    if (scanTool === "north") return;

    const img = planImageRef.current;
    const rect = img && img.clientWidth > 0 ? img.getBoundingClientRect() : event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const xPercent = Math.max(1, Math.min(99, ((event.clientX - rect.left) / rect.width) * 100));
    const yPercent = Math.max(1, Math.min(99, ((event.clientY - rect.top) / rect.height) * 100));

    const newMarkerId = `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
    const isFurniture = annotationMode === "furniture";
    const assignedResident = isFurniture && (selectedMarkerLabel === "Łóżko" || selectedMarkerLabel === "Biurko")
      ? (residents[0]?.label || null)
      : null;

    const newMarker: PlanMarker = {
      id: newMarkerId,
      label: selectedMarkerLabel,
      category: annotationMode,
      xPercent: Number(xPercent.toFixed(2)),
      yPercent: Number(yPercent.toFixed(2)),
      facingDeg: isFurniture ? furnitureDirection : null,
      scale: isFurniture ? furnitureScale : undefined,
      orientationRole: isFurniture ? furnitureOrientationRole : null,
      assignedResidentLabel: assignedResident
    };

    setPlanMarkers((curr) => [...curr, newMarker]);
    setSelectedPlanMarkerId(newMarkerId);
  }

  function handleMarkerPointerDown(marker: PlanMarker, event: PointerEvent<HTMLDivElement>) {
    lastMarkerPointerTimeRef.current = Date.now();
    event.stopPropagation();
    event.preventDefault();
    setSelectedPlanMarkerId(marker.id);
    setDraggingMarkerId(marker.id);
    if (marker.category === "furniture") {
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

    if (scanTool === "north" && isDraggingNorth) {
      const rect = event.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rad = Math.atan2(event.clientY - centerY, event.clientX - centerX);
      let deg = Math.round(rad * (180 / Math.PI) + 90);
      deg = normalizeAngle(deg);
      setNorthAngle(deg);
    }
  }

  function handleCanvasPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDraggingNorth(false);
    setDraggingMarkerId(null);
  }

  function handleUpdateSelectedMarker(updates: Partial<PlanMarker>) {
    if (!selectedPlanMarkerId) return;
    setPlanMarkers((curr) =>
      curr.map((m) => (m.id === selectedPlanMarkerId ? { ...m, ...updates } : m))
    );
  }

  function handleRotateSelectedMarker(step = 45) {
    if (!selectedPlanMarkerId) return;
    const current = planMarkers.find((m) => m.id === selectedPlanMarkerId);
    const nextDeg = normalizeAngle((current?.facingDeg ?? 0) + step);
    setFurnitureDirection(nextDeg);
    handleUpdateSelectedMarker({ facingDeg: nextDeg });
  }

  function handleScaleSelectedMarker(delta: number) {
    if (!selectedPlanMarkerId) return;
    const current = planMarkers.find((m) => m.id === selectedPlanMarkerId);
    const nextScale = Math.max(0.6, Math.min(2.5, Number(((current?.scale ?? 1.0) + delta).toFixed(2))));
    setFurnitureScale(nextScale);
    handleUpdateSelectedMarker({ scale: nextScale });
  }

  function handleDeleteSelectedMarker() {
    if (!selectedPlanMarkerId) return;
    suppressScanClickRef.current = true;
    setPlanMarkers((curr) => curr.filter((m) => m.id !== selectedPlanMarkerId));
    setSelectedPlanMarkerId(null);
    setTimeout(() => {
      suppressScanClickRef.current = false;
    }, 300);
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
        email: userEmail || "kontakt@e-fengshui.pl",
        planId: selectedPlanId,
        propertyType: propertyKey,
        levelsCount: 1,
        usableAreaM2: 64,
        purpose: "Aranżacja mebli i optymalizacja harmonii wnętrza",
        addressNote: "",
        orientationNote: northConfirmed ? "Północ zatwierdzona przez użytkownika." : "",
        entryNote: "Drzwi wejściowe oznaczone na planie",
        constraintsNote: "Bez wyburzania ścian nośnych",
        profileNote: "Komfort domowników i praca w skupieniu",
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
          renovationNote: ""
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
                  <p>Kliknij lub przeciągnij kompas na rzucie, aby dopasować orientację ścian.</p>
                </div>
                <div className="north-stepper-row">
                  <span>Kąt N: <strong>{northAngle}°</strong></span>
                  <div className="stepper-btns">
                    <button type="button" onClick={() => setNorthAngle((a) => normalizeAngle(a - 15))}>-15°</button>
                    <button type="button" onClick={() => setNorthAngle((a) => normalizeAngle(a + 15))}>+15°</button>
                    <button type="button" onClick={() => setNorthAngle(0)}>Reset (0°)</button>
                  </div>
                </div>
                <button
                  type="button"
                  className={`primary-button full-width ${northConfirmed ? "success-state" : ""}`}
                  onClick={() => {
                    setNorthConfirmed(true);
                    setScanTool("marker");
                  }}
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
                <div className="scan-canvas-stage">
                  <img
                    ref={planImageRef}
                    src={previewUrl}
                    alt="Rzut lokalu do aranżacji"
                    className="scan-image-elem"
                    draggable={false}
                  />

                  {/* ANNOTATION LAYER */}
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

                    {/* COMPASS OVERLAY */}
                    <div
                      className={`floating-north-compass ${scanTool === "north" ? "interactive" : ""}`}
                      style={{
                        transform: `rotate(${northAngle}deg)`,
                        top: "16px",
                        right: "16px"
                      }}
                      onPointerDown={() => scanTool === "north" && setIsDraggingNorth(true)}
                    >
                      <Compass size={40} className="compass-icon" />
                      <span className="compass-n-label">N</span>
                      <span className="compass-deg-badge">{northAngle}°</span>
                    </div>

                    {/* PLACED PLAN MARKERS */}
                    {planMarkers.map((marker) => {
                      const isSelected = marker.id === selectedPlanMarkerId;
                      const isFurniture = marker.category === "furniture";

                      return (
                        <div
                          key={marker.id}
                          className="plan-marker-wrapper"
                          style={{
                            left: `${marker.xPercent}%`,
                            top: `${marker.yPercent}%`
                          }}
                        >
                          <div
                            className={`plan-marker ${marker.category} ${isSelected ? "selected" : ""}`}
                            style={{
                              "--marker-facing": `${marker.facingDeg ?? 0}deg`,
                              "--marker-scale": marker.scale ?? 1.0
                            } as React.CSSProperties}
                            onPointerDown={(e) => handleMarkerPointerDown(marker, e)}
                          >
                            {isFurniture ? (
                              <div className="arch-furniture-piece">
                                {renderCadSymbolSvg(marker.label)}
                              </div>
                            ) : (
                              <div className="pin-marker-pill">
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
                          {isSelected && isFurniture ? (
                            <div className="marker-floating-actions" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="action-btn rotate"
                                onClick={() => handleRotateSelectedMarker(45)}
                                title="Obróć o 45°"
                              >
                                <RotateCw size={13} />
                                <span>{marker.facingDeg ?? 0}°</span>
                              </button>

                              <div className="action-stepper">
                                <button type="button" onClick={() => handleScaleSelectedMarker(-0.1)}>-</button>
                                <span>{Math.round((marker.scale ?? 1.0) * 100)}%</span>
                                <button type="button" onClick={() => handleScaleSelectedMarker(0.1)}>+</button>
                              </div>

                              <button
                                type="button"
                                className="action-btn resident-pick"
                                onClick={() => {
                                  const curName = marker.assignedResidentLabel;
                                  const nextRes = residents.find((r) => r.label !== curName) || null;
                                  handleUpdateSelectedMarker({ assignedResidentLabel: nextRes ? nextRes.label : null });
                                }}
                                title="Przypisz domownika"
                              >
                                <UserRound size={13} />
                                <span>{marker.assignedResidentLabel ? getInitials(marker.assignedResidentLabel) : "Osoba"}</span>
                              </button>

                              <button
                                type="button"
                                className="action-btn done"
                                onClick={() => setSelectedPlanMarkerId(null)}
                                title="Gotowe"
                              >
                                <CheckCircle2 size={13} />
                              </button>

                              <button
                                type="button"
                                className="action-btn delete"
                                onClick={handleDeleteSelectedMarker}
                                title="Usuń mebel"
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
                    className={`overlay-btn ${showBaguaOverlay ? "active" : ""}`}
                    onClick={() => setShowBaguaOverlay((s) => !s)}
                  >
                    <Layers size={15} />
                    <span>{showBaguaOverlay ? "Ukryj Bagua" : "Pokaż Siatkę Bagua"}</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="primary-button run-analysis-btn"
                  onClick={handleRunAnalysis}
                  disabled={isGenerating}
                >
                  <Sparkles size={18} />
                  <span>{isGenerating ? "Generowanie analizy..." : "ANALIZUJ FENG SHUI"}</span>
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
            <h2>Inteligentny Asystent Feng Shui</h2>
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

            {/* RESIDENTS PROFILE CARD */}
            <div className="intel-card">
              <div className="intel-card-head">
                <UserRound size={16} />
                <strong>Domownicy & Osobiste Kua ({residents.length})</strong>
              </div>

              <div className="residents-intel-list">
                {residents.map((r, idx) => {
                  const kua = r.birthDate ? calculateKua(r.birthDate, r.gender) : null;
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
                          <option value="male">M</option>
                          <option value="female">K</option>
                        </select>
                        {residents.length > 1 ? (
                          <button
                            type="button"
                            className="res-del-btn"
                            onClick={() => handleRemoveResident(idx)}
                          >
                            ✕
                          </button>
                        ) : null}
                      </div>

                      <div className="res-birth-row">
                        <input
                          type="date"
                          value={r.birthDate}
                          onChange={(e) => handleUpdateResident(idx, { birthDate: e.target.value })}
                        />
                      </div>

                      {kua ? (
                        <div className="res-kua-summary">
                          <span className="kua-badge">Kua {kua.kua} · {kua.element} ({kua.group})</span>
                          <small className="kua-dirs-text">✨ Sprzyjające: {kua.shengChi}, {kua.tianYi}</small>
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
                <strong>Okres Budynku & Gwiazdy</strong>
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

function renderCadSymbolSvg(furn: string) {
  if (furn === "Łóżko") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg bed-svg" aria-hidden="true">
        <rect x="14" y="8" width="44" height="6" rx="1.5" fill="#C49544" stroke="#1A2B27" strokeWidth="1.8" />
        <rect x="16" y="14" width="40" height="50" rx="2" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="1.8" />
        <rect x="19" y="17" width="15" height="11" rx="2.5" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.2" />
        <rect x="38" y="17" width="15" height="11" rx="2.5" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.2" />
        <line x1="16" y1="36" x2="56" y2="36" stroke="#C49544" strokeWidth="1.5" strokeDasharray="3 2" />
      </svg>
    );
  }
  if (furn === "Biurko") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg desk-svg" aria-hidden="true">
        <rect x="12" y="12" width="48" height="26" rx="2" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="1.8" />
        <rect x="23" y="15" width="26" height="5" rx="1" fill="#1A2B27" stroke="#1A2B27" strokeWidth="1" />
        <rect x="27" y="24" width="18" height="8" rx="1.5" fill="#FAF7F2" stroke="#C49544" strokeWidth="1.2" />
        <circle cx="36" cy="51" r="9" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="1.8" />
        <path d="M 31 51 Q 36 45 41 51" stroke="#C49544" strokeWidth="2" fill="none" strokeLinecap="round" />
        <line x1="36" y1="38" x2="36" y2="42" stroke="#1A2B27" strokeWidth="2" />
      </svg>
    );
  }
  if (furn === "Sofa") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg sofa-svg" aria-hidden="true">
        <path d="M 12 16 L 60 16 L 60 26 L 12 26 Z" fill="#D4A757" stroke="#1A2B27" strokeWidth="2" />
        <line x1="36" y1="16" x2="36" y2="26" stroke="#1A2B27" strokeWidth="1.5" strokeDasharray="2 2" />
        <rect x="12" y="26" width="10" height="30" rx="3" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="2" />
        <rect x="50" y="26" width="10" height="30" rx="3" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="2" />
        <rect x="22" y="26" width="14" height="30" rx="2" fill="#EAE4D6" stroke="#1A2B27" strokeWidth="1.8" />
        <rect x="36" y="26" width="14" height="30" rx="2" fill="#EAE4D6" stroke="#1A2B27" strokeWidth="1.8" />
      </svg>
    );
  }
  if (furn === "Lustro") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg mirror-svg" aria-hidden="true">
        <rect x="16" y="8" width="40" height="6" rx="1.5" fill="#1A2B27" stroke="#C49544" strokeWidth="1.5" />
        <path d="M 16 14 L 4 58 L 68 58 L 56 14 Z" fill="rgba(59, 122, 107, 0.12)" stroke="rgba(59, 122, 107, 0.45)" strokeWidth="1.2" strokeDasharray="3 2" />
        <circle cx="36" cy="40" r="3" fill="#C49544" />
      </svg>
    );
  }
  if (furn === "Szafa") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg storage-svg" aria-hidden="true">
        <rect x="10" y="16" width="52" height="40" rx="2" fill="#F4EFE6" stroke="#1A2B27" strokeWidth="2" />
        <line x1="36" y1="16" x2="36" y2="56" stroke="#1A2B27" strokeWidth="1.5" />
        <rect x="33" y="32" width="2" height="8" rx="0.5" fill="#C49544" stroke="#1A2B27" strokeWidth="0.8" />
        <rect x="37" y="32" width="2" height="8" rx="0.5" fill="#C49544" stroke="#1A2B27" strokeWidth="0.8" />
        <line x1="10" y1="16" x2="62" y2="16" stroke="#C49544" strokeWidth="2.5" />
      </svg>
    );
  }
  if (furn === "Stół jadalny") {
    return (
      <svg viewBox="0 0 72 72" className="arch-furniture-svg table-svg" aria-hidden="true">
        <rect x="20" y="20" width="32" height="32" rx="4" fill="#FAF7F2" stroke="#1A2B27" strokeWidth="2" />
        <circle cx="36" cy="36" r="4" fill="#EAE4D6" stroke="#C49544" strokeWidth="1" />
        <rect x="24" y="8" width="24" height="8" rx="2.5" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.5" />
        <rect x="24" y="56" width="24" height="8" rx="2.5" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.5" />
        <rect x="8" y="24" width="8" height="24" rx="2.5" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.5" />
        <rect x="56" y="24" width="8" height="24" rx="2.5" fill="#FFFFFF" stroke="#1A2B27" strokeWidth="1.5" />
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
