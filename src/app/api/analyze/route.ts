import { NextRequest, NextResponse } from "next/server";
import { loadProfileAsync } from "@/lib/storage";
import {
  analyzeLocation,
  analyzeCooFinance,
  analyzePackage,
  analyzePositioning,
  analyzeRisk,
  deriveFinancials,
} from "@/lib/analysis";
import { callLLM, buildMessages } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  try {
    const { tab } = await req.json();
    const profile = await loadProfileAsync();
    if (!profile) {
      return NextResponse.json({ error: "프로필 없음" }, { status: 404 });
    }

    // 결정론적 분석
    let deterministic: any = {};
    switch (tab) {
      case "location":
        deterministic = analyzeLocation(profile);
        break;
      case "coo":
        deterministic = analyzeCooFinance(profile);
        break;
      case "package":
        deterministic = analyzePackage(profile);
        break;
      case "positioning":
        deterministic = analyzePositioning(profile);
        break;
      case "risk":
        deterministic = analyzeRisk(profile);
        break;
    }

    // LLM 분석
    let llmAnalysis = "";
    try {
      const messages = buildMessages(tab, profile);
      llmAnalysis = await callLLM(messages);
    } catch {
      // LLM 실패 시 결정론적 결과만
    }

    return NextResponse.json({
      llmAnalysis,
      deterministic,
      financials: deriveFinancials(profile),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
