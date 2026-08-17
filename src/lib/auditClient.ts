import type { AuditApiResponse, AuditFilePayload, AuditReport, AuditRequestPayload } from "../auditTypes";
import { hasSupabaseConfig, supabase } from "./supabase";

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
    colorBg: "rgba(74, 109, 124, 0.20)",
    colorBorder: "#4A6D7C",
    colorText: "#1F3B44"
  },
  NE: {
    code: "NE",
    direction: "Północny wschód",
    sector: "Wiedza i Samorozwój",
    element: "Ziemia",
    trigram: "Gen (艮)",
    colorBg: "rgba(185, 149, 86, 0.20)",
    colorBorder: "#B99556",
    colorText: "#634718"
  },
  E: {
    code: "E",
    direction: "Wschód",
    sector: "Zdrowie i Rodzina",
    element: "Drewno",
    trigram: "Zhen (震)",
    colorBg: "rgba(82, 126, 88, 0.20)",
    colorBorder: "#527E58",
    colorText: "#25482A"
  },
  SE: {
    code: "SE",
    direction: "Południowy wschód",
    sector: "Obfitość i Finanse",
    element: "Drewno",
    trigram: "Xun (巽)",
    colorBg: "rgba(70, 120, 85, 0.20)",
    colorBorder: "#467855",
    colorText: "#20462C"
  },
  S: {
    code: "S",
    direction: "Południe",
    sector: "Sława i Reputacja",
    element: "Ogień",
    trigram: "Li (離)",
    colorBg: "rgba(194, 101, 74, 0.20)",
    colorBorder: "#C2654A",
    colorText: "#722E1A"
  },
  SW: {
    code: "SW",
    direction: "Południowy zachód",
    sector: "Relacje i Partnerstwo",
    element: "Ziemia",
    trigram: "Kun (坤)",
    colorBg: "rgba(175, 125, 85, 0.20)",
    colorBorder: "#AF7D55",
    colorText: "#5E3A1E"
  },
  W: {
    code: "W",
    direction: "Zachód",
    sector: "Kreatywność i Dzieci",
    element: "Metal",
    trigram: "Dui (兌)",
    colorBg: "rgba(148, 158, 153, 0.20)",
    colorBorder: "#949E99",
    colorText: "#3E4844"
  },
  NW: {
    code: "NW",
    direction: "Północny zachód",
    sector: "Pomocni Ludzie i Mentorzy",
    element: "Metal",
    trigram: "Qian (乾)",
    colorBg: "rgba(180, 150, 100, 0.20)",
    colorBorder: "#B49664",
    colorText: "#5C441E"
  },
  CENTER: {
    code: "CENTER",
    direction: "Centrum",
    sector: "Serce Domu i Równowaga",
    element: "Ziemia",
    trigram: "Tai Qi (太極)",
    colorBg: "rgba(205, 162, 70, 0.24)",
    colorBorder: "#CDA246",
    colorText: "#6A4D12"
  }
};

/**
 * Mathematically maps each cell of the 3x3 orthogonal grid covering the dwelling
 * to its exact, unique compass direction based on the verified North angle.
 */
