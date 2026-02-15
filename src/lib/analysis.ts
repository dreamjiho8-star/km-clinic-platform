import {
  ClinicProfile,
  Verdict,
  AnalysisSummary,
  Financials,
  LocationAnalysis,
  CooAnalysis,
  PackageItem,
  PackageAnalysis,
  PositioningAnalysis,
  RiskItem,
  RiskAnalysis,
  MonthlyProjection,
  SimulatorScenario,
  SimulatorAnalysis,
  BenchmarkItem,
  BenchmarkAnalysis,
} from "@/types/clinic";

// ────────────────────────── 유틸
function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}

// ────────────────────────── 재무 파생
export function deriveFinancials(p: ClinicProfile): Financials {
  const monthlyRevenue = p.avgRevenuePerPatient * p.monthlyPatients;
  const totalFixedCost = p.monthlyRent + p.laborCost + p.otherFixedCost;
  const totalCost = totalFixedCost + p.variableCostEstimate;
  const operatingProfit = monthlyRevenue - totalCost;
  const operatingMargin =
    monthlyRevenue > 0
      ? Math.round((operatingProfit / monthlyRevenue) * 100)
      : 0;
  const rentRatio =
    monthlyRevenue > 0
      ? Math.round((p.monthlyRent / monthlyRevenue) * 100)
      : 0;
  const laborRatio =
    monthlyRevenue > 0
      ? Math.round((p.laborCost / monthlyRevenue) * 100)
      : 0;
  // 손익분기 = 총고정비 / (객단가 - 1인당 변동비)
  const variableCostPerPatient =
    p.monthlyPatients > 0 ? p.variableCostEstimate / p.monthlyPatients : 0;
  const contributionMargin = p.avgRevenuePerPatient - variableCostPerPatient;
  const breakEvenPatients =
    contributionMargin > 0
      ? Math.ceil(totalFixedCost / contributionMargin)
      : 0;

  return {
    monthlyRevenue,
    totalFixedCost,
    totalCost,
    operatingProfit,
    operatingMargin,
    rentRatio,
    laborRatio,
    breakEvenPatients,
  };
}

// ────────────────────────── 1. 입지 분석
export function analyzeLocation(p: ClinicProfile): LocationAnalysis {
  const issues: string[] = [];
  const strengths: string[] = [];
  let verdict: Verdict = "적합";

  if (p.buildingType === "메디컬빌딩") {
    strengths.push(
      "메디컬빌딩은 의료 수요가 집중되는 환경으로, 초기 환자 유입에 유리합니다."
    );
  } else if (p.buildingType === "상가") {
    strengths.push(
      "일반 상가는 유동 인구 접근성이 높을 수 있으나, 의료 이미지 구축에 별도 노력이 필요합니다."
    );
  }

  if (p.openingStatus === "개원 예정") {
    issues.push(
      "개원 전 단계입니다. 상권 분석과 경쟁 의원 조사를 반드시 수행하십시오."
    );
    verdict = "주의 필요";
  }

  if (p.patientGroup === "노년층" && p.buildingType === "상가") {
    strengths.push("노년층 대상 진료는 1층 상가의 접근성이 유리합니다.");
  }
  if (p.patientGroup === "직장인") {
    issues.push(
      "직장인 대상이면 역세권·오피스 밀집 지역 여부를 확인하십시오."
    );
  }

  const fin = deriveFinancials(p);
  if (fin.rentRatio > 20) {
    issues.push(
      `임대료 비중이 매출의 ${fin.rentRatio}% (추정치)로 높습니다. 일반적으로 15% 이하가 안정적입니다.`
    );
    verdict = "주의 필요";
  }
  if (fin.rentRatio > 35) {
    verdict = "비추천";
  }

  if (issues.length === 0) {
    strengths.push(
      "현재 입력된 조건상 입지 관련 주요 리스크가 발견되지 않았습니다."
    );
  }

  const summary: AnalysisSummary = {
    verdict,
    oneLiner:
      verdict === "적합"
        ? `${p.regionCity} ${p.regionDong} 지역, ${p.buildingType} 기준으로 입지 조건이 양호합니다.`
        : verdict === "주의 필요"
        ? `입지 조건에 보완이 필요한 항목이 있습니다. 아래 세부 내용을 확인하십시오.`
        : `현재 임대료 수준 대비 매출 추정치가 매우 불리합니다. 입지 재검토를 권장합니다.`,
    actions:
      verdict === "적합"
        ? [
            "인근 경쟁 한의원 현황 파악",
            "건물 내 타 의료기관과의 시너지 분석",
          ]
        : [
            "임대료 협상 또는 대안 부지 검토",
            "목표 환자군의 실제 유동 인구 데이터 확인",
          ],
  };

  return { summary, strengths, issues };
}

