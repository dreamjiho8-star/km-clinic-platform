import { ClinicProfile } from "@/types/clinic";
import { deriveFinancials } from "./analysis";

const BASE_URL = (process.env.LLM_BASE_URL || "http://localhost:11434/v1").trim();
const API_KEY = (process.env.LLM_API_KEY || "ollama").trim();
const MODEL = (process.env.LLM_MODEL || "llama3.1:latest").trim();

// 영어→한글 치환 맵
const REPLACE_MAP: [RegExp, string][] = [
  [/VIP/gi, "프리미엄"],
  [/premium/gi, "프리미엄"],
  [/package/gi, "패키지"],
  [/cost/gi, "비용"],
  [/risk/gi, "위험"],
  [/marketing/gi, "홍보"],
  [/branding/gi, "브랜딩"],
  [/target/gi, "대상"],
  [/feedback/gi, "피드백"],
  [/service/gi, "서비스"],
  [/system/gi, "시스템"],
  [/stress/gi, "스트레스"],
  [/clinic/gi, "한의원"],
  [/patient/gi, "환자"],
  [/revenue/gi, "매출"],
  [/profit/gi, "수익"],
  [/break-even/gi, "손익분기"],
  [/differentiate/gi, "차별화"],
  [/positioning/gi, "포지셔닝"],
  [/consulting/gi, "컨설팅"],
  [/idea/gi, "방안"],
  [/solution/gi, "해결책"],
  [/option/gi, "방안"],
  [/recommend/gi, "추천"],
];

function postProcess(text: string): string {
  let result = text;
  // 한자 제거
  result = result.replace(/[\u4e00-\u9fff]/g, "");
  // 알려진 영어→한글 치환
  for (const [pattern, replacement] of REPLACE_MAP) {
    result = result.replace(pattern, replacement);
  }
  // 남은 영어 단어 3글자 이상은 제거 (마크다운 기호 보존)
  result = result.replace(/(?<![#*\-\[\]()])\b[a-zA-Z]{4,}\b/g, "");
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
        temperature: 0.2,
        max_tokens: 800,
      }),
      signal: controller.signal,
    });
    if (!res.ok) return "";
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";
    return postProcess(content);
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

export function profileToContext(p: ClinicProfile): string {
  const f = deriveFinancials(p);
  return `지역: ${p.regionCity} ${p.regionDong}, ${p.buildingType}, ${p.openingStatus}
진료: ${p.specialties.join(",")} / 환자군: ${p.patientGroup}
객단가 ${p.avgRevenuePerPatient.toLocaleString()}원, 월 ${p.monthlyPatients}명, 재진율 ${p.revisitRange}
비급여 ${p.nonInsuranceRatio}%, 월매출 ${f.monthlyRevenue.toLocaleString()}원
임대료 ${p.monthlyRent.toLocaleString()}원(${f.rentRatio}%), 인건비 ${p.laborCost.toLocaleString()}원(${f.laborRatio}%)
이익률 ${f.operatingMargin}%, 손익분기 ${f.breakEvenPatients}명/월
직원 ${p.staffCount}명, ${p.dailyHours}시간/일, 매출집중 ${p.revenueConcentration}%`;
}

const RULE = "반드시 한국어로만 작성. 영어·한자 절대 금지. VIP는 프리미엄으로. 하십시오체. 마크다운. 간결하게.";

const PROMPTS: Record<string, string> = {
  location: `한의원 입지 전문가. ${RULE}
3가지 분석: 1)유효한 진료 포지션 2)피할 경쟁 구조 3)유지 vs 전환. 각 3문장.`,

  coo: `한의원 경영분석가. ${RULE}
4가지 분석: 1)시간대비 수익 2)인력추가 손익변화 3)매출 병목 4)비효율 진료. 각 3문장.`,

  package: `한의원 패키지 설계자. ${RULE}
패키지 3종 설계. 각각: 이름(한글만), 대상, 구성, 가격대, 기간, 추천이유, 주의점. 영어 이름 금지.`,

  positioning: `한의원 포지셔닝 전략가. ${RULE}
4가지 분석: 1)현재 포지션 평가 2)과포화 여부 3)차별화 키워드 3개 4)유지할 것/바꿀 것. 각 3문장.`,

  risk: `한의원 리스크 관리자. ${RULE}
3가지 분석: 1)리스크 점수(상/중/하) 2)1년내 문제 시나리오 2가지 3)즉시 개선 3가지. 각 3문장.`,
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