function getCellCompassSector(colIndex: number, rowIndex: number, northAngleDeg: number): CompassSectorMeta {
  const dx = colIndex - 1; // -1 (left), 0 (center), 1 (right)
  const dy = rowIndex - 1; // -1 (top), 0 (center), 1 (bottom)

  if (dx === 0 && dy === 0) {
    return COMPASS_SECTOR_DEFINITIONS.CENTER;
  }

  // Screen angle: Up is 0°, Right is 90°, Down is 180°, Left is 270°
  const planAngleDeg = ((Math.atan2(dx, -dy) * 180 / Math.PI) + 360) % 360;
  // True geographic bearing relative to confirmed North
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

/**
 * Creates a high-resolution, architectural Bagua 9-sector overlay image.
 * The 3x3 grid covers 100% of the floor plan footprint from wall to wall.
 */
async function createPlanSectorOverlayImage(
  file: File | null | undefined,
  _report: AuditReport,
  northAngleDeg = 0
): Promise<string | null> {
  if (!file || !canUsePlanImageInPdf(file)) {
    return null;
  }

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImageElement(dataUrl);

  const targetWidth = 1200;
  const aspectRatio = (image.naturalHeight || image.height) / (image.naturalWidth || image.width);
  const targetHeight = Math.round(targetWidth * (aspectRatio || 0.75));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background and floor plan rendering
  ctx.fillStyle = "#FAF8F5";
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  // Soft architectural veil for maximum plan readability
  ctx.fillStyle = "rgba(250, 248, 245, 0.08)";
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Full dwelling 3x3 grid dimensions (covering the entire footprint from wall to wall)
  const pad = 12;
  const gridX = pad;
  const gridY = pad;
  const gridW = targetWidth - pad * 2;
  const gridH = targetHeight - pad * 2;
  const cellW = gridW / 3;
  const cellH = gridH / 3;

  // Draw each of the 9 sectors
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cellX = gridX + col * cellW;
      const cellY = gridY + row * cellH;
      const sector = getCellCompassSector(col, row, northAngleDeg);

      // Translucent tint per element
      ctx.fillStyle = sector.colorBg;
      ctx.fillRect(cellX, cellY, cellW, cellH);

      // Crisp cell border with warm gold accent
      ctx.strokeStyle = "rgba(196, 148, 63, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cellX, cellY, cellW, cellH);

      // Centered Luxury Badge in each cell
      const badgeW = Math.min(cellW - 16, 260);
      const badgeH = 52;
      const badgeX = cellX + (cellW - badgeW) / 2;
      const badgeY = cellY + (cellH - badgeH) / 2;

      ctx.save();
      // Badge background pill
      ctx.fillStyle = "rgba(255, 253, 250, 0.94)";
      ctx.strokeStyle = "rgba(196, 148, 63, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "rgba(16, 34, 31, 0.12)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Badge Text - Line 1 (Direction + Element)
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = sector.colorText;
      ctx.font = "bold 11px Arial, sans-serif";
      ctx.fillText(
        `${sector.direction.toUpperCase()} (${sector.code}) · ${sector.element.toUpperCase()}`,
        badgeX + badgeW / 2,
        badgeY + 9
      );

      // Badge Text - Line 2 (Sector Life Domain)
      ctx.fillStyle = "#10221F";
      ctx.font = "bold 13px Arial, sans-serif";
      ctx.fillText(sector.sector, badgeX + badgeW / 2, badgeY + 27);
      ctx.restore();
    }
  }

  // Outer double luxury border around whole floor plan
  ctx.strokeStyle = "#10221F";
  ctx.lineWidth = 3;
  ctx.strokeRect(gridX, gridY, gridW, gridH);

  // Compass Rose / North Indicator Card in top right
  drawNorthCompassWidget(ctx, targetWidth, northAngleDeg);

  return canvas.toDataURL("image/jpeg", 0.92);
}

function drawNorthCompassWidget(ctx: CanvasRenderingContext2D, canvasWidth: number, northAngleDeg: number) {
  const boxW = 88;
  const boxH = 94;
  const boxX = canvasWidth - boxW - 24;
  const boxY = 24;

  ctx.save();
  // Card box
  ctx.fillStyle = "rgba(255, 253, 250, 0.96)";
  ctx.strokeStyle = "rgba(196, 148, 63, 0.8)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(16, 34, 31, 0.16)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  const centerX = boxX + boxW / 2;
  const centerY = boxY + 44;
  const angleRad = (northAngleDeg * Math.PI) / 180;

  // Dial needle
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angleRad);

  // North needle (Dark green / ink)
  ctx.fillStyle = "#10221F";
  ctx.beginPath();
  ctx.moveTo(0, -25);
  ctx.lineTo(-7, 0);
  ctx.lineTo(7, 0);
  ctx.closePath();
  ctx.fill();

  // South needle (Brass gold)
  ctx.fillStyle = "#C49544";
  ctx.beginPath();
  ctx.moveTo(0, 25);
  ctx.lineTo(-7, 0);
  ctx.lineTo(7, 0);
  ctx.closePath();
  ctx.fill();

  // Center pin
  ctx.fillStyle = "#FAF8F5";
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Label N
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#10221F";
  ctx.font = "bold 13px Arial, sans-serif";
  ctx.fillText("N", centerX, boxY + 14);

  // Degree readout
  ctx.fillStyle = "#7A6E5D";
  ctx.font = "bold 11px Arial, sans-serif";
  ctx.fillText(`${Math.round(northAngleDeg)}°`, centerX, boxY + 80);
  ctx.restore();
}