// ────────────────────────── 2. AI COO·CFO
export function analyzeCooFinance(p: ClinicProfile): CooAnalysis {
  const fin = deriveFinancials(p);
  const issues: string[] = [];
  const insights: string[] = [];
  let verdict: Verdict = "적합";

  if (fin.operatingMargin < 10) {
    issues.push(
      `영업이익률이 ${fin.operatingMargin}% (추정치)로 매우 낮습니다. 비용 구조 개선이 시급합니다.`
    );
    verdict = "비추천";
  } else if (fin.operatingMargin < 25) {
    issues.push(
      `영업이익률이 ${fin.operatingMargin}% (추정치)입니다. 한의원 평균(25–35%)보다 낮으므로 개선 여지를 검토하십시오.`
    );
    verdict = "주의 필요";
  } else {
    insights.push(
      `영업이익률 ${fin.operatingMargin}% (추정치)로 안정적입니다.`
    );
  }

  if (fin.rentRatio > 15) {
    issues.push(
      `임대료가 매출의 ${fin.rentRatio}% (추정치)를 차지합니다. 15% 이하가 권장됩니다.`
    );
  } else {
    insights.push(
      `임대료 비중 ${fin.rentRatio}% (추정치)로 적정 수준입니다.`
    );
  }

  if (fin.laborRatio > 35) {
    issues.push(
      `인건비 비율이 매출의 ${fin.laborRatio}% (추정치)로 높습니다. 직원 생산성 또는 인력 구조를 점검하십시오.`
    );
  } else {
    insights.push(
      `인건비 비율 ${fin.laborRatio}% (추정치)로 적정 범위입니다.`
    );
  }

  insights.push(
    `손익분기 환자 수: 월 ${fmt(fin.breakEvenPatients)}명 (추정치). 현재 월 내원 환자 ${fmt(p.monthlyPatients)}명 (입력값).`
  );

  if (fin.breakEvenPatients > p.monthlyPatients) {
    issues.push(
      "현재 환자 수가 손익분기점에 미달합니다. 환자 유입 확대 또는 비용 절감이 필요합니다."
    );
    if (verdict === "적합") verdict = "주의 필요";
  }

  if (!p.includesOwnerSalary) {
    issues.push(
      "원장 인건비가 비용에 포함되지 않았습니다. 실질 수익은 위 추정치보다 낮을 수 있습니다."
    );
  }

  const revisitMap: Record<string, number> = {
    "<30%": 15,
    "30–50%": 40,
    "50–70%": 60,
    "70% 이상": 80,
  };
  const revisitMid = revisitMap[p.revisitRange] ?? 40;
  if (revisitMid < 40) {
    issues.push(
      `재진율이 ${p.revisitRange} (입력값)로 낮습니다. 신규 환자 유치 비용이 지속적으로 발생합니다.`
    );
  }

  const summary: AnalysisSummary = {
    verdict,
    oneLiner:
      verdict === "적합"
        ? `월 매출 ${fmt(fin.monthlyRevenue)}원 (추정치), 영업이익률 ${fin.operatingMargin}%로 재무 구조가 안정적입니다.`
        : verdict === "주의 필요"
        ? `재무 지표에 개선이 필요한 항목이 있습니다. 비용 구조를 점검하십시오.`
        : `수익성이 매우 낮습니다. 비용 절감 또는 매출 증대 방안을 즉시 마련하십시오.`,
    actions:
      verdict === "적합"
        ? [
            "비급여 진료 비중 확대를 통한 객단가 향상 검토",
            "재진율 유지·개선 프로그램 운영",
          ]
        : [
            "고정비(임대료·인건비) 구조 재점검",
            "객단가 향상 또는 환자 수 확대 전략 수립",
          ],
  };

  return { summary, insights, issues, financials: fin };
}

