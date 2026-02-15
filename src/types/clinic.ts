export type OpeningStatus = "개원 예정" | "1년 미만" | "1–3년" | "3년 이상";

export type BuildingType = "상가" | "주상복합" | "메디컬빌딩" | "기타";

export type Specialty =
  | "근골격·통증"
  | "교통사고"
  | "자율신경·정신신체"
  | "내과·탕약"
  | "다이어트·미용";

export type PatientGroup =
  | "직장인"
  | "학생"
  | "노년층"
  | "여성 위주"
  | "혼합";

export type RevisitRange = "<30%" | "30–50%" | "50–70%" | "70% 이상";

export type ComplaintFrequency = "거의 없음" | "월 1–2건" | "월 3건 이상";

export interface ClinicProfile {
  id: string;
  createdAt: string;
  updatedAt: string;

  // 기본 정보
  openingStatus: OpeningStatus;
  regionCity: string;
  regionDong: string;
  buildingType: BuildingType;

  // 진료 구조
  specialties: Specialty[];
  patientGroup: PatientGroup;

  // 수익 구조
  avgRevenuePerPatient: number;
  revisitRange: RevisitRange;
  monthlyPatients: number;
  nonInsuranceRatio: number;

  // 비용 구조
  monthlyRent: number;
  laborCost: number;
  otherFixedCost: number;
  variableCostEstimate: number;
  includesOwnerSalary: boolean;

  // 초기 투자금
  depositAmount: number;
  keyMoney: number;
  interiorCost: number;
  equipmentCost: number;
  initialStockCost: number;
  otherInitialCost: number;

  // 운영 및 리스크
  staffCount: number;
  dailyHours: number;
  frequentWait: boolean;
  complaintFrequency: ComplaintFrequency;
  revenueConcentration: number;
}

export type Verdict = "적합" | "주의 필요" | "비추천";

export interface AnalysisSummary {
  verdict: Verdict;
  oneLiner: string;
  actions: string[];
}

// ── 재무 파생 지표 ──
export interface Financials {
  monthlyRevenue: number;
  totalFixedCost: number;
  totalCost: number;
  operatingProfit: number;
  operatingMargin: number;
  rentRatio: number;
  laborRatio: number;
  breakEvenPatients: number;
}

// ── 각 분석 함수 반환 타입 ──
export interface LocationAnalysis {
  summary: AnalysisSummary;
  strengths: string[];
  issues: string[];
}

export interface CooAnalysis {
  summary: AnalysisSummary;
  insights: string[];
  issues: string[];
  financials: Financials;
}

export interface PackageItem {
  name: string;
  description: string;
  targetPrice: string;
  rationale: string;
  sessions: string;
}

export interface PackageAnalysis {
  summary: AnalysisSummary;
  packages: PackageItem[];
  nonInsuranceNote: string;
}

export interface PositioningAnalysis {
  summary: AnalysisSummary;
  strengths: string[];
  issues: string[];
}

export interface RiskItem {
  category: string;
  level: Verdict;
  detail: string;
}

export interface RiskAnalysis {
  summary: AnalysisSummary;
  risks: RiskItem[];
}

// ── 개원 시뮬레이터 ──
export interface MonthlyProjection {
  month: number;
  patients: number;
  revenue: number;
  cost: number;
  profit: number;
  cumulativeProfit: number;
}

export interface SimulatorScenario {
  label: string;
  growthRate: number;
  projections: MonthlyProjection[];
  breakEvenMonth: number | null;
  roiMonth: number | null;
}

export interface SimulatorAnalysis {
  summary: AnalysisSummary;
  initialInvestment: number;
  scenarios: SimulatorScenario[];
}

// ── 벤치마크 ──
export interface BenchmarkItem {
  label: string;
  myValue: number;
  industryAvg: number;
  unit: string;
  higherIsBetter: boolean;
}

export interface BenchmarkAnalysis {
  summary: AnalysisSummary;
  items: BenchmarkItem[];
  overallScore: number;
}

// ── 시계열 스냅샷 ──
export interface MetricSnapshot {
  date: string;
  monthlyRevenue: number;
  operatingProfit: number;
  operatingMargin: number;
  monthlyPatients: number;
  avgRevenuePerPatient: number;
}

export type DeterministicResult =
  | LocationAnalysis
  | CooAnalysis
  | PackageAnalysis
  | PositioningAnalysis
  | RiskAnalysis
  | SimulatorAnalysis
  | BenchmarkAnalysis;
