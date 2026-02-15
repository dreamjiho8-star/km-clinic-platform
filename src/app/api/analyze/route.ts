export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { ClinicProfile, DeterministicResult } from "@/types/clinic";
import {
  analyzeLocation,
  analyzeCooFinance,
  analyzePackage,
  analyzePositioning,
  analyzeRisk,
  analyzeSimulator,
  analyzeBenchmark,
  deriveFinancials,
} from "@/lib/analysis";
import { callLLM, buildMessages } from "@/lib/llm";

const VALID_TABS = [
  "location", "coo", "package", "positioning", "risk",
  "simulator", "benchmark",
] as const;
type TabId = (typeof VALID_TABS)[number];

// 시뮬레이터/벤치마크는 LLM 불필요
const NO_LLM_TABS = new Set<string>(["simulator", "benchmark"]);

const TAB_ANALYZERS: Record<TabId, (p: ClinicProfile) => DeterministicResult> = {
  location: analyzeLocation,
  coo: analyzeCooFinance,
  package: analyzePackage,
  positioning: analyzePositioning,
  risk: analyzeRisk,
  simulator: analyzeSimulator,
  benchmark: analyzeBenchmark,
};

export async function POST(req: NextRequest) {
  try {
    const { tab, profile } = await req.json();

    if (!profile) {
      return NextResponse.json({ error: "프로필이 필요합니다" }, { status: 400 });
    }

    if (!tab || !VALID_TABS.includes(tab)) {
      return NextResponse.json({ error: "유효하지 않은 분석 탭입니다" }, { status: 400 });
    }

    const p = profile as ClinicProfile;
    const deterministic = TAB_ANALYZERS[tab as TabId](p);

    let llmAnalysis = "";
    let llmDebug = "";
    if (!NO_LLM_TABS.has(tab)) {
      try {
        const messages = buildMessages(tab, p);
        llmAnalysis = await callLLM(messages);
        if (!llmAnalysis) llmDebug = "callLLM returned empty";
      } catch (e) {
        console.error("[analyze] LLM 호출 실패:", e);
        llmDebug = String(e);
      }
    }

    return NextResponse.json({
      llmAnalysis,
      deterministic,
      financials: deriveFinancials(p),
      ...(llmDebug ? { _debug: llmDebug } : {}),
    });
  } catch (e) {
    console.error("[analyze] POST 오류:", e);
    return NextResponse.json({ error: "분석 처리 중 오류가 발생했습니다" }, { status: 500 });
  }
}