// ────────────────────────── 3. 패키지 설계
export function analyzePackage(p: ClinicProfile): PackageAnalysis {
  const packages: PackageItem[] = [];

  if (p.specialties.includes("근골격·통증")) {
    packages.push({
      name: "통증 집중 관리 패키지",
      description:
        "침, 부항, 추나 요법을 결합한 근골격 통증 관리 프로그램",
      targetPrice: `${fmt(Math.round(p.avgRevenuePerPatient * 5 * 0.9))}원 (5회, 추정치)`,
      sessions: "주 2회, 총 5회",
      rationale:
        "단회 방문 대비 5회 패키지로 재진율을 높이고 치료 연속성을 확보합니다.",
    });
  }

  if (p.specialties.includes("교통사고")) {
    packages.push({
      name: "교통사고 후유증 케어",
      description:
        "사고 후 통증·자율신경 불균형에 대한 체계적 회복 프로그램",
      targetPrice: "보험 급여 범위 내 (입력값 기준 별도 산정)",
      sessions: "주 3회 이상, 의료진 판단에 따라 조정",
      rationale:
        "교통사고 환자는 보험 처리로 인해 객단가보다 방문 빈도와 치료 기간이 핵심입니다.",
    });
  }

  if (p.specialties.includes("자율신경·정신신체")) {
    packages.push({
      name: "스트레스·불면 관리 프로그램",
      description:
        "침, 약침, 한약 처방을 결합한 자율신경 균형 회복 과정",
      targetPrice: `${fmt(Math.round(p.avgRevenuePerPatient * 8 * 0.85))}원 (8회, 추정치)`,
      sessions: "주 1–2회, 총 8회 (4주 과정)",
      rationale:
        "정신신체 영역은 장기 관리가 필요하므로 8회 과정으로 환자 이탈을 줄입니다.",
    });
  }

  if (p.specialties.includes("내과·탕약")) {
    packages.push({
      name: "체질 개선 탕약 프로그램",
      description: "체질 진단 후 맞춤 탕약 처방 및 경과 관찰",
      targetPrice: `${fmt(Math.round(p.avgRevenuePerPatient * 3))}원 (탕약 3제, 추정치)`,
      sessions: "초진 + 2주 간격 경과 관찰 3회",
      rationale:
        "탕약 처방은 객단가가 높아 소수 환자로도 매출 기여도가 큽니다. 경과 관찰로 재진을 유도합니다.",
    });
  }

  if (p.specialties.includes("다이어트·미용")) {
    packages.push({
      name: "한방 체형 관리 코스",
      description: "매선, 약침, 한약을 활용한 체형 관리 프로그램",
      targetPrice: `${fmt(Math.round(p.avgRevenuePerPatient * 10 * 0.8))}원 (10회, 추정치)`,
      sessions: "주 2회, 총 10회 (5주 과정)",
      rationale:
        "미용 시술은 비급여 비중이 높아 수익성이 좋으나, 패키지 할인으로 이탈 방지가 중요합니다.",
    });
  }

  if (packages.length === 0) {
    packages.push({
      name: "종합 건강 관리 패키지",
      description:
        "침, 뜸, 부항 등 기본 한방 치료를 결합한 건강 관리 프로그램",
      targetPrice: `${fmt(Math.round(p.avgRevenuePerPatient * 5 * 0.9))}원 (5회, 추정치)`,
      sessions: "주 1–2회, 총 5회",
      rationale:
        "기본 진료 패키지로 재진율 향상과 환자 고정화를 목표로 합니다.",
    });
  }

  const nonInsuranceNote =
    p.nonInsuranceRatio > 50
      ? "비급여 비중이 높아 패키지 가격 설정의 자유도가 큽니다. 단, 가격 민감도를 고려한 단계별 설계를 권장합니다."
      : "비급여 비중이 낮으므로, 비급여 항목을 패키지에 포함하여 점진적으로 비중을 높이는 전략이 유효합니다.";

  const summary: AnalysisSummary = {
    verdict: packages.length >= 2 ? "적합" : "주의 필요",
    oneLiner: `주 진료 분야 기준으로 ${packages.length}개의 패키지 구성안을 도출했습니다.`,
    actions: [
      "각 패키지의 원가 및 시간 소요를 검증한 후 시범 운영",
      "환자 반응에 따라 가격 및 회차를 조정",
    ],
  };

  return { summary, packages, nonInsuranceNote };
}

