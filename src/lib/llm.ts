import { ClinicProfile } from "@/types/clinic";
import { deriveFinancials } from "./analysis";

const BASE_URL = (process.env.LLM_BASE_URL || "http://localhost:11434/v1").trim();
const API_KEY = (process.env.LLM_API_KEY || "ollama").trim();
const MODEL = (process.env.LLM_MODEL || "llama3.1:latest").trim();

// 영어→한글 치환 맵 (word boundary로 정확히 매칭)
const REPLACE_MAP: [RegExp, string][] = [
  [/\bVIP\b/gi, "프리미엄"],
  [/\bpremium\b/gi, "프리미엄"],
  [/\bpackage\b/gi, "패키지"],
  [/\bmarketing\b/gi, "홍보"],
  [/\bbranding\b/gi, "브랜딩"],
  [/\bfeedback\b/gi, "피드백"],
  [/\bservice\b/gi, "서비스"],
  [/\bsystem\b/gi, "시스템"],
  [/\bstress\b/gi, "스트레스"],
  [/\bconsulting\b/gi, "컨설팅"],
  [/\bpositioning\b/gi, "포지셔닝"],
];

function postProcess(text: string): string {
  let result = text;
  // 한자 제거
  result = result.replace(/[\u4e00-\u9fff]/g, "");
  // 알려진 영어→한글 치환
  for (const [pattern, replacement] of REPLACE_MAP) {
    result = result.replace(pattern, replacement);
  }
  // 마크다운 구조를 깨지 않도록 영어 단어는 그대로 유지
  // 중복 공백 정리
  result = result.replace(/  +/g, " ");
  result = result.replace(/\n{3,}/g, "\n\n");
  return result.trim();
}

export async function callLLM(
  messages: { role: string; content: string }[]
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 16384,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`[llm] API 응답 오류: ${res.status} ${res.statusText}`);
      return "";
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";
    return postProcess(content);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      console.error("[llm] 요청 타임아웃 (180초 초과)");
    } else {
      console.error("[llm] 호출 실패:", e);
    }
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

export function profileToContext(p: ClinicProfile): string {
  const f = deriveFinancials(p);
  return `## 한의원 프로필 데이터

**기본 정보:**
- 지역: ${p.regionCity} ${p.regionDong}
- 건물 유형: ${p.buildingType}
- 개원 상태: ${p.openingStatus}

**진료 구조:**
- 주 진료 분야: ${p.specialties.join(", ")}
- 주요 환자군: ${p.patientGroup}

**수익 구조:**
- 평균 객단가: ${p.avgRevenuePerPatient.toLocaleString()}원
- 월 내원 환자 수: ${p.monthlyPatients.toLocaleString()}명
- 재진율 구간: ${p.revisitRange}
- 비급여 비중: ${p.nonInsuranceRatio}%
- 월 매출 추정: ${f.monthlyRevenue.toLocaleString()}원

**비용 구조:**
- 임대료: ${p.monthlyRent.toLocaleString()}원 (매출 대비 ${f.rentRatio}%)
- 인건비: ${p.laborCost.toLocaleString()}원 (매출 대비 ${f.laborRatio}%)
- 기타 고정비: ${p.otherFixedCost.toLocaleString()}원
- 변동비: ${p.variableCostEstimate.toLocaleString()}원

**재무 지표 (추정):**
- 영업이익: ${f.operatingProfit.toLocaleString()}원
- 영업이익률: ${f.operatingMargin}%
- 손익분기 환자 수: ${f.breakEvenPatients.toLocaleString()}명/월

**운영:**
- 직원 수: ${p.staffCount}명 (원장 제외)
- 일 진료 시간: ${p.dailyHours}시간
- 대기 시간 문제: ${p.frequentWait ? "있음" : "없음"}
- 컴플레인 빈도: ${p.complaintFrequency}
- 매출 집중도: ${p.revenueConcentration}%`;
}