/**
 * Editorial Card block with unbreakable table layout to prevent page break splitting.
 */
function pdfCard(title: string, body: string, bullets: string[] = [], eyebrow = "") {
  const stack: any[] = [];

  if (eyebrow) {
    stack.push({ text: eyebrow.toUpperCase(), style: "cardEyebrow" });
  }

  stack.push({ text: title, style: "cardTitle" });
  stack.push({ text: body, style: "bodyText", margin: [0, 3, 0, bullets.length > 0 ? 6 : 0] });

  if (bullets.length > 0) {
    stack.push({
      ul: bullets,
      style: "bulletText",
      margin: [0, 2, 0, 0]
    });
  }

  return {
    unbreakable: true,
    table: {
      dontBreakRows: true,
      widths: ["*"],
      body: [[{ stack, margin: [14, 12, 14, 12] }]]
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
    margin: [0, 0, 0, 10]
  };
}

/**
 * Numbered Action Card with unbroken layout and contrast badge.
 */
function pdfNumberedActionCard(action: AuditReport["priority_actions"][number], index: number) {
  return {
    unbreakable: true,
    table: {
      dontBreakRows: true,
      widths: ["*"],
      body: [
        [
          {
            columns: [
              {
                width: 26,
                table: {
                  dontBreakRows: true,
                  widths: ["*"],
                  body: [[{ text: String(index), style: "priorityBadge", margin: [0, 4, 0, 4] }]]
                },
                layout: {
                  fillColor: () => "#10221F",
                  hLineColor: () => "#10221F",
                  vLineColor: () => "#10221F"
                }
              },
              {
                width: "*",
                stack: [
                  { text: pdfText(action.method).toUpperCase(), style: "cardEyebrow" },
                  { text: pdfText(action.title), style: "cardTitle" },
                  { text: pdfText(action.why), style: "bodyText", margin: [0, 3, 0, 6] },
                  {
                    text: `${pdfText(action.impact, "wpływ")} · ${pdfText(action.effort, "wysiłek")} · pewność ${pdfConfidenceLabel(action.confidence)}`,
                    style: "mutedText"
                  }
                ],
                margin: [10, 0, 0, 0]
              }
            ],
            columnGap: 2,
            margin: [14, 12, 14, 12]
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
    margin: [0, 0, 0, 10]
  };
}

function pdfSectionTitle(title: string, subtitle?: string) {
  return [
    { text: title, style: "sectionTitle", keepWithNext: true, margin: [0, 18, 0, subtitle ? 3 : 8] },
    ...(subtitle
      ? [{ text: subtitle, style: "mutedText", keepWithNext: true, margin: [0, 0, 0, 10] }]
      : [])
  ];
}

function pdfCardGrid(cards: any[], columns = 2) {
  const rows: any[][] = [];
  const widths = Array.from({ length: columns }, () => "*");

  for (let index = 0; index < cards.length; index += columns) {
    rows.push(
      widths.map((_, columnIndex) => {
        const card = cards[index + columnIndex];
        return card
          ? { stack: [card], margin: columnIndex === 0 ? [0, 0, 5, 0] : [5, 0, 0, 0] }
          : { text: "" };
      })
    );
  }

  return {
    table: {
      dontBreakRows: true,
      widths,
      body: rows
    },
    layout: "noBorders",
    margin: [0, 0, 0, 4]
  };
}

function pdfProgressBar(value: number, width = 220, color = "#9D742F") {
  const safeValue = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const fillWidth = Math.round((width * safeValue) / 100);

  return {
    canvas: [
      { type: "rect", x: 0, y: 0, w: width, h: 6, r: 3, color: "#E7DDCA" },
      { type: "rect", x: 0, y: 0, w: fillWidth, h: 6, r: 3, color }
    ],
    margin: [0, 4, 0, 0]
  };
}

function pdfMethodScoreChart(report: AuditReport) {
  return {
    unbreakable: true,
    table: {
      dontBreakRows: true,
      widths: ["*", 48],
      body: report.method_scores.slice(0, 8).map((item) => [
        {
          stack: [
            { text: pdfText(item.method), style: "tableStrong" },
            pdfProgressBar(
              item.score,
              220,
              item.score >= 80 ? "#527E58" : item.score >= 68 ? "#C49544" : "#C2654A"
            ),
            { text: pdfText(item.signal), style: "mutedText", margin: [0, 3, 0, 0] }
          ],
          margin: [0, 0, 0, 6]
        },
        { text: `${item.score}/100`, alignment: "right", style: "tableStrong", margin: [0, 2, 0, 0] }
      ])
    },
    layout: "noBorders",
    margin: [0, 2, 0, 10]
  };
}

function pdfSectorMatrix(sectors: AuditReport["sector_map"]) {
  const byCode = new Map<string, AuditReport["sector_map"][number]>();
  sectors.forEach((sec) => {
    const raw = String(sec.direction || "").toLowerCase();
    if (raw.includes("północny zach") || raw.includes("nw")) byCode.set("NW", sec);
    else if (raw.includes("północny wsch") || raw.includes("ne")) byCode.set("NE", sec);
    else if (raw.includes("północ") || raw.includes("n")) byCode.set("N", sec);
    else if (raw.includes("południowy zach") || raw.includes("sw")) byCode.set("SW", sec);
    else if (raw.includes("południowy wsch") || raw.includes("se")) byCode.set("SE", sec);
    else if (raw.includes("południe") || raw.includes("s")) byCode.set("S", sec);
    else if (raw.includes("zachód") || raw.includes("w")) byCode.set("W", sec);
    else if (raw.includes("wschód") || raw.includes("e")) byCode.set("E", sec);
    else if (raw.includes("centrum")) byCode.set("CENTER", sec);
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
              { text: item?.sector || def.sector, style: "matrixTitle" },
              { text: `Żywioł: ${item?.element || def.element}`, style: "matrixMeta" },
              { text: item?.current_use || "Strefa funkcjonalna", style: "matrixUse" }
            ],
            margin: [8, 8, 8, 8]
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
    margin: [0, 0, 0, 14]
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

  const northAngle = Number(options.northAngleDeg ?? 0);
  const planOverlayImage = await createPlanSectorOverlayImage(
    options.planFile,
    report,
    northAngle
  ).catch((err) => {
    console.error("Błąd tworzenia nakładki rzutu:", err);
    return null;
  });

  const roomCards = report.room_recommendations.slice(0, 12).map((room) =>
    pdfCard(
      pdfText(room.room),
      pdfText(room.diagnosis),
      [
        ...pdfList(room.strengths, "mocne strony").map((item) => `Atut: ${item}`),
        ...pdfList(room.risks, "ryzyka").map((item) => `Ryzyko: ${item}`),
        ...pdfList(room.recommendations, "rekomendacje").map((item) => `Rada: ${item}`)
      ].slice(0, 8),
      `${pdfText(room.function)} · ${pdfText(room.method)}`
    )
  );

  const furnitureCards = report.furniture_recommendations.slice(0, 12).map((item) =>
    pdfCard(
      pdfText(item.item),
      `${pdfText(item.assessment)}\n\nOgraniczenie praktyczne: ${pdfText(item.practical_limit)}`,
      pdfList(item.recommendations, "doprecyzuj ustawienie mebla").slice(0, 6),
      `${pdfText(item.orientation_role)} · ${pdfText(item.direction)}`
    )
  );

  const traditionalCards = report.traditional_analysis.slice(0, 6).map((section) =>
    pdfCard(
      pdfText(section.title),
      pdfText(section.body),
      pdfList(section.bullets, "wniosek do pogłębienia"),
      "Szkoła Formy & Tradycja"
    )
  );

  const practicalCards = report.practical_analysis.slice(0, 6).map((section) =>
    pdfCard(
      pdfText(section.title),
      pdfText(section.body),
      pdfList(section.bullets, "wniosek do pogłębienia"),
      "Ergonomia & Architektura Wnętrz"
    )
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
    pdfCard(
      pdfText(source.source),
      pdfText(source.used_for),
      [`Pewność metody: ${pdfConfidenceLabel(source.confidence)}`],
      "Rejestr Źródeł"
    )
  );

  const docDefinition: any = {
    pageSize: "A4",
    pageMargins: [38, 44, 38, 44],
    defaultStyle: {
      font: "Roboto",
      fontSize: 9.4,
      color: "#10221F",
      lineHeight: 1.25
    },
    header: () => ({
      columns: [
        { text: "PLAN HARMONII · CERTYFIKOWANY AUDYT PRZESTRZENNY", fontSize: 7.5, bold: true, color: "#C49544", characterSpacing: 0.8 },
        { text: "AI FENG SHUI & ARCHITEKTURA", alignment: "right", fontSize: 7.5, color: "#7A6E5D" }
      ],
      margin: [38, 16, 38, 0]
    }),
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: "Plan Harmonii · www.e-fengshui.pl", color: "#7A6E5D", fontSize: 8 },
        { text: `Strona ${currentPage} z ${pageCount}`, alignment: "right", color: "#7A6E5D", fontSize: 8 }
      ],
      margin: [38, 0, 38, 16]
    }),
    styles: {
      kicker: { color: "#C49544", bold: true, fontSize: 8.5, characterSpacing: 1.2 },
      title: { fontSize: 26, bold: true, color: "#10221F", lineHeight: 1.05, margin: [0, 4, 0, 8] },
      subtitle: { fontSize: 10, color: "#41524B", lineHeight: 1.35, margin: [0, 0, 0, 14] },
      scoreLabel: { color: "#7A6E5D", bold: true, fontSize: 7.8, characterSpacing: 1 },
      sectionTitle: { fontSize: 16, bold: true, color: "#10221F" },
      cardTitle: { fontSize: 11.5, bold: true, color: "#10221F" },
      cardEyebrow: { fontSize: 7.5, bold: true, color: "#C49544", characterSpacing: 0.5, margin: [0, 0, 0, 2] },
      priorityBadge: { alignment: "center", color: "#FFFDFB", bold: true, fontSize: 10 },
      bodyText: { fontSize: 9, color: "#2D3E38", lineHeight: 1.25 },
      bulletText: { fontSize: 8.6, color: "#3B4E48", lineHeight: 1.2 },
      mutedText: { fontSize: 8.5, color: "#66756E", lineHeight: 1.25 },
      tableStrong: { bold: true, color: "#10221F", fontSize: 8.5 },
      matrixDirection: { color: "#C49544", bold: true, fontSize: 7.5, alignment: "center" },
      matrixTitle: { color: "#10221F", bold: true, fontSize: 8.8, alignment: "center", margin: [0, 2, 0, 2] },
      matrixMeta: { color: "#66756E", fontSize: 7.2, alignment: "center" },
      matrixUse: { color: "#2D3E38", fontSize: 7.2, alignment: "center", margin: [0, 4, 0, 0] }
    },
    content: [
      { text: "PLAN HARMONII · RAPORT AUDYTOWY", style: "kicker" },
      { text: "Analiza Układu Przestrzennego & Feng Shui", style: "title" },
      {
        text: "Raport łączy tradycyjną Szkołę Formy (Luan Tou), siatkę 9 stref Bagua i orientację kompasową z nowoczesną ergonomią, akustyką i doświetleniem. Rekomendacje nie zakładają zmian fizycznie niewykonalnych.",
        style: "subtitle"
      },
      // Executive Overview Table with Unbreakable Layout and No-Wrap Score
      {
        unbreakable: true,
        table: {
          dontBreakRows: true,
          widths: [145, "*"],
          body: [
            [
              {
                stack: [
                  { text: "WYNIK POTENCJAŁU", style: "scoreLabel" },
                  {
                    text: [
                      { text: `${report.score}`, fontSize: 32, bold: true, color: "#10221F" },
                      { text: " / 100", fontSize: 16, bold: true, color: "#7A6E5D" }
                    ],
                    noWrap: true,
                    margin: [0, 4, 0, 4]
                  },
                  { text: `Pewność: ${pdfConfidenceLabel(report.confidence)}`, style: "mutedText" }
                ],
                fillColor: "#F7EDDB",
                margin: [14, 12, 14, 12]
              },
              {
                stack: [
                  { text: "PODSUMOWANIE STRATEGICZNE", style: "cardEyebrow" },
                  { text: pdfText(report.executive_summary), style: "bodyText" },
                  { text: "REKOMENDACJA DECYZYJNA", style: "cardEyebrow", margin: [0, 8, 0, 2] },
                  { text: pdfText(report.purchase_decision), style: "bodyText" }
                ],
                fillColor: "#FFFDFB",
                margin: [14, 12, 14, 12]
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
        margin: [0, 0, 0, 14]
      },
      ...pdfSectionTitle(
        "Mapa 9 Stref Bagua na Rzucie Nieruchomości",
        "Siatka 9 pałaców Luo Shu pokrywa 100% obrysu lokalu. Każdy sektor został zmapowany zgodnie z orientacją igły północy."
      ),
      planOverlayImage
        ? {
            image: planOverlayImage,
            width: 518,
            alignment: "center",
            margin: [0, 0, 0, 12]
          }
        : pdfCard(
            "Nakładka na planie niedostępna",
            "Wgraj plan w formacie JPG, PNG lub WEBP, aby raport wygenerował pełną nakładkę graficzną 9 stref bezpośrednio na Twoim rzucie.",
            [],
            "Mapa Sektorów"
          ),
      pdfSectorMatrix(report.sector_map),
      ...pdfSectionTitle(
        "Wykres Zgodności Metodologicznej",
        "Ocena poszczególnych warstw analitycznych (Forma, Kompas, Bagua, Ergonomia, Światło)."
      ),
      pdfMethodScoreChart(report),
      ...pdfSectionTitle(
        "Najważniejsze Priorytety Działań",
        "Kolejność wdrożenia zmian: od korekt o najwyższym wpływie do poprawek niskonakładowych."
      ),
      pdfCardGrid(priorityCards, 2),
      ...pdfSectionTitle(
        "Diagnoza Sektorów i Kierunków",
        "Szczegółowa interpretacja 9 sektorów w powiązaniu z ich realną funkcją w lokalu."
      ),
      pdfCardGrid(sectorAdviceCards, 2),
      ...pdfSectionTitle(
        "Audyt Pomieszczeń Pokój po Pokoju",
        "Wnioski dedykowane dla każdej strefy: atuty, ryzyka i zalecenia bezinwazyjne."
      ),
      pdfCardGrid(roomCards, 2),
      ...pdfSectionTitle(
        "Meble i Pozycja Dominująca (Command Position)",
        "Oparcie łóżka, biurka i strefy wypoczynku względem wejścia i okien (Szkoła Formy & Ergonomia)."
      ),
      pdfCardGrid(furnitureCards, 2),
      ...pdfSectionTitle("Klasyczna Szkoła Formy (Luan Tou)"),
      pdfCardGrid(traditionalCards, 2),
      ...pdfSectionTitle("Ergonomia, Światło i Akustyka (Standard Współczesny)"),
      pdfCardGrid(practicalCards, 2),
      ...pdfSectionTitle(
        "Lista Rekomendowanych Zmian Bez Remontu",
        "Praktyczne działania, które można wdrożyć natychmiast bez wyburzania ścian."
      ),
      {
        unbreakable: true,
        ol: report.practical_changes.slice(0, 8).map((change) => ({
          text: `${pdfText(change.title)} · ${pdfText(change.cost)} · ${pdfText(change.when)}`,
          margin: [0, 0, 0, 3]
        })),
        style: "bodyText",
        margin: [0, 0, 0, 14]
      },
      ...pdfSectionTitle("Rejestr Źródeł i Transparentność Metod"),
      pdfCardGrid(sourceCards, 2),
      {
        text: pdfText(report.disclaimer),
        style: "mutedText",
        margin: [0, 10, 0, 0]
      }
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