// ────────────────────────── 4. 진료 포지셔닝
export function analyzePositioning(p: ClinicProfile): PositioningAnalysis {
  const issues: string[] = [];
  const strengths: string[] = [];
  let verdict: Verdict = "적합";

  if (p.specialties.length === 1) {
    strengths.push(
      `'${p.specialties[0]}' 단일 전문 분야에 집중하고 있습니다. 브랜딩과 환자 인식에 유리합니다.`
    );
  } else if (p.specialties.length <= 3) {
    strengths.push(
      `${p.specialties.length}개 분야를 운영 중입니다. 적정 수준이나, 대외 홍보 시 주력 분야 1개를 명확히 하십시오.`
    );
  } else {
    issues.push(
      `${p.specialties.length}개 분야를 동시에 운영하고 있습니다. 전문성 인식이 희석될 수 있으므로, 핵심 분야 2개 이내로 포지셔닝을 좁히는 것을 권장합니다.`
    );
    verdict = "주의 필요";
  }

  if (
    p.patientGroup === "노년층" &&
    p.specialties.includes("다이어트·미용")
  ) {
    issues.push(
      "주요 환자군이 노년층이나 다이어트·미용 분야를 운영 중입니다. 타겟과 서비스의 정합성을 확인하십시오."
    );
  }
  if (p.patientGroup === "학생" && p.specialties.includes("내과·탕약")) {
    issues.push(
      "학생 대상 내과·탕약은 가격 저항이 높을 수 있습니다. 보험 급여 위주 진료 또는 간편 처방 구성을 고려하십시오."
    );
  }
  if (
    p.patientGroup === "직장인" &&
    p.specialties.includes("근골격·통증")
  ) {
    strengths.push(
      "직장인 대상 근골격·통증 진료는 수요가 꾸준합니다. 퇴근 후 진료 시간 운영이 핵심입니다."
    );
  }

  if (p.patientGroup === "학생" && p.avgRevenuePerPatient > 80000) {
    issues.push(
      `학생 대상 객단가 ${fmt(p.avgRevenuePerPatient)}원 (입력값)은 높은 편입니다. 가격 부담으로 이탈할 수 있습니다.`
    );
    verdict = "주의 필요";
  }

  if (issues.length === 0 && strengths.length > 0) {
    strengths.push(
      "현재 진료 포지셔닝에 큰 문제가 발견되지 않았습니다."
    );
  }

  const summary: AnalysisSummary = {
    verdict,
    oneLiner:
      verdict === "적합"
        ? `${p.specialties[0]} 중심의 포지셔닝이 환자군과 정합합니다.`
        : `진료 분야와 환자군 사이에 조정이 필요한 부분이 있습니다.`,
    actions: [
      "대외 홍보 시 주력 분야 1개를 전면에 배치",
      "환자군 특성에 맞는 진료 시간대·가격 구조 최적화",
    ],
  };

  return { summary, strengths, issues };
}

