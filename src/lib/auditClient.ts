import type { AuditApiResponse, AuditFilePayload, AuditReport, AuditRequestPayload } from "../auditTypes";
import { hasSupabaseConfig, supabase } from "./supabase";

const MAX_FILE_BYTES = 6 * 1024 * 1024;
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
    return `Plik ${tooLarge.name} przekracza 6 MB. Na start przyjmujemy lżejsze plany.`;
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
  const response = await fetch("/api/generate-audit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Nie udało się wygenerować raportu. Spróbuj ponownie.");
  }

  return data as AuditApiResponse;
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
};

type SectorKey = "nw" | "n" | "ne" | "w" | "center" | "e" | "sw" | "s" | "se";

const sectorGrid: SectorKey[][] = [
  ["nw", "n", "ne"],
  ["w", "center", "e"],
  ["sw", "s", "se"]
];

const sectorFallback: Record<SectorKey, { direction: string; sector: string; element: string; current_use: string }> = {
  nw: { direction: "Północny zachód", sector: "pomocni ludzie", element: "metal", current_use: "do odczytu" },
  n: { direction: "Północ", sector: "kariera i przepływ", element: "woda", current_use: "do odczytu" },
  ne: { direction: "Północny wschód", sector: "wiedza i decyzje", element: "ziemia", current_use: "do odczytu" },
  w: { direction: "Zachód", sector: "kreatywność", element: "metal", current_use: "do odczytu" },
  center: { direction: "Centrum", sector: "równowaga domu", element: "ziemia", current_use: "do odczytu" },
  e: { direction: "Wschód", sector: "rodzina i rozwój", element: "drzewo", current_use: "do odczytu" },
  sw: { direction: "Południowy zachód", sector: "relacje", element: "ziemia", current_use: "do odczytu" },
  s: { direction: "Południe", sector: "widoczność", element: "ogień", current_use: "do odczytu" },
  se: { direction: "Południowy wschód", sector: "zasoby", element: "drzewo", current_use: "do odczytu" }
};

const sectorOverlayColors: Record<SectorKey, string> = {
  nw: "rgba(173, 126, 54, 0.27)",
  n: "rgba(66, 105, 125, 0.27)",
  ne: "rgba(139, 117, 76, 0.27)",
  w: "rgba(182, 163, 127, 0.28)",
  center: "rgba(205, 162, 70, 0.32)",
  e: "rgba(93, 132, 91, 0.28)",
  sw: "rgba(165, 126, 91, 0.28)",
  s: "rgba(184, 96, 70, 0.27)",
  se: "rgba(82, 126, 94, 0.28)"
};

function pdfSectorKey(direction: string | null | undefined): SectorKey | null {
  const value = String(direction ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  if (!value) return null;
  if (value.includes("centrum") || value.includes("srodek")) return "center";
  if (value.includes("polnoc") && value.includes("zach")) return "nw";
  if (value.includes("polnoc") && value.includes("wsch")) return "ne";
  if (value.includes("polnoc")) return "n";
  if (value.includes("polud") && value.includes("zach")) return "sw";
  if (value.includes("polud") && value.includes("wsch")) return "se";
  if (value.includes("polud")) return "s";
  if (value.includes("zach")) return "w";
  if (value.includes("wsch")) return "e";

  return null;
}

function pdfSectorByKey(sectors: AuditReport["sector_map"]) {
  const byKey = new Map<SectorKey, AuditReport["sector_map"][number]>();

  sectors.forEach((sector) => {
    const key = pdfSectorKey(sector.direction);
    if (key && !byKey.has(key)) {
      byKey.set(key, sector);
    }
  });

  return byKey;
}

function pdfConfidenceLabel(value: AuditReport["confidence"]) {
  if (value === "high") return "wysoka";
  if (value === "low") return "niska";
  return "średnia";
}

function pdfText(value: string | null | undefined, fallback = "do uzupełnienia") {
  const clean = String(value ?? "").trim();
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

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Nie udało się przygotować skanu do mapy sektorów."));
    image.src = src;
  });
}

