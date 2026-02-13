"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  OpeningStatus,
  BuildingType,
  Specialty,
  PatientGroup,
  RevisitRange,
  ComplaintFrequency,
} from "@/types/clinic";

const OPENING_OPTIONS: OpeningStatus[] = ["개원 예정", "1년 미만", "1–3년", "3년 이상"];
const BUILDING_OPTIONS: BuildingType[] = ["상가", "주상복합", "메디컬빌딩", "기타"];
const SPECIALTY_OPTIONS: Specialty[] = [
  "근골격·통증", "교통사고", "자율신경·정신신체", "내과·탕약", "다이어트·미용",
];
const PATIENT_OPTIONS: PatientGroup[] = ["직장인", "학생", "노년층", "여성 위주", "혼합"];
const REVISIT_OPTIONS: RevisitRange[] = ["<30%", "30–50%", "50–70%", "70% 이상"];
const COMPLAINT_OPTIONS: ComplaintFrequency[] = ["거의 없음", "월 1–2건", "월 3건 이상"];

const STEPS = [
  { id: 1, label: "기본 정보" },
  { id: 2, label: "진료 구조" },
  { id: 3, label: "수익 구조" },
  { id: 4, label: "비용 구조" },
  { id: 5, label: "운영·리스크" },
];

export default function SetupForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // 기본 정보
  const [openingStatus, setOpeningStatus] = useState<OpeningStatus>("1년 미만");
  const [regionCity, setRegionCity] = useState("");
  const [regionDong, setRegionDong] = useState("");
  const [buildingType, setBuildingType] = useState<BuildingType>("상가");

  // 진료 구조
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [patientGroup, setPatientGroup] = useState<PatientGroup>("혼합");

  // 수익 구조
  const [avgRevenuePerPatient, setAvgRevenuePerPatient] = useState(50000);
  const [revisitRange, setRevisitRange] = useState<RevisitRange>("30–50%");
  const [monthlyPatients, setMonthlyPatients] = useState(300);
  const [nonInsuranceRatio, setNonInsuranceRatio] = useState(30);

  // 비용 구조
  const [monthlyRent, setMonthlyRent] = useState(3000000);
  const [laborCost, setLaborCost] = useState(5000000);
  const [otherFixedCost, setOtherFixedCost] = useState(1000000);
  const [variableCostEstimate, setVariableCostEstimate] = useState(2000000);
  const [includesOwnerSalary, setIncludesOwnerSalary] = useState(false);

  // 운영 및 리스크
  const [staffCount, setStaffCount] = useState(3);
  const [dailyHours, setDailyHours] = useState(8);
  const [frequentWait, setFrequentWait] = useState(false);
  const [complaintFrequency, setComplaintFrequency] = useState<ComplaintFrequency>("거의 없음");
  const [revenueConcentration, setRevenueConcentration] = useState(30);

  function toggleSpecialty(s: Specialty) {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const canNext =
    step === 1 ? regionCity.trim() !== "" && regionDong.trim() !== ""
    : step === 2 ? specialties.length > 0
    : true;

  const monthlyRevenue = avgRevenuePerPatient * monthlyPatients;
  const totalCost = monthlyRent + laborCost + otherFixedCost + variableCostEstimate;

  async function handleSubmit() {
    setSaving(true);
    try {
      const res = await fetch("/api/clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openingStatus, regionCity, regionDong, buildingType,
          specialties, patientGroup,
          avgRevenuePerPatient, revisitRange, monthlyPatients, nonInsuranceRatio,
          monthlyRent, laborCost, otherFixedCost, variableCostEstimate, includesOwnerSalary,
          staffCount, dailyHours, frequentWait, complaintFrequency, revenueConcentration,
        }),
      });
      if (res.ok) router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <h1 className="text-xl font-bold text-gray-900">한의원 경영 인텔리전스</h1>
          <p className="text-sm text-gray-500 mt-1">경영 분석을 위한 기본 정보를 입력합니다</p>
        </div>
      </header>

      {/* 스텝 인디케이터 - 깔끔한 한 줄 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => setStep(s.id)}
                  className="flex items-center gap-2"
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all ${
                      step === s.id
                        ? "bg-emerald-600 text-white"
                        : step > s.id
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step > s.id ? "✓" : s.id}
                  </span>
                  <span
                    className={`text-sm font-medium whitespace-nowrap transition-colors ${
                      step === s.id
                        ? "text-emerald-700"
                        : step > s.id
                        ? "text-emerald-600"
                        : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-8 lg:w-12 h-px mx-3 flex-shrink-0 ${
                      step > s.id ? "bg-emerald-300" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 폼 본문 */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* 스텝 제목 */}
          <div className="px-8 pt-8 pb-2">
            <h2 className="text-lg font-bold text-gray-900">
              {STEPS[step - 1].label}
            </h2>
          </div>

          <div className="px-8 pb-8 pt-4">

            {/* ── 스텝 1: 기본 정보 ── */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">개원 상태</label>
                    <div className="grid grid-cols-2 gap-2">
                      {OPENING_OPTIONS.map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => setOpeningStatus(o)}
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                            openingStatus === o
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">건물 유형</label>
                    <div className="grid grid-cols-2 gap-2">
                      {BUILDING_OPTIONS.map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => setBuildingType(o)}
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                            buildingType === o
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">지역 (시/군/구)</label>
                    <input
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none transition-all"
                      placeholder="예: 서울시 강남구"
                      value={regionCity}
                      onChange={(e) => setRegionCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">동</label>
                    <input
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none transition-all"
                      placeholder="예: 역삼동"
                      value={regionDong}
                      onChange={(e) => setRegionDong(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── 스텝 2: 진료 구조 ── */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    주 진료 분야
                    <span className="ml-2 text-xs text-gray-400 font-normal">복수 선택 가능</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SPECIALTY_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSpecialty(s)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all text-left ${
                          specialties.includes(s)
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {specialties.length === 0 && (
                    <p className="text-xs text-red-500 mt-2">최소 1개를 선택해 주십시오</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">주요 환자군</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {PATIENT_OPTIONS.map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setPatientGroup(o)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          patientGroup === o
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── 스텝 3: 수익 구조 ── */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">평균 객단가 (원)</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                      value={avgRevenuePerPatient}
                      onChange={(e) => setAvgRevenuePerPatient(Number(e.target.value))}
                      min={0} step={1000}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">월 내원 환자 수 (명)</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                      value={monthlyPatients}
                      onChange={(e) => setMonthlyPatients(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">재진율 구간</label>
                  <div className="grid grid-cols-4 gap-2">
                    {REVISIT_OPTIONS.map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setRevisitRange(o)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          revisitRange === o
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">비급여 비중 (%)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={0} max={100} step={5}
                      value={nonInsuranceRatio}
                      onChange={(e) => setNonInsuranceRatio(Number(e.target.value))}
                      className="flex-1 accent-emerald-600"
                    />
                    <span className="text-sm font-semibold text-gray-700 w-12 text-right">{nonInsuranceRatio}%</span>
                  </div>
                </div>
                {/* 매출 미리보기 */}
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-medium mb-1">월 매출 추정</p>
                  <p className="text-2xl font-bold text-emerald-800">
                    {monthlyRevenue.toLocaleString("ko-KR")}원
                  </p>
                </div>
              </div>
            )}

            {/* ── 스텝 4: 비용 구조 ── */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  {[
                    { label: "월 임대료 (원)", value: monthlyRent, set: setMonthlyRent },
                    { label: "인건비 (원/월)", value: laborCost, set: setLaborCost },
                    { label: "기타 고정비 (원/월)", value: otherFixedCost, set: setOtherFixedCost },
                    { label: "변동비 추정 (원/월)", value: variableCostEstimate, set: setVariableCostEstimate },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{f.label}</label>
                      <input
                        type="number"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                        value={f.value}
                        onChange={(e) => f.set(Number(e.target.value))}
                        min={0} step={100000}
                      />
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                  <input
                    type="checkbox"
                    checked={includesOwnerSalary}
                    onChange={(e) => setIncludesOwnerSalary(e.target.checked)}
                    className="w-5 h-5 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">원장 인건비가 위 인건비에 포함됨</span>
                </label>
                {/* 비용 미리보기 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">월 총비용 추정</p>
                    <p className="text-xl font-bold text-gray-800">{totalCost.toLocaleString("ko-KR")}원</p>
                  </div>
                  <div className={`rounded-xl p-4 border ${monthlyRevenue - totalCost >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
                    <p className="text-xs text-gray-500 mb-1">영업이익 추정</p>
                    <p className={`text-xl font-bold ${monthlyRevenue - totalCost >= 0 ? "text-emerald-800" : "text-red-700"}`}>
                      {(monthlyRevenue - totalCost).toLocaleString("ko-KR")}원
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── 스텝 5: 운영·리스크 ── */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">직원 수 (원장 제외)</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                      value={staffCount}
                      onChange={(e) => setStaffCount(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">하루 진료 시간</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                      value={dailyHours}
                      onChange={(e) => setDailyHours(Number(e.target.value))}
                      min={1} max={24}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">컴플레인 빈도</label>
                  <div className="grid grid-cols-3 gap-2">
                    {COMPLAINT_OPTIONS.map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setComplaintFrequency(o)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          complaintFrequency === o
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    매출 집중도 (%) — 가장 큰 단일 항목의 비중
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={0} max={100} step={5}
                      value={revenueConcentration}
                      onChange={(e) => setRevenueConcentration(Number(e.target.value))}
                      className="flex-1 accent-emerald-600"
                    />
                    <span className="text-sm font-semibold text-gray-700 w-12 text-right">{revenueConcentration}%</span>
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                  <input
                    type="checkbox"
                    checked={frequentWait}
                    onChange={(e) => setFrequentWait(e.target.checked)}
                    className="w-5 h-5 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">대기 시간이 자주 발생함</span>
                </label>
              </div>
            )}
          </div>

          {/* 하단 버튼 */}
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-all disabled:opacity-0"
            >
              이전
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canNext}
                className="px-6 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                다음
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || specialties.length === 0}
                className="px-8 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "저장 중..." : "저장 후 분석 시작"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