// ────────────────────────── 5. 리스크 관리
export function analyzeRisk(p: ClinicProfile): RiskAnalysis {
  const risks: RiskItem[] = [];

  if (p.revenueConcentration > 60) {
    risks.push({
      category: "매출 집중도",
      level: "비추천",
      detail: `특정 진료·보험 유형에 매출의 ${p.revenueConcentration}% (입력값)가 집중되어 있습니다. 해당 항목의 제도 변경 시 매출이 급감할 수 있습니다.`,
    });
  } else if (p.revenueConcentration > 40) {
    risks.push({
      category: "매출 집중도",
      level: "주의 필요",
      detail: `매출 집중도 ${p.revenueConcentration}% (입력값)입니다. 분산을 위한 신규 진료 항목 개발을 검토하십시오.`,
    });
  } else {
    risks.push({
      category: "매출 집중도",
      level: "적합",
      detail: `매출 집중도 ${p.revenueConcentration}% (입력값)로 적절히 분산되어 있습니다.`,
    });
  }

  if (p.complaintFrequency === "월 3건 이상") {
    risks.push({
      category: "환자 컴플레인",
      level: "비추천",
      detail:
        "월 3건 이상의 컴플레인은 운영 체계 또는 서비스 품질에 구조적 문제가 있을 수 있습니다. 즉각적인 원인 분석이 필요합니다.",
    });
  } else if (p.complaintFrequency === "월 1–2건") {
    risks.push({
      category: "환자 컴플레인",
      level: "주의 필요",
      detail:
        "월 1–2건의 컴플레인이 발생하고 있습니다. 유형별 분류 및 재발 방지 대책을 수립하십시오.",
    });
  } else {
    risks.push({
      category: "환자 컴플레인",
      level: "적합",
      detail: "컴플레인 빈도가 낮아 서비스 품질이 안정적입니다.",
    });
  }

  if (p.frequentWait) {
    risks.push({
      category: "대기 시간",
      level: "주의 필요",
      detail:
        "대기 시간이 잦다고 응답하셨습니다. 예약 시스템 도입 또는 진료 흐름 개선을 검토하십시오.",
    });
  } else {
    risks.push({
      category: "대기 시간",
      level: "적합",
      detail: "대기 시간 관련 문제가 보고되지 않았습니다.",
    });
  }

  const patientsPerStaffHour =
    p.staffCount > 0 && p.dailyHours > 0
      ? p.monthlyPatients / (p.staffCount * p.dailyHours * 25)
      : 0;
  if (patientsPerStaffHour > 2) {
    risks.push({
      category: "인력 부하",
      level: "주의 필요",
      detail: `직원 1인당 시간당 환자 수가 약 ${patientsPerStaffHour.toFixed(1)}명 (추정치)으로 높습니다. 서비스 품질 저하 및 이직 위험이 있습니다.`,
    });
  }

  if (p.nonInsuranceRatio > 70) {
    risks.push({
      category: "비급여 의존도",
      level: "주의 필요",
      detail: `비급여 비중이 ${p.nonInsuranceRatio}% (입력값)로 높습니다. 경기 침체 시 환자 이탈 위험이 큽니다.`,
    });
  }

  const hasRed = risks.some((r) => r.level === "비추천");
  const hasYellow = risks.some((r) => r.level === "주의 필요");
  const overallVerdict: Verdict = hasRed
    ? "비추천"
    : hasYellow
    ? "주의 필요"
    : "적합";

  const summary: AnalysisSummary = {
    verdict: overallVerdict,
    oneLiner:
      overallVerdict === "적합"
        ? "주요 운영 리스크가 관리 가능한 수준입니다."
        : overallVerdict === "주의 필요"
        ? "일부 리스크 항목에서 개선이 필요합니다."
        : "즉각적인 대응이 필요한 고위험 항목이 있습니다.",
    actions: hasRed
      ? [
          "고위험 항목을 최우선으로 대응",
          "90일 이내 개선 계획 수립 및 실행",
        ]
      : hasYellow
      ? [
          "주의 항목을 분기 내 점검·개선",
          "정기적인 리스크 모니터링 체계 구축",
        ]
      : [
          "현 수준 유지 및 분기별 리스크 재점검",
          "신규 리스크 항목(제도 변경 등) 모니터링",
        ],
  };

  return { summary, risks };
}