function wrappedCanvasLines(context: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 2) {
  const words = pdfText(text, "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (context.measureText(next).width <= maxWidth || !current) {
      current = next;
      return;
    }

    lines.push(current);
    current = word;
  });

  if (current) {
    lines.push(current);
  }

  if (lines.length <= maxLines) {
    return lines;
  }

  const result = lines.slice(0, maxLines);
  const lastIndex = result.length - 1;
  while (result[lastIndex].length > 4 && context.measureText(`${result[lastIndex]}...`).width > maxWidth) {
    result[lastIndex] = result[lastIndex].slice(0, -1).trim();
  }
  result[lastIndex] = `${result[lastIndex]}...`;
  return result;
}

function drawCenteredCanvasLabel({
  context,
  x,
  y,
  width,
  direction,
  sector,
  element
}: {
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  direction: string;
  sector: string;
  element: string;
}) {
  context.save();
  context.textAlign = "center";
  context.textBaseline = "middle";

  const maxTextWidth = Math.max(82, width - 20);
  context.font = "700 18px Arial, sans-serif";
  const sectorLines = wrappedCanvasLines(context, sector, maxTextWidth, 2);
  context.font = "700 12px Arial, sans-serif";
  const directionLines = wrappedCanvasLines(context, direction, maxTextWidth, 1);
  context.font = "500 11px Arial, sans-serif";
  const elementLines = wrappedCanvasLines(context, element, maxTextWidth, 1);
  const lines = [...directionLines, ...sectorLines, ...elementLines];
  const lineHeight = 17;
  const boxHeight = lines.length * lineHeight + 16;
  const boxWidth = Math.min(width - 10, Math.max(96, Math.max(...lines.map((line) => context.measureText(line).width)) + 24));
  const left = x - boxWidth / 2;
  const top = y - boxHeight / 2;

  context.fillStyle = "rgba(255, 253, 250, 0.9)";
  context.strokeStyle = "rgba(16, 34, 31, 0.33)";
  context.lineWidth = 1.5;
  context.beginPath();
  context.rect(left, top, boxWidth, boxHeight);
  context.fill();
  context.stroke();

  let textY = top + 16;
  lines.forEach((line, lineIndex) => {
    context.font = lineIndex === 0 ? "700 12px Arial, sans-serif" : lineIndex === lines.length - 1 ? "500 11px Arial, sans-serif" : "700 18px Arial, sans-serif";
    context.fillStyle = lineIndex === 0 ? "#9d6a18" : lineIndex === lines.length - 1 ? "#53625b" : "#10221f";
    context.fillText(line, x, textY);
    textY += lineHeight;
  });

  context.restore();
}

function rotatedPoint(localX: number, localY: number, centerX: number, centerY: number, angleRad: number) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  return {
    x: centerX + localX * cos - localY * sin,
    y: centerY + localX * sin + localY * cos
  };
}

function drawNorthArrow(context: CanvasRenderingContext2D, width: number, height: number, angleRad: number, northAngleDeg: number) {
  const x = width - 82;
  const y = 74;

  context.save();
  context.fillStyle = "rgba(255, 253, 250, 0.92)";
  context.strokeStyle = "rgba(16, 34, 31, 0.34)";
  context.lineWidth = 1.5;
  context.beginPath();
  context.rect(x - 48, y - 48, 96, 96);
  context.fill();
  context.stroke();

  context.translate(x, y + 4);
  context.rotate(angleRad);
  context.strokeStyle = "#10221f";
  context.fillStyle = "#10221f";
  context.lineWidth = 5;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(0, 28);
  context.lineTo(0, -22);
  context.stroke();
  context.beginPath();
  context.moveTo(0, -34);
  context.lineTo(-11, -13);
  context.lineTo(11, -13);
  context.closePath();
  context.fill();
  context.restore();

  context.save();
  context.textAlign = "center";
  context.fillStyle = "#10221f";
  context.font = "700 18px Arial, sans-serif";
  context.fillText("N", x, y - 58);
  context.font = "500 12px Arial, sans-serif";
  context.fillStyle = "#53625b";
  context.fillText(`${Math.round(northAngleDeg)}°`, x, y + 58);
  context.restore();
}

