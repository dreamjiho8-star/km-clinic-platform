"use client";

import { useState, useEffect } from "react";
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
  const [submitError, setSubmitError] = useState("");

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

  // 초기 투자금
  const [depositAmount, setDepositAmount] = useState(30000000);
  const [keyMoney, setKeyMoney] = useState(0);
  const [interiorCost, setInteriorCost] = useState(30000000);
  const [equipmentCost, setEquipmentCost] = useState(20000000);
  const [initialStockCost, setInitialStockCost] = useState(5000000);
  const [otherInitialCost, setOtherInitialCost] = useState(5000000);

  // 운영 및 리스크
  const [staffCount, setStaffCount] = useState(3);
  const [dailyHours, setDailyHours] = useState(8);
  const [frequentWait, setFrequentWait] = useState(false);
  const [complaintFrequency, setComplaintFrequency] = useState<ComplaintFrequency>("거의 없음");
  const [revenueConcentration, setRevenueConcentration] = useState(30);

  // 기존 프로필이 있으면 폼에 반영 (정보 수정 시)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("clinic-profile");
      if (!saved) return;
      const p = JSON.parse(saved);
      if (p.openingStatus) setOpeningStatus(p.openingStatus);
      if (p.regionCity) setRegionCity(p.regionCity);
      if (p.regionDong) setRegionDong(p.regionDong);
      if (p.buildingType) setBuildingType(p.buildingType);
      if (p.specialties?.length) setSpecialties(p.specialties);
      if (p.patientGroup) setPatientGroup(p.patientGroup);
      if (p.avgRevenuePerPatient) setAvgRevenuePerPatient(p.avgRevenuePerPatient);
      if (p.revisitRange) setRevisitRange(p.revisitRange);
      if (p.monthlyPatients) setMonthlyPatients(p.monthlyPatients);
      if (p.nonInsuranceRatio != null) setNonInsuranceRatio(p.nonInsuranceRatio);
      if (p.monthlyRent) setMonthlyRent(p.monthlyRent);
      if (p.laborCost) setLaborCost(p.laborCost);
      if (p.otherFixedCost != null) setOtherFixedCost(p.otherFixedCost);
      if (p.variableCostEstimate != null) setVariableCostEstimate(p.variableCostEstimate);
      if (p.includesOwnerSalary != null) setIncludesOwnerSalary(p.includesOwnerSalary);
      if (p.depositAmount != null) setDepositAmount(p.depositAmount);
      if (p.keyMoney != null) setKeyMoney(p.keyMoney);
      if (p.interiorCost != null) setInteriorCost(p.interiorCost);
      if (p.equipmentCost != null) setEquipmentCost(p.equipmentCost);
      if (p.initialStockCost != null) setInitialStockCost(p.initialStockCost);
      if (p.otherInitialCost != null) setOtherInitialCost(p.otherInitialCost);
      if (p.staffCount != null) setStaffCount(p.staffCount);
      if (p.dailyHours) setDailyHours(p.dailyHours);
      if (p.frequentWait != null) setFrequentWait(p.frequentWait);
      if (p.complaintFrequency) setComplaintFrequency(p.complaintFrequency);
      if (p.revenueConcentration != null) setRevenueConcentration(p.revenueConcentration);
    } catch (e) {
      console.warn("[SetupForm] 저장된 프로필 복원 실패:", e);
    }
  }, []);

  function toggleSpecialty(s: Specialty) {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function isStepValid(s: number): boolean {
    if (s >= 1 && (regionCity.trim() === "" || regionDong.trim() === "")) return false;
    if (s >= 2 && specialties.length === 0) return false;
    return true;
  }

  const canNext = isStepValid(step);

  function handleStepClick(targetStep: number) {
    // 현재 스텝 이전으로 돌아가는 건 항상 허용
    if (targetStep <= step) {
      setStep(targetStep);
      return;
    }
    // 앞으로 이동 시 중간 스텝까지 모두 유효해야 함
    for (let s = step; s < targetStep; s++) {
      if (!isStepValid(s)) return;
    }
    setStep(targetStep);
  }

  const monthlyRevenue = avgRevenuePerPatient * monthlyPatients;
  const totalCost = monthlyRent + laborCost + otherFixedCost + variableCostEstimate;
  const totalInitialInvestment = depositAmount + keyMoney + interiorCost + equipmentCost + initialStockCost + otherInitialCost;

  async function handleSubmit() {
    setSaving(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openingStatus, regionCity, regionDong, buildingType,
          specialties, patientGroup,
          avgRevenuePerPatient, revisitRange, monthlyPatients, nonInsuranceRatio,
          monthlyRent, laborCost, otherFixedCost, variableCostEstimate, includesOwnerSalary,
          depositAmount, keyMoney, interiorCost, equipmentCost, initialStockCost, otherInitialCost,
          staffCount, dailyHours, frequentWait, complaintFrequency, revenueConcentration,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          localStorage.setItem("clinic-profile", JSON.stringify(data.profile));

          // 시계열 스냅샷 자동 저장
          try {
            const totalFixed = monthlyRent + laborCost + otherFixedCost;
            const totalCostCalc = totalFixed + variableCostEstimate;
            const opProfit = monthlyRevenue - totalCostCalc;
            const opMargin = monthlyRevenue > 0 ? Math.round((opProfit / monthlyRevenue) * 100) : 0;
            const snapshot = {
              date: new Date().toISOString().split("T")[0],
              monthlyRevenue,
              operatingProfit: opProfit,
              operatingMargin: opMargin,
              monthlyPatients,
              avgRevenuePerPatient,
            };
            const existing = JSON.parse(localStorage.getItem("clinic-metric-snapshots") || "[]");
            existing.push(snapshot);
            localStorage.setItem("clinic-metric-snapshots", JSON.stringify(existing));
          } catch {
            // 스냅샷 실패해도 정상 진행
          }
        }
        router.push("/dashboard");
      } else {
        const err = await res.json().catch(() => ({}));
        setSubmitError(err.error || "저장에 실패했습니다. 다시 시도해 주십시오.");
      }
    } catch {
      setSubmitError("네트워크 오류가 발생했습니다. 연결을 확인해 주십시오.");
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

      {/* 스텝 인디케이터 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          {/* 모바일: 현재 스텝 라벨 + 도트 */}
          <div className="sm:hidden flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5">
              {STEPS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleStepClick(s.id)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    step === s.id
                      ? "w-6 bg-emerald-600"
                      : step > s.id
                      ? "bg-emerald-300"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-emerald-700">
              {step}. {STEPS.find((s) => s.id === step)?.label}
            </span>
          </div>
          {/* 데스크탑: 기존 스텝 표시 */}
          <div className="hidden sm:flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => handleStepClick(s.id)}
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
                      value={avgRevenuePerPatient || ""}
                      onChange={(e) => setAvgRevenuePerPatient(e.target.value === "" ? 0 : Number(e.target.value))}
                      min={0} step={1000}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">월 내원 환자 수 (명)</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                      value={monthlyPatients || ""}
                      onChange={(e) => setMonthlyPatients(e.target.value === "" ? 0 : Number(e.target.value))}
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
                        value={f.value || ""}
                        onChange={(e) => f.set(e.target.value === "" ? 0 : Number(e.target.value))}
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
                {/* 초기 투자금 */}
                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    초기 투자금
                  </label>
                  <p className="text-xs text-gray-400 mb-4">개원 시뮬레이션에 사용됩니다. 해당 없는 항목은 0으로 두면 됩니다.</p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "보증금", value: depositAmount, set: setDepositAmount },
                      { label: "권리금", value: keyMoney, set: setKeyMoney },
                      { label: "인테리어", value: interiorCost, set: setInteriorCost },
                      { label: "의료장비", value: equipmentCost, set: setEquipmentCost },
                      { label: "초기 재고 (한약재 등)", value: initialStockCost, set: setInitialStockCost },
                      { label: "기타 (간판·가구·IT 등)", value: otherInitialCost, set: setOtherInitialCost },
                    ].map((f) => (
                      <div key={f.label}>
                        <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                          value={f.value || ""}
                          onChange={(e) => f.set(e.target.value === "" ? 0 : Number(e.target.value))}
                          min={0} step={1000000}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">총 초기 투자금</span>
                      <span className="text-base font-bold text-gray-800">{totalInitialInvestment.toLocaleString("ko-KR")}원</span>
                    </div>
                  </div>
                </div>

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
                      value={staffCount || ""}
                      onChange={(e) => setStaffCount(e.target.value === "" ? 0 : Number(e.target.value))}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">하루 진료 시간</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                      value={dailyHours || ""}
                      onChange={(e) => setDailyHours(e.target.value === "" ? 0 : Number(e.target.value))}
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

          {/* 에러 메시지 */}
          {submitError && (
            <div className="mx-8 mb-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
              {submitError}
            </div>
          )}

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