// ────────────────────────── 6. 개원 시뮬레이터
export function analyzeSimulator(p: ClinicProfile): SimulatorAnalysis {
  const fin = deriveFinancials(p);

  // 초기 투자금 (사용자 입력값 합산)
  const initialInvestment =
    (p.depositAmount ?? 0) +
    (p.keyMoney ?? 0) +
    (p.interiorCost ?? 0) +
    (p.equipmentCost ?? 0) +
    (p.initialStockCost ?? 0) +
    (p.otherInitialCost ?? 0);

  const variablePerPatient =
    p.monthlyPatients > 0 ? p.variableCostEstimate / p.monthlyPatients : 0;
  const fixedCost = p.monthlyRent + p.laborCost + p.otherFixedCost;

  function simulate(growthRate: number): Omit<SimulatorScenario, "label" | "growthRate"> {
    const projections: MonthlyProjection[] = [];
    let cumulative = -initialInvestment;
    let breakEvenMonth: number | null = null;
    let roiMonth: number | null = null;

    for (let m = 1; m <= 36; m++) {
      const patients = Math.round(
        p.monthlyPatients * Math.pow(1 + growthRate / 100, m)
      );
      const revenue = patients * p.avgRevenuePerPatient;
      const variableCost = Math.round(patients * variablePerPatient);
      const cost = fixedCost + variableCost;
      const profit = revenue - cost;
      cumulative += profit;

      projections.push({
        month: m,
        patients,
        revenue,
        cost,
        profit,
        cumulativeProfit: cumulative,
      });

      if (breakEvenMonth === null && profit >= 0) breakEvenMonth = m;
      if (roiMonth === null && cumulative >= 0) roiMonth = m;
    }

    return { projections, breakEvenMonth, roiMonth };
  }

  const scenarios: SimulatorScenario[] = [
    { label: "보수적", growthRate: 1, ...simulate(1) },
    { label: "기본", growthRate: 3, ...simulate(3) },
    { label: "낙관적", growthRate: 5, ...simulate(5) },
  ];

  const base = scenarios[1];
  let verdict: Verdict = "적합";
  if (base.roiMonth === null || base.roiMonth > 30) verdict = "주의 필요";
  if (base.breakEvenMonth === null) verdict = "비추천";
  if (base.roiMonth === null && base.projections[35].cumulativeProfit < -initialInvestment * 0.5) {
    verdict = "비추천";
  }

  const summary: AnalysisSummary = {
    verdict,
    oneLiner: base.roiMonth
      ? `기본 시나리오(월 ${base.growthRate}% 성장) 기준, ${base.roiMonth}개월 차에 투자금 회수가 예상됩니다.`
      : "36개월 내 투자금 회수가 어려울 수 있습니다. 비용 구조 재검토가 필요합니다.",
    actions: [
      "초기 투자금을 최소화할 수 있는 방안 검토 (중고 장비, 단계적 인테리어)",
      "개원 초기 환자 유입을 위한 지역 홍보 전략 수립",
      "월별 실적 대비 시나리오 달성률 추적",
    ],
  };

  return { summary, initialInvestment, scenarios };
}