async function createPlanSectorOverlayImage(
  file: File | null | undefined,
  report: AuditReport,
  northAngleDeg = 0
) {
  if (!file || !canUsePlanImageInPdf(file)) {
    return null;
  }

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImageElement(dataUrl);
  const maxSide = 1180;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
  const width = Math.max(600, Math.round((image.naturalWidth || image.width) * scale));
  const height = Math.max(600, Math.round((image.naturalHeight || image.height) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#fffdfa";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  context.fillStyle = "rgba(255, 253, 250, 0.12)";
  context.fillRect(0, 0, width, height);

  const angleRad = northAngleDeg * Math.PI / 180;
  const centerX = width / 2;
  const centerY = height / 2;
  const initialGridWidth = width * 0.82;
  const initialGridHeight = height * 0.82;
  const availableWidth = width * 0.91;
  const availableHeight = height * 0.91;
  const rotatedWidth = initialGridWidth * Math.abs(Math.cos(angleRad)) + initialGridHeight * Math.abs(Math.sin(angleRad));
  const rotatedHeight = initialGridWidth * Math.abs(Math.sin(angleRad)) + initialGridHeight * Math.abs(Math.cos(angleRad));
  const fitScale = Math.min(1, availableWidth / rotatedWidth, availableHeight / rotatedHeight);
  const gridWidth = initialGridWidth * fitScale;
  const gridHeight = initialGridHeight * fitScale;
  const cellWidth = gridWidth / 3;
  const cellHeight = gridHeight / 3;
  const sectors = pdfSectorByKey(report.sector_map);

  sectorGrid.forEach((row, rowIndex) => {
    row.forEach((key, columnIndex) => {
      const sector = sectors.get(key) ?? sectorFallback[key];
      const localX = -gridWidth / 2 + columnIndex * cellWidth;
      const localY = -gridHeight / 2 + rowIndex * cellHeight;

      context.save();
      context.translate(centerX, centerY);
      context.rotate(angleRad);
      context.fillStyle = sectorOverlayColors[key];
      context.strokeStyle = "rgba(255, 253, 250, 0.92)";
      context.lineWidth = 4;
      context.fillRect(localX, localY, cellWidth, cellHeight);
      context.strokeRect(localX, localY, cellWidth, cellHeight);
      context.restore();

      const labelCenter = rotatedPoint(localX + cellWidth / 2, localY + cellHeight / 2, centerX, centerY, angleRad);
      drawCenteredCanvasLabel({
        context,
        x: labelCenter.x,
        y: labelCenter.y,
        width: Math.min(cellWidth, 240),
        direction: sector.direction,
        sector: sector.sector,
        element: sector.element
      });
    });
  });

  context.save();
  context.strokeStyle = "rgba(16, 34, 31, 0.62)";
  context.lineWidth = 5;
  context.translate(centerX, centerY);
  context.rotate(angleRad);
  context.strokeRect(-gridWidth / 2, -gridHeight / 2, gridWidth, gridHeight);
  context.restore();

  drawNorthArrow(context, width, height, angleRad, northAngleDeg);

  return canvas.toDataURL("image/jpeg", 0.9);
}

function pdfCard(title: string, body: string, bullets: string[] = [], eyebrow = "") {
  const stack: any[] = [];

  if (eyebrow) {
    stack.push({ text: eyebrow, style: "cardEyebrow" });
  }

  stack.push({ text: title, style: "cardTitle" });
  stack.push({ text: body, style: "bodyText", margin: [0, 4, 0, bullets.length > 0 ? 8 : 0] });

  if (bullets.length > 0) {
    stack.push({
      ul: bullets,
      style: "bodyText",
      margin: [0, 2, 0, 0]
    });
  }

  return {
    table: {
      widths: ["*"],
      body: [[{ stack, margin: [13, 11, 13, 12] }]]
    },
    layout: {
      fillColor: () => "#fffdfa",
      hLineColor: () => "#d8cdb8",
      vLineColor: () => "#d8cdb8",
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0
    },
    margin: [0, 0, 0, 10]
  };
}

function pdfNumberedActionCard(action: AuditReport["priority_actions"][number], index: number) {
  return {
    table: {
      widths: ["*"],
      body: [[{
        columns: [
          {
            width: 25,
            table: {
              widths: ["*"],
              body: [[{ text: String(index), style: "priorityBadge", margin: [0, 5, 0, 5] }]]
            },
            layout: {
              fillColor: () => "#10221f",
              hLineColor: () => "#10221f",
              vLineColor: () => "#10221f"
            }
          },
          {
            width: "*",
            stack: [
              { text: pdfText(action.method), style: "cardEyebrow" },
              { text: pdfText(action.title), style: "cardTitle" },
              { text: pdfText(action.why), style: "bodyText", margin: [0, 4, 0, 7] },
              {
                text: `${pdfText(action.impact, "wpływ")} · ${pdfText(action.effort, "wysiłek")} · pewność ${pdfConfidenceLabel(action.confidence)}`,
                style: "mutedText"
              }
            ],
            margin: [8, 0, 0, 0]
          }
        ],
        columnGap: 2,
        margin: [12, 11, 12, 12]
      }]]
    },
    layout: {
      fillColor: () => "#fffdfa",
      hLineColor: () => "#d8cdb8",
      vLineColor: () => "#d8cdb8",
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0
    },
    margin: [0, 0, 0, 10]
  };
}

function pdfSectionTitle(title: string, subtitle?: string) {
  return [
    { text: title, style: "sectionTitle", margin: [0, 18, 0, subtitle ? 4 : 10] },
    ...(subtitle ? [{ text: subtitle, style: "mutedText", margin: [0, 0, 0, 10] }] : [])
  ];
}

function pdfTableLayout() {
  return {
    fillColor: (rowIndex: number) => (rowIndex === 0 ? "#10221f" : rowIndex % 2 === 0 ? "#fbf7ef" : "#ffffff"),
    hLineColor: () => "#d8cdb8",
    vLineColor: () => "#d8cdb8",
    paddingLeft: () => 7,
    paddingRight: () => 7,
    paddingTop: () => 6,
    paddingBottom: () => 7
  };
}

function pdfCardGrid(cards: any[], columns = 2) {
  const rows: any[][] = [];
  const widths = Array.from({ length: columns }, () => "*");

  for (let index = 0; index < cards.length; index += columns) {
    rows.push(widths.map((_, columnIndex) => {
      const card = cards[index + columnIndex];
      return card ? { stack: [card], margin: columnIndex === 0 ? [0, 0, 5, 0] : [5, 0, 0, 0] } : { text: "" };
    }));
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

function pdfProgressBar(value: number, width = 210, color = "#9d6a18") {
  const safeValue = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const fillWidth = Math.round(width * safeValue / 100);

  return {
    canvas: [
      { type: "rect", x: 0, y: 0, w: width, h: 7, r: 3.5, color: "#e7ddca" },
      { type: "rect", x: 0, y: 0, w: fillWidth, h: 7, r: 3.5, color }
    ],
    margin: [0, 6, 0, 0]
  };
}

function pdfMethodScoreChart(report: AuditReport) {
  return {
    table: {
      widths: ["*", 42],
      body: report.method_scores.slice(0, 8).map((item) => ([
        {
          stack: [
            { text: pdfText(item.method), style: "tableStrong" },
            pdfProgressBar(item.score, 220, item.score >= 80 ? "#6b8761" : item.score >= 68 ? "#c59642" : "#c87952"),
            { text: pdfText(item.signal), style: "mutedText", margin: [0, 4, 0, 0] }
          ],
          margin: [0, 0, 0, 8]
        },
        { text: `${item.score}/100`, alignment: "right", style: "tableStrong", margin: [0, 2, 0, 0] }
      ]))
    },
    layout: "noBorders",
    margin: [0, 2, 0, 8]
  };
}

function pdfSectorMatrix(sectors: AuditReport["sector_map"]) {
  const byKey = pdfSectorByKey(sectors);

  return {
    table: {
      widths: ["*", "*", "*"],
      body: sectorGrid.map((row) => row.map((key) => {
        const sector = byKey.get(key) ?? sectorFallback[key];
        return {
          stack: [
            { text: pdfText(sector.direction), style: "matrixDirection" },
            { text: pdfText(sector.sector, "sektor"), style: "matrixTitle" },
            { text: pdfText(sector.element, "element"), style: "matrixMeta" },
            { text: pdfText(sector.current_use, "do potwierdzenia"), style: "matrixUse" }
          ],
          margin: [9, 8, 9, 9]
        };
      }))
    },
    layout: {
      fillColor: (rowIndex: number, _node: unknown, columnIndex: number) => {
        if (rowIndex === 1 && columnIndex === 1) return "#efe5d3";
        return (rowIndex + columnIndex) % 2 === 0 ? "#fbf7ef" : "#fffdfa";
      },
      hLineColor: () => "#d8cdb8",
      vLineColor: () => "#d8cdb8"
    },
    margin: [0, 0, 0, 12]
  };
}

export async function downloadReportPdf(report: AuditReport, options: ReportPdfOptions = {}) {
  const [pdfMakeModule, pdfFontsModule] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts")
  ]);
  const pdfMake = (pdfMakeModule.default ?? pdfMakeModule) as any;
  const fontPayload = (pdfFontsModule.default ?? pdfFontsModule) as any;

  const virtualFileSystem = fontPayload.vfs ?? fontPayload;
  if (typeof pdfMake.addVirtualFileSystem === "function") {
    pdfMake.addVirtualFileSystem(virtualFileSystem);
  } else {
    pdfMake.vfs = virtualFileSystem;
  }
  pdfMake.fonts = pdfMake.fonts ?? {
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Medium.ttf",
      italics: "Roboto-Italic.ttf",
      bolditalics: "Roboto-MediumItalic.ttf"
    }
  };

  const planOverlayImage = await createPlanSectorOverlayImage(
    options.planFile,
    report,
    Number(options.northAngleDeg ?? 0)
  ).catch(() => null);

  const roomCards = report.room_recommendations.slice(0, 14).map((room) =>
    pdfCard(
      pdfText(room.room),
      pdfText(room.diagnosis),
      [
        ...pdfList(room.strengths, "mocne strony do potwierdzenia").map((item) => `Plus: ${item}`),
        ...pdfList(room.risks, "ryzyka do potwierdzenia").map((item) => `Ryzyko: ${item}`),
        ...pdfList(room.recommendations, "uzupełnij oznaczenia i funkcję").map((item) => `Rada: ${item}`)
      ].slice(0, 10),
      `${pdfText(room.function)} · ${pdfText(room.method)}`
    )
  );

  const furnitureCards = report.furniture_recommendations.slice(0, 14).map((item) =>
    pdfCard(
      pdfText(item.item),
      `${pdfText(item.assessment)}\n\nOgraniczenie praktyczne: ${pdfText(item.practical_limit)}`,
      pdfList(item.recommendations, "doprecyzuj kierunek osoby korzystającej z mebla").slice(0, 7),
      `${pdfText(item.orientation_role)} · ${pdfText(item.direction)}`
    )
  );

  const traditionalCards = report.traditional_analysis.slice(0, 8).map((section) =>
    pdfCard(pdfText(section.title), pdfText(section.body), pdfList(section.bullets, "wniosek do pogłębienia"), "warstwa tradycyjna")
  );

  const practicalCards = report.practical_analysis.slice(0, 8).map((section) =>
    pdfCard(pdfText(section.title), pdfText(section.body), pdfList(section.bullets, "wniosek do pogłębienia"), "warstwa praktyczna")
  );

  const priorityCards = report.priority_actions.slice(0, 8).map((action, index) =>
    pdfNumberedActionCard(action, index + 1)
  );
  const sectorAdviceCards = report.sector_map.slice(0, 9).map((sector) =>
    pdfCard(
      pdfText(sector.direction),
      pdfText(sector.assessment),
      [pdfText(sector.advice)],
      `${pdfText(sector.sector)} · ${pdfText(sector.element)}`
    )
  );
  const sourceCards = report.source_ledger.slice(0, 8).map((source) =>
    pdfCard(pdfText(source.source), pdfText(source.used_for), [`pewność: ${pdfConfidenceLabel(source.confidence)}`], "źródło")
  );
  const planFile = options.planFile ?? null;
  const mapFallbackText = planFile && !canUsePlanImageInPdf(planFile)
    ? "Nakładka 9 stref może zostać narysowana bezpośrednio na planie, gdy pierwszy wgrany plik jest obrazem JPG, PNG albo WEBP. Przy PDF/HEIC raport pokazuje macierz sektorów, ale nie osadza skanu jako tła."
    : "Dodaj plan w formacie JPG, PNG albo WEBP, aby raport PDF mógł narysować 9 stref bezpośrednio na skanie.";

  const docDefinition: any = {
    pageSize: "A4",
    pageMargins: [42, 46, 42, 48],
    defaultStyle: {
      font: "Roboto",
      fontSize: 9.6,
      color: "#10221f",
      lineHeight: 1.2
    },
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: "Plan Harmonii", color: "#6b786c", fontSize: 8 },
        { text: `${currentPage}/${pageCount}`, alignment: "right", color: "#6b786c", fontSize: 8 }
      ],
      margin: [42, 0, 42, 22]
    }),
    styles: {
      kicker: { color: "#9d6a18", bold: true, fontSize: 9, characterSpacing: 1.5 },
      title: { fontSize: 30, bold: true, lineHeight: 1.02, margin: [0, 7, 0, 10] },
      subtitle: { fontSize: 11, color: "#41524b", lineHeight: 1.35, margin: [0, 0, 0, 16] },
      score: { fontSize: 33, bold: true, color: "#10221f", lineHeight: 0.98 },
      scoreLabel: { color: "#6b786c", bold: true, fontSize: 8, characterSpacing: 1.2 },
      sectionTitle: { fontSize: 18, bold: true, color: "#10221f" },
      cardTitle: { fontSize: 12.5, bold: true, color: "#10221f" },
      cardEyebrow: { fontSize: 8, bold: true, color: "#9d6a18", characterSpacing: 0.6, margin: [0, 0, 0, 3] },
      priorityBadge: { alignment: "center", color: "#fffdfa", bold: true, fontSize: 10 },
      bodyText: { fontSize: 9.4, color: "#32463f", lineHeight: 1.22 },
      mutedText: { fontSize: 9.2, color: "#66756e", lineHeight: 1.25 },
      tableHead: { color: "#fffdfa", bold: true, fontSize: 8.2 },
      tableStrong: { bold: true, color: "#10221f", fontSize: 8.8 },
      tableText: { color: "#32463f", fontSize: 8.5, lineHeight: 1.15 },
      matrixDirection: { color: "#9d6a18", bold: true, fontSize: 7.8, alignment: "center" },
      matrixTitle: { color: "#10221f", bold: true, fontSize: 9, alignment: "center", margin: [0, 3, 0, 2] },
      matrixMeta: { color: "#66756e", fontSize: 7.5, alignment: "center" },
      matrixUse: { color: "#32463f", fontSize: 7.5, alignment: "center", margin: [0, 5, 0, 0] }
    },
    content: [
      { text: "PLAN HARMONII", style: "kicker" },
      { text: "Raport analizy przestrzeni", style: "title" },
      {
        text: "Pełny raport łączy oznaczenia planu, kierunki, sektory, meble, funkcje pomieszczeń oraz praktyczne ograniczenia układu. Rekomendacje nie zakładają zmian fizycznie niewykonalnych.",
        style: "subtitle"
      },
      {
        table: {
          widths: [132, "*"],
          body: [[
            {
              stack: [
                { text: "WYNIK", style: "scoreLabel" },
                { text: `${report.score}/100`, style: "score" },
                { text: `Pewność: ${pdfConfidenceLabel(report.confidence)}`, style: "mutedText" }
              ],
              fillColor: "#f7eddb",
              margin: [14, 13, 14, 14]
            },
            {
              stack: [
                { text: "Wniosek główny", style: "cardEyebrow" },
                { text: pdfText(report.executive_summary), style: "bodyText" },
                { text: "Decyzja", style: "cardEyebrow", margin: [0, 10, 0, 3] },
                { text: pdfText(report.purchase_decision), style: "bodyText" }
              ],
              fillColor: "#fffdfa",
              margin: [15, 13, 15, 14]
            }
          ]]
        },
        layout: {
          hLineColor: () => "#d1b47a",
          vLineColor: () => "#d1b47a",
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0
        },
        margin: [0, 0, 0, 8]
      },
      ...pdfSectionTitle(
        "Mapa 9 stref na skanie",
        "Siatka sektorów jest nakładana na pierwszy wgrany obraz planu i obracana zgodnie z zatwierdzoną północą."
      ),
      planOverlayImage
        ? { image: planOverlayImage, width: 500, alignment: "center", margin: [0, 0, 0, 10] }
        : pdfCard("Nakładka na skanie niedostępna", mapFallbackText, [], "mapa sektorów"),
      pdfSectorMatrix(report.sector_map),
      ...pdfSectionTitle("Wykres metod", "Szybki odczyt, które warstwy analizy są najmocniejsze i gdzie potrzeba danych."),
      pdfMethodScoreChart(report),
      ...pdfSectionTitle("Najważniejsze priorytety", "Kolejność prac: od decyzji o największym wpływie do korekt drobnych."),
      pdfCardGrid(priorityCards, 2),
      ...pdfSectionTitle("Kierunki i sektory", "Mapa 9 sektorów jest czytana razem z realną funkcją przestrzeni, nie mechanicznie."),
      ...report.directional_insights.slice(0, 6).map((item) =>
        pdfCard(pdfText(item.title), `${pdfText(item.meaning)}\n\nRekomendacja: ${pdfText(item.recommendation)}`, [], `${pdfText(item.direction)} · pewność ${pdfConfidenceLabel(item.confidence)}`)
      ),
      pdfCardGrid(sectorAdviceCards, 2),
      ...pdfSectionTitle("Pomieszczenia", "Każda oznaczona przestrzeń dostaje osobny wniosek: funkcja, ryzyka i konkretne korekty."),
      ...roomCards,
      ...pdfSectionTitle("Meble i kierunki osób", "Łóżko, biurko, sofa, stół i kuchenka są oceniane przez kierunek osoby korzystającej oraz realne ograniczenia układu."),
      ...furnitureCards,
      ...pdfSectionTitle("Warstwa tradycyjna"),
      ...traditionalCards,
      ...pdfSectionTitle("Warstwa praktyczna"),
      ...practicalCards,
      ...pdfSectionTitle("Zmiany bez remontu"),
      {
        ol: report.practical_changes.slice(0, 8).map((change) => ({
          text: `${pdfText(change.title)} · ${pdfText(change.cost)} · ${pdfText(change.when)}`,
          margin: [0, 0, 0, 4]
        })),
        style: "bodyText",
        margin: [0, 0, 0, 12]
      },
      ...pdfSectionTitle("Źródła i ograniczenia"),
      pdfCardGrid(sourceCards, 2),
      { text: pdfText(report.disclaimer), style: "mutedText" }
    ]
  };

  const pdfDocument = pdfMake.createPdf(docDefinition);
  const blob = await new Promise<Blob>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("Generator PDF przekroczył limit czasu."));
    }, 25000);

    try {
      pdfDocument.getBlob((generatedBlob: Blob) => {
        window.clearTimeout(timeout);
        if (generatedBlob instanceof Blob && generatedBlob.size > 0) {
          resolve(generatedBlob);
          return;
        }

        reject(new Error("Generator PDF nie zwrócił pliku."));
      });
    } catch (error) {
      window.clearTimeout(timeout);
      reject(error);
    }
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `plan-harmonii-raport-${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
