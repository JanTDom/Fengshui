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