// ────────────────────────── 7. 벤치마크
// 한의원 업계 평균 — 공공데이터 기반
// ┌─ 영업이익률 28.6%        ← 통계청 경제총조사 2020 (한의원)
// ├─ 임대료 비율 10%         ← 의원급 별도 공개 없음, 업계 관행 기반 추정
// ├─ 인건비 비율 25%         ← 의원급 별도 공개 없음, 업계 관행 기반 추정
// ├─ 평균 객단가 68,594원    ← HIRA 진료비통계지표 2023 상반기 (외래 내원일당 요양급여비용)
// ├─ 월 환자 수 500명        ← HIRA 2023 상반기 (내원일수 44,064천일 ÷ 14,497개소 ÷ 6개월)
// ├─ 월 매출 29,430,000원    ← 통계청 경제총조사 2020 (한의원 월평균 매출)
// └─ 비급여 비중 37.5%       ← 보건복지부 한방의료이용 실태조사 2014
const INDUSTRY_AVG = {
  operatingMargin: 28.6,
  rentRatio: 10,
  laborRatio: 25,
  avgRevenuePerPatient: 68594,
  monthlyPatients: 500,
  monthlyRevenue: 29_430_000,
  nonInsuranceRatio: 37.5,
};

export function analyzeBenchmark(p: ClinicProfile): BenchmarkAnalysis {
  const fin = deriveFinancials(p);

  const items: BenchmarkItem[] = [
    {
      label: "영업이익률",
      myValue: fin.operatingMargin,
      industryAvg: INDUSTRY_AVG.operatingMargin,
      unit: "%",
      higherIsBetter: true,
    },
    {
      label: "임대료 비율",
      myValue: fin.rentRatio,
      industryAvg: INDUSTRY_AVG.rentRatio,
      unit: "%",
      higherIsBetter: false,
    },
    {
      label: "인건비 비율",
      myValue: fin.laborRatio,
      industryAvg: INDUSTRY_AVG.laborRatio,
      unit: "%",
      higherIsBetter: false,
    },
    {
      label: "평균 객단가",
      myValue: p.avgRevenuePerPatient,
      industryAvg: INDUSTRY_AVG.avgRevenuePerPatient,
      unit: "원",
      higherIsBetter: true,
    },
    {
      label: "월 환자 수",
      myValue: p.monthlyPatients,
      industryAvg: INDUSTRY_AVG.monthlyPatients,
      unit: "명",
      higherIsBetter: true,
    },
    {
      label: "월 매출",
      myValue: fin.monthlyRevenue,
      industryAvg: INDUSTRY_AVG.monthlyRevenue,
      unit: "원",
      higherIsBetter: true,
    },
    {
      label: "비급여 비중",
      myValue: p.nonInsuranceRatio,
      industryAvg: INDUSTRY_AVG.nonInsuranceRatio,
      unit: "%",
      higherIsBetter: true,
    },
  ];

  const betterCount = items.filter((i) =>
    i.higherIsBetter
      ? i.myValue >= i.industryAvg
      : i.myValue <= i.industryAvg
  ).length;
  const overallScore = Math.round((betterCount / items.length) * 100);

  let verdict: Verdict = "적합";
  if (overallScore < 60) verdict = "주의 필요";
  if (overallScore < 30) verdict = "비추천";

  const summary: AnalysisSummary = {
    verdict,
    oneLiner: `${items.length}개 지표 중 ${betterCount}개가 업계 평균 이상입니다 (종합 ${overallScore}점).`,
    actions:
      overallScore >= 60
        ? [
            "현재 강점을 유지하면서 약점 지표를 집중 개선",
            "분기별 벤치마크 재비교로 추세 관리",
          ]
        : [
            "업계 평균 이하 지표를 우선순위로 개선 계획 수립",
            "인근 성공 한의원의 운영 모델 벤치마킹",
          ],
  };

  return { summary, items, overallScore };
}
