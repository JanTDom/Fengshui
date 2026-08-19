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
  scale?: number;
  orientationRole?: string | null;
  orientationNote?: string | null;
  assignedResidentLabel?: string | null;
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
  gender?: "male" | "female" | string;
  assignedFurniture?: string[];
  formulaCategory: string;
  note: string;
};

export type ResidentAnalysisItem = {
  name: string;
  role?: string;
  birth_year?: string;
  gender?: string;
  kua_number: number;
  element: string;
  group: string;
  favorable_directions: string[];
  unfavorable_directions: string[];
  assigned_furniture?: string[];
  placement_advice: string;
  yearly_warning?: string;
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
  trigram?: string;
  remedies?: string[];
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

export type NatalPalace = {
  direction: string;
  code: string;
  mountain_star: number;
  base_star: number;
  water_star: number;
  nature: string;
  health_relationships: string;
  wealth_career: string;
  remedy_wu_xing: string;
  period9_outlook: string;
};

export type BuildingNatalChart = {
  period: number;
  period_label: string;
  period_element: string;
  construction_year?: string;
  facing_direction: string;
  sitting_direction: string;
  facing_angle_deg: number;
  chart_type: string;
  summary: string;
  palaces: NatalPalace[];
  period9_strategy: string;
};

export type PropertyMetadata = {
  property_type_label: string;
  usable_area_m2: number;
  levels_count: number;
  address_note: string;
  analysis_date: string;
  measurement_date: string;
  analyst: string;
  report_version: string;
  project_id: string;
};

export type ConsultationGoal = {
  primary_goal: string;
  focus_areas: string[];
  expected_outcomes: string[];
};

export type MethodologyScope = {
  applied_schools: string[];
  scope_description: string;
  exclusions: string[];
  sources_bibliography: string[];
};

export type InputDataRecord = {
  floor_plan_status: string;
  compass_north_azimuth: string;
  facing_sitting: string;
  period_and_timeline: string;
  residents_count: number;
  rooms_count: number;
  furniture_count: number;
};

export type MacroEnvironmentAudit = {
  terrain_and_landform: string;
  surrounding_buildings: string;
  traffic_and_roads: string;
  sha_qi_external: string;
  sheng_qi_sources: string;
  recommendations: string[];
};

export type BuildingMorphologyAudit = {
  building_shape: string;
  facing_sitting_verdict: string;
  missing_sectors: string;
  entry_and_vertical_circulation: string;
  dwelling_relation_to_core: string;
  recommendations: string[];
};

export type QiFlowAudit = {
  entry_qi_dynamics: string;
  door_window_axes: string;
  corridor_and_circulation_speed: string;
  stagnation_pockets: string;
  tai_qi_central_state: string;
  recommendations: string[];
};

export type MingTangAudit = {
  foyer_quality: string;
  energy_accumulation_capacity: string;
  bottlenecks_and_clutter: string;
  welcome_lighting_and_flow: string;
  remedies: string[];
};

export type KeyFurniturePillars = {
  bed?: FurnitureRecommendation;
  desk?: FurnitureRecommendation;
  stove?: FurnitureRecommendation;
  other: FurnitureRecommendation[];
};

export type WuXingAudit = {
  dominant_elements: string[];
  deficient_elements: string[];
  generative_cycle_advice: string;
  controlling_cycle_advice: string;
  elemental_palette: Array<{ element: string; colors: string; materials: string; purpose: string }>;
};

export type PrioritizedIssue = {
  code: "P1" | "P2" | "P3" | "P4";
  priority_label: string;
  title: string;
  category: string;
  diagnosis: string;
  impact_risk: string;
  remedy_action: string;
};

export type TieredRecommendations = {
  no_renovation_quick_wins: Array<{ action: string; impact: string; cost: string }>;
  light_interventions: Array<{ action: string; impact: string; cost: string }>;
  architectural_renovations: Array<{ action: string; impact: string; cost: string }>;
};

export type ImplementationRoadmap = {
  stage1_immediate_7days: string[];
  stage2_intermediate_30days: string[];
  stage3_longterm_renovation: string[];
};

export type BeforeAfterShift = {
  id: number;
  item_or_zone: string;
  before_state: string;
  after_recommendation: string;
  expected_gain: string;
};

export type ExecutiveSummaryPoints = {
  top_three_assets: string[];
  top_three_challenges: string[];
  top_five_instant_actions: string[];
};

export type AuditReport = {
  score: number;
  confidence: AuditConfidence;
  executive_summary: string;
  executive_summary_points?: ExecutiveSummaryPoints;
  property_metadata?: PropertyMetadata;
  consultation_goal?: ConsultationGoal;
  methodology_scope?: MethodologyScope;
  input_data_record?: InputDataRecord;
  macro_environment?: MacroEnvironmentAudit;
  building_morphology?: BuildingMorphologyAudit;
  qi_flow?: QiFlowAudit;
  ming_tang?: MingTangAudit;
  key_furniture?: KeyFurniturePillars;
  wu_xing?: WuXingAudit;
  prioritized_issues?: PrioritizedIssue[];
  tiered_recommendations?: TieredRecommendations;
  implementation_roadmap?: ImplementationRoadmap;
  before_after_shifts?: BeforeAfterShift[];
  detected_inputs: string[];
  missing_inputs: string[];
  priority_actions: AuditAction[];
  method_scores: MethodScore[];
  levels: LevelReport[];
  zones: ZoneReport[];
  directional_insights: DirectionalInsight[];
  sector_map: SectorReport[];
  natal_chart?: BuildingNatalChart;
  room_recommendations: RoomRecommendation[];
  furniture_recommendations: FurnitureRecommendation[];
  resident_analysis?: ResidentAnalysisItem[];
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