const BASE_RULE = `당신은 한의원 경영 컨설팅 분야 최고 전문가입니다. 반드시 한국어로 작성하십시오.

**작성 원칙:**
1. 하십시오체를 사용합니다.
2. 숫자와 데이터에 기반한 구체적 근거를 제시합니다.
3. 추상적 조언이 아닌, 즉시 실행 가능한 액션 아이템을 제시합니다.
4. 마크다운 형식(##, ###, -, **강조**)을 사용합니다.
5. VIP는 "프리미엄"으로 표기하고, 불필요한 영어 사용은 피합니다.
6. 한의원 업계의 실무적 맥락과 건강보험 제도를 반영합니다.
7. 핵심 포인트 위주로 간결하게 작성하되, 구체적 데이터와 근거는 반드시 포함합니다. 불필요한 반복 설명은 피합니다.`;

const PROMPTS: Record<string, string> = {
  location: `${BASE_RULE}

**역할:** 한의원 입지 분석 전문가

아래 프로필 데이터를 분석하여 다음을 작성하십시오:
## 입지 종합 평가 — 지역·건물·환자군 정합성
## 유효한 진료 포지션 — 입지에서 효과적인 진료 분야 3가지와 근거
## 경쟁 구조 분석 — 피해야 할 경쟁 구도
## 입지 유지 vs 전환 판단 — 각 시나리오의 조건과 기준
## 90일 실행 계획 — 우선순위별 3가지 과제`,

  coo: `${BASE_RULE}

**역할:** 한의원 경영 분석가 (COO·CFO 관점)

아래 프로필 데이터를 분석하여 다음을 작성하십시오:
## 재무 건전성 종합 평가 — 업계 기준 비교
## 시간 대비 수익 분석 — 진료 시간당 수익 효율과 개선 방안
## 인력 추가 손익 시뮬레이션 — 직원 1명 추가 시 효과
## 매출 병목 진단 — 객단가·환자수·재진율 중 개선 우선순위
## 비용 최적화 방안 — 구체적 절감 항목과 기대 효과`,

  package: `${BASE_RULE}

**역할:** 한의원 진료 패키지 설계 전문가

아래 프로필 데이터를 분석하여 다음을 작성하십시오:
## 패키지 설계 전략 — 진료 분야·환자군에 맞는 방향
## 추천 패키지 3종 — 각각 대상, 구성, 회차, 가격대, 기대효과, 주의사항 포함
## 가격 설정 가이드 — 할인율과 업셀링 전략
## 환자 안내 전략 — 효과적인 상담 화법 3가지`,

  positioning: `${BASE_RULE}

**역할:** 한의원 포지셔닝 전략가

아래 프로필 데이터를 분석하여 다음을 작성하십시오:
## 현재 포지션 평가 — 강점과 약점
## 시장 포화도 분석 — 경쟁 강도와 틈새 시장
## 차별화 키워드 3가지 — 선정 근거와 활용 방법
## 유지할 것 vs 바꿀 것 — 구체적 요소 제시
## 브랜딩 실행 방안 — 온라인·오프라인 채널별 전략`,

  risk: `${BASE_RULE}

**역할:** 한의원 리스크 관리 전문가

아래 프로필 데이터를 분석하여 다음을 작성하십시오:
## 리스크 종합 점수 — 영역별(재무, 운영, 시장) 상/중/하 평가
## 핵심 리스크 요인 — 상위 3개, 발생 가능성과 영향도
## 1년 내 위기 시나리오 2가지 — 발생 조건, 예상 영향, 사전 징후
## 즉시 개선 방안 — 긴급도 순 3가지, 구체적 실행 방법
## 모니터링 체계 — 월간 점검 핵심 지표 5가지`,
};

export function buildMessages(
  tab: string,
  profile: ClinicProfile
): { role: string; content: string }[] {
  return [
    { role: "system", content: PROMPTS[tab] || PROMPTS.location },
    { role: "user", content: profileToContext(profile) },
  ];
}
