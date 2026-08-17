import { z } from "zod";
import type { PropertyKey } from "./data";

export type AuditConfidence = "low" | "medium" | "high";
export type AuditMode = "live" | "demo" | "error";

export type AuditFilePayload = {
  name: string;
  mimeType: string;
  size: number;
  data: string;
};

export type OrientationData = {
  northAngleDeg: number;
  confirmed: boolean;
  source: "manual_compass_dial";
  note: string;
};

export type PlanMarker = {
  id: string;
  label: string;
  category: "room" | "fixed" | "furniture";
  xPercent: number;
  yPercent: number;
  facingDeg: number | null;
  orientationRole?: string | null;
  orientationNote?: string | null;
};

export type PlanAnnotations = {
  roomFunctions: string[];
  fixedElements: string[];
  markers: PlanMarker[];
  roomFunctionNote: string;
  fixedElementNote: string;
};

export type FurnitureAnnotations = {
  keyPieces: string[];
  furnitureNote: string;
};

export type BuildingProfile = {
  constructionYear: string;
  firstOccupiedYear: string;
  moveInDate: string;
  majorRenovationYear: string;
  renovationNote: string;
};

export type ResidentProfile = {
  label: string;
  role: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  formulaCategory: string;
  note: string;
};

export type AuditRequestPayload = {
  email: string;
  planId: string;
  propertyType: PropertyKey;
  levelsCount: number;
  usableAreaM2: number | null;
  purpose: string;
  addressNote: string;
  orientationNote: string;
  entryNote: string;
  constraintsNote: string;
  profileNote: string;
  orientationData: OrientationData;
  planAnnotations: PlanAnnotations;
  furnitureAnnotations: FurnitureAnnotations;
  buildingProfile: BuildingProfile;
  residentProfiles: ResidentProfile[];
  selectedMethods: string[];
  files: AuditFilePayload[];
};

export type AuditAction = {
  title: string;
  why: string;
  method: string;
  impact: string;
  effort: string;
  confidence: AuditConfidence;
};

export type MethodScore = {
  method: string;
  score: number;
  signal: string;
};

export type LevelReport = {
  label: string;
  score: number;
  focus: string;
  risks: string[];
  actions: string[];
};

export type ZoneReport = {
  zone: string;
  state: string;
  recommendation: string;
  method: string;
};

export type PracticalChange = {
  title: string;
  cost: string;
  when: string;
};

export type DirectionalInsight = {
  title: string;
  direction: string;
  meaning: string;
  recommendation: string;
  confidence: AuditConfidence;
};

export type SectorReport = {
  sector: string;
  direction: string;
  element: string;
  current_use: string;
  assessment: string;
  advice: string;
  priority: string;
};

export type RoomRecommendation = {
  room: string;
  function: string;
  diagnosis: string;
  strengths: string[];
  risks: string[];
  recommendations: string[];
  method: string;
};

export type FurnitureRecommendation = {
  item: string;
  orientation_role: string;
  direction: string;
  assessment: string;
  practical_limit: string;
  recommendations: string[];
};

export type ReportSection = {
  title: string;
  body: string;
  bullets: string[];
};

export type SourceLedgerItem = {
  source: string;
  used_for: string;
  confidence: AuditConfidence;
};

export type AuditReport = {
  score: number;
  confidence: AuditConfidence;
  executive_summary: string;
  detected_inputs: string[];
  missing_inputs: string[];
  priority_actions: AuditAction[];
  method_scores: MethodScore[];
  levels: LevelReport[];
  zones: ZoneReport[];
  directional_insights: DirectionalInsight[];
  sector_map: SectorReport[];
  room_recommendations: RoomRecommendation[];
  furniture_recommendations: FurnitureRecommendation[];
  traditional_analysis: ReportSection[];
  practical_analysis: ReportSection[];
  practical_changes: PracticalChange[];
  purchase_decision: string;
  source_ledger: SourceLedgerItem[];
  disclaimer: string;
  ai_provider: string;
  ai_model: string;
  ai_mode: AuditMode;
};

