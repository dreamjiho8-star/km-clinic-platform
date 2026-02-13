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
