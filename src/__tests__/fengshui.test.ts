import { describe, it, expect } from "vitest";
import { propertyTypes, pricePlans, methods, sourceColumns } from "../data";
import { AuditReportSchema } from "../auditTypes";

// Helper function to normalize angle in degrees
function normalizeAngle(value: number): number {
  return ((Math.round(value) % 360) + 360) % 360;
}

// Direction label from bearing angle
function getDirectionFromAngle(angle: number): string {
  const norm = normalizeAngle(angle);
  if (norm >= 338 || norm <= 22) return "Północ";
  if (norm <= 67) return "Północny wschód";
  if (norm <= 112) return "Wschód";
  if (norm <= 157) return "Południowy wschód";
  if (norm <= 202) return "Południe";
  if (norm <= 247) return "Południowy zachód";
  if (norm <= 292) return "Zachód";
  return "Północny zachód";
}

// Classical Kua calculation algorithm
function calculateKuaNumber(birthYear: number, gender: "male" | "female"): number {
  const lastTwoDigits = birthYear % 100;
  const reduced = (Math.floor(lastTwoDigits / 10) + (lastTwoDigits % 10)) % 9 || 9;

  if (gender === "male") {
    const kua = (10 - reduced) % 9 || 9;
    return kua === 5 ? 2 : kua;
  } else {
    const kua = (5 + reduced) % 9 || 9;
    return kua === 5 ? 8 : kua;
  }
}

describe("Domain Data & Pricing Architecture", () => {
  it("should have all 4 core property types defined", () => {
    expect(propertyTypes.length).toBe(4);
    const keys = propertyTypes.map((p) => p.key);
    expect(keys).toContain("flat");
    expect(keys).toContain("multi");
    expect(keys).toContain("house");
    expect(keys).toContain("business");
  });

  it("should have balanced pricing tiers with a featured tier", () => {
    expect(pricePlans.length).toBe(4);
    const featuredPlan = pricePlans.find((p) => p.featured);
    expect(featuredPlan).toBeDefined();
    expect(featuredPlan?.id).toBe("full");
  });

  it("should have 8 classical & contemporary Feng Shui methods defined", () => {
    expect(methods.length).toBe(8);
    methods.forEach((m) => {
      expect(m.name).toBeTruthy();
      expect(m.description).toBeTruthy();
      expect(m.score).toBeGreaterThan(0);
    });
  });

  it("should contain comprehensive source methodology columns", () => {
    expect(sourceColumns.length).toBe(6);
    sourceColumns.forEach((col) => {
      expect(col.title).toBeTruthy();
      expect(col.bullets.length).toBeGreaterThan(0);
    });
  });
});

describe("Compass Mathematics & Bagua Calculations", () => {
  it("should normalize negative and overflowing angles correctly", () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(720)).toBe(0);
    expect(normalizeAngle(-90)).toBe(270);
    expect(normalizeAngle(-450)).toBe(270);
    expect(normalizeAngle(45.6)).toBe(46);
  });

  it("should resolve correct cardinal and intercardinal directions", () => {
    expect(getDirectionFromAngle(0)).toBe("Północ");
    expect(getDirectionFromAngle(350)).toBe("Północ");
    expect(getDirectionFromAngle(15)).toBe("Północ");
    expect(getDirectionFromAngle(45)).toBe("Północny wschód");
    expect(getDirectionFromAngle(90)).toBe("Wschód");
    expect(getDirectionFromAngle(135)).toBe("Południowy wschód");
    expect(getDirectionFromAngle(180)).toBe("Południe");
    expect(getDirectionFromAngle(225)).toBe("Południowy zachód");
    expect(getDirectionFromAngle(270)).toBe("Zachód");
    expect(getDirectionFromAngle(315)).toBe("Północny zachód");
  });
});

describe("Classical Ba Zhai / Kua Formula Calculation", () => {
  it("should calculate correct Kua numbers for men", () => {
    // 1988 male: 88 -> 8+8=16->7, 10-7 = 3 (East group)
    expect(calculateKuaNumber(1988, "male")).toBe(3);
    // 1990 male: 90 -> 9, 10-9 = 1 (East group)
    expect(calculateKuaNumber(1990, "male")).toBe(1);
    // Special rule for 5 -> replaces with 2 for male
    expect(calculateKuaNumber(1985, "male")).toBe(6);
  });

  it("should calculate correct Kua numbers for women", () => {
    // 1988 female: 88 -> 7, 5+7=12->3 (East group)
    expect(calculateKuaNumber(1988, "female")).toBe(3);
    // 1990 female: 90 -> 9, 5+9=14->5 -> replaced with 8 (West group)
    expect(calculateKuaNumber(1990, "female")).toBe(8);
  });
});

