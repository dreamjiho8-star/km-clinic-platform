export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  setMemoryProfile,
  getMemoryProfile,
  saveProfileLocal,
  loadProfileLocal,
  deleteProfileLocal,
} from "@/lib/storage";
import { ClinicProfile } from "@/types/clinic";

const OPENING_STATUSES = ["개원 예정", "1년 미만", "1–3년", "3년 이상"];
const BUILDING_TYPES = ["상가", "주상복합", "메디컬빌딩", "기타"];
const SPECIALTIES = ["근골격·통증", "교통사고", "자율신경·정신신체", "내과·탕약", "다이어트·미용"];
const PATIENT_GROUPS = ["직장인", "학생", "노년층", "여성 위주", "혼합"];
const REVISIT_RANGES = ["<30%", "30–50%", "50–70%", "70% 이상"];
const COMPLAINT_FREQUENCIES = ["거의 없음", "월 1–2건", "월 3건 이상"];

function validateProfileBody(body: Record<string, unknown>): string | null {
  if (!body.regionCity || typeof body.regionCity !== "string" || !body.regionCity.trim()) {
    return "지역(시/군/구)은 필수 입력입니다";
  }
  if (!body.regionDong || typeof body.regionDong !== "string" || !body.regionDong.trim()) {
    return "동은 필수 입력입니다";
  }
  if (!OPENING_STATUSES.includes(body.openingStatus as string)) {
    return "유효하지 않은 개원 상태입니다";
  }
  if (!BUILDING_TYPES.includes(body.buildingType as string)) {
    return "유효하지 않은 건물 유형입니다";
  }
  if (!Array.isArray(body.specialties) || body.specialties.length === 0) {
    return "최소 1개의 진료 분야를 선택해야 합니다";
  }
  if (!body.specialties.every((s: unknown) => SPECIALTIES.includes(s as string))) {
    return "유효하지 않은 진료 분야가 포함되어 있습니다";
  }
  if (!PATIENT_GROUPS.includes(body.patientGroup as string)) {
    return "유효하지 않은 환자군입니다";
  }
  if (!REVISIT_RANGES.includes(body.revisitRange as string)) {
    return "유효하지 않은 재진율 구간입니다";
  }
  if (!COMPLAINT_FREQUENCIES.includes(body.complaintFrequency as string)) {
    return "유효하지 않은 컴플레인 빈도입니다";
  }

  const numericFields = [
    { key: "avgRevenuePerPatient", label: "평균 객단가", min: 0 },
    { key: "monthlyPatients", label: "월 환자 수", min: 0 },
    { key: "nonInsuranceRatio", label: "비급여 비중", min: 0, max: 100 },
    { key: "monthlyRent", label: "월 임대료", min: 0 },
    { key: "laborCost", label: "인건비", min: 0 },
    { key: "otherFixedCost", label: "기타 고정비", min: 0 },
    { key: "variableCostEstimate", label: "변동비", min: 0 },
    { key: "staffCount", label: "직원 수", min: 0 },
    { key: "dailyHours", label: "진료 시간", min: 1, max: 24 },
    { key: "revenueConcentration", label: "매출 집중도", min: 0, max: 100 },
    { key: "depositAmount", label: "보증금", min: 0 },
    { key: "keyMoney", label: "권리금", min: 0 },
    { key: "interiorCost", label: "인테리어 비용", min: 0 },
    { key: "equipmentCost", label: "의료장비 비용", min: 0 },
    { key: "initialStockCost", label: "초기 재고 비용", min: 0 },
    { key: "otherInitialCost", label: "기타 초기 비용", min: 0 },
  ];
  for (const f of numericFields) {
    const val = body[f.key];
    if (typeof val !== "number" || !isFinite(val)) {
      return `${f.label}은(는) 유효한 숫자여야 합니다`;
    }
    if (val < f.min) return `${f.label}은(는) ${f.min} 이상이어야 합니다`;
    if (f.max !== undefined && val > f.max) return `${f.label}은(는) ${f.max} 이하여야 합니다`;
  }

  if (typeof body.includesOwnerSalary !== "boolean") {
    return "원장 인건비 포함 여부는 boolean이어야 합니다";
  }
  if (typeof body.frequentWait !== "boolean") {
    return "대기 시간 여부는 boolean이어야 합니다";
  }

  return null;
}

export async function GET() {
  let profile = getMemoryProfile();
  if (!profile) {
    profile = await loadProfileLocal();
  }
  return NextResponse.json({ profile: profile || null });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validationError = validateProfileBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const profile: ClinicProfile = {
      id: body.id || crypto.randomUUID(),
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      openingStatus: body.openingStatus,
      regionCity: body.regionCity.trim(),
      regionDong: body.regionDong.trim(),
      buildingType: body.buildingType,
      specialties: body.specialties,
      patientGroup: body.patientGroup,
      avgRevenuePerPatient: body.avgRevenuePerPatient,
      revisitRange: body.revisitRange,
      monthlyPatients: body.monthlyPatients,
      nonInsuranceRatio: body.nonInsuranceRatio,
      monthlyRent: body.monthlyRent,
      laborCost: body.laborCost,
      otherFixedCost: body.otherFixedCost,
      variableCostEstimate: body.variableCostEstimate,
      includesOwnerSalary: body.includesOwnerSalary,
      depositAmount: body.depositAmount,
      keyMoney: body.keyMoney,
      interiorCost: body.interiorCost,
      equipmentCost: body.equipmentCost,
      initialStockCost: body.initialStockCost,
      otherInitialCost: body.otherInitialCost,
      staffCount: body.staffCount,
      dailyHours: body.dailyHours,
      frequentWait: body.frequentWait,
      complaintFrequency: body.complaintFrequency,
      revenueConcentration: body.revenueConcentration,
    };

    setMemoryProfile(profile);
    await saveProfileLocal(profile);
    return NextResponse.json({ success: true, profile });
  } catch (e) {
    console.error("[clinic] POST 오류:", e);
    return NextResponse.json({ error: "프로필 저장에 실패했습니다" }, { status: 400 });
  }
}

export async function DELETE() {
  setMemoryProfile(null);
  await deleteProfileLocal();
  return NextResponse.json({ success: true });
}