export type AuditApiResponse = {
  report: AuditReport;
  provider: string;
  model: string;
  mode: AuditMode;
};

// -------------------------------------------------------------
// Zod Schemas for Runtime Validation
// -------------------------------------------------------------

export const AuditConfidenceSchema = z.enum(["low", "medium", "high"]);
export const AuditModeSchema = z.enum(["live", "demo", "error"]);

export const AuditActionSchema = z.object({
  title: z.string().default(""),
  why: z.string().default(""),
  method: z.string().default("Forma"),
  impact: z.string().default("wysoki"),
  effort: z.string().default("niski"),
  confidence: AuditConfidenceSchema.default("medium")
});

export const MethodScoreSchema = z.object({
  method: z.string(),
  score: z.number().min(0).max(100).default(75),
  signal: z.string().default("")
});

export const LevelReportSchema = z.object({
  label: z.string(),
  score: z.number().min(0).max(100).default(75),
  focus: z.string().default(""),
  risks: z.array(z.string()).default([]),
  actions: z.array(z.string()).default([])
});

export const ZoneReportSchema = z.object({
  zone: z.string(),
  state: z.string().default(""),
  recommendation: z.string().default(""),
  method: z.string().default("Bagua")
});

export const DirectionalInsightSchema = z.object({
  title: z.string().default(""),
  direction: z.string().default(""),
  meaning: z.string().default(""),
  recommendation: z.string().default(""),
  confidence: AuditConfidenceSchema.default("medium")
});

export const SectorReportSchema = z.object({
  sector: z.string(),
  direction: z.string(),
  element: z.string().default("Ziemia"),
  current_use: z.string().default("Nieoznaczony"),
  assessment: z.string().default(""),
  advice: z.string().default(""),
  priority: z.string().default("Standardowy")
});

export const RoomRecommendationSchema = z.object({
  room: z.string(),
  function: z.string().default(""),
  diagnosis: z.string().default(""),
  strengths: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  method: z.string().default("Forma")
});

export const FurnitureRecommendationSchema = z.object({
  item: z.string(),
  orientation_role: z.string().default("front / kierunek używania"),
  direction: z.string().default(""),
  assessment: z.string().default(""),
  practical_limit: z.string().default(""),
  recommendations: z.array(z.string()).default([])
});

export const ReportSectionSchema = z.object({
  title: z.string().default(""),
  body: z.string().default(""),
  bullets: z.array(z.string()).default([])
});

export const PracticalChangeSchema = z.object({
  title: z.string().default(""),
  cost: z.string().default("niski koszt"),
  when: z.string().default("od razu")
});

export const SourceLedgerItemSchema = z.object({
  source: z.string(),
  used_for: z.string().default(""),
  confidence: AuditConfidenceSchema.default("medium")
});

export const AuditReportSchema = z.object({
  score: z.number().min(0).max(100).default(78),
  confidence: AuditConfidenceSchema.default("medium"),
  executive_summary: z.string().default(""),
  detected_inputs: z.array(z.string()).default([]),
  missing_inputs: z.array(z.string()).default([]),
  priority_actions: z.array(AuditActionSchema).default([]),
  method_scores: z.array(MethodScoreSchema).default([]),
  levels: z.array(LevelReportSchema).default([]),
  zones: z.array(ZoneReportSchema).default([]),
  directional_insights: z.array(DirectionalInsightSchema).default([]),
  sector_map: z.array(SectorReportSchema).default([]),
  room_recommendations: z.array(RoomRecommendationSchema).default([]),
  furniture_recommendations: z.array(FurnitureRecommendationSchema).default([]),
  traditional_analysis: z.array(ReportSectionSchema).default([]),
  practical_analysis: z.array(ReportSectionSchema).default([]),
  practical_changes: z.array(PracticalChangeSchema).default([]),
  purchase_decision: z.string().default(""),
  source_ledger: z.array(SourceLedgerItemSchema).default([]),
  disclaimer: z.string().default(""),
  ai_provider: z.string().default("Google Gemini"),
  ai_model: z.string().default("gemini-3.7-flash"),
  ai_mode: AuditModeSchema.default("live")
});