describe("Zod Schema Runtime Validation", () => {
  it("should successfully parse and sanitize a valid audit report", () => {
    const sampleRawReport = {
      score: 82,
      confidence: "high",
      executive_summary: "Mieszkanie ma bardzo dobry rozkład z jasną strefą wejścia.",
      detected_inputs: ["orientacja N", "drzwi wejściowe"],
      missing_inputs: ["dokładna data budowy"],
      priority_actions: [
        {
          title: "Ustawienie biurka w pozycji bezpiecznej",
          why: "Solidna ściana za plecami poprawia skupienie.",
          method: "Szkoła Formy",
          impact: "wysoki",
          effort: "niski",
          confidence: "high"
        }
      ],
      method_scores: [{ method: "Forma", score: 85, signal: "Mocne oparcie" }],
      levels: [],
      zones: [],
      directional_insights: [],
      sector_map: [
        {
          sector: "Kariera",
          direction: "Północ",
          element: "Woda",
          current_use: "Gabinet",
          assessment: "Bardzo dobre dopasowanie",
          advice: "Zachowaj czystość osi",
          priority: "Wysoki"
        }
      ],
      room_recommendations: [],
      furniture_recommendations: [],
      traditional_analysis: [],
      practical_analysis: [],
      practical_changes: [{ title: "Przestawienie fotela", cost: "0 zł", when: "od razu" }],
      purchase_decision: "Układ godny polecenia, niskie ryzyko.",
      source_ledger: [{ source: "Szkoła Formy", used_for: "Oparcie", confidence: "high" }],
      disclaimer: "Raport ma charakter informacyjny.",
      ai_provider: "Google Gemini",
      ai_model: "gemini-3.7-flash",
      ai_mode: "live"
    };

    const parsed = AuditReportSchema.safeParse(sampleRawReport);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.score).toBe(82);
      expect(parsed.data.confidence).toBe("high");
      expect(parsed.data.sector_map.length).toBe(1);
    }
  });

  it("should apply default fallbacks for missing fields in AuditReportSchema", () => {
    const minimalReport = {
      score: 75
    };

    const parsed = AuditReportSchema.parse(minimalReport);
    expect(parsed.score).toBe(75);
    expect(parsed.confidence).toBe("medium");
    expect(parsed.ai_provider).toBe("Google Gemini");
    expect(parsed.ai_model).toBe("gemini-3.7-flash");
    expect(Array.isArray(parsed.priority_actions)).toBe(true);
  });
});

describe("Xuan Kong Fei Xing (Flying Stars) Building Natal Chart Engine", () => {
  it("should calculate correct Building Period (Yun) from construction year", async () => {
    const { getBuildingPeriod } = await import("../lib/natalChartEngine");
    expect(getBuildingPeriod(2025).period).toBe(9);
    expect(getBuildingPeriod(2015).period).toBe(8);
    expect(getBuildingPeriod(1995).period).toBe(7);
    expect(getBuildingPeriod(1975).period).toBe(6);
  });

  it("should generate 9-palace natal chart with mountain and water stars", async () => {
    const { calculateBuildingNatalChart } = await import("../lib/natalChartEngine");
    const chart = calculateBuildingNatalChart("2018", undefined, 180);
    expect(chart.period).toBe(8);
    expect(chart.facing_direction).toContain("Południe");
    expect(chart.sitting_direction).toContain("Północ");
    expect(chart.palaces.length).toBe(9);

    const southPalace = chart.palaces.find((p) => p.code === "S");
    expect(southPalace).toBeDefined();
    expect(southPalace?.water_star).toBeDefined();
    expect(southPalace?.mountain_star).toBeDefined();
    expect(southPalace?.health_relationships).toBeTruthy();
    expect(southPalace?.wealth_career).toBeTruthy();
  });
});
