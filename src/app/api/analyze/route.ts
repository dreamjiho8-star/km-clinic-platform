export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { ClinicProfile } from "@/types/clinic";
import {
  analyzeLocation,
  analyzeCooFinance,
  analyzePackage,
  analyzePositioning,
  analyzeRisk,
  deriveFinancials,
} from "@/lib/analysis";
import { callLLM, buildMessages } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const { tab, profile } = await req.json();

    if (!profile) {
      return NextResponse.json({ error: "프로필이 필요합니다" }, { status: 400 });
    }

    const p = profile as ClinicProfile;

    let deterministic: any = {};
    switch (tab) {
      case "location": deterministic = analyzeLocation(p); break;
      case "coo": deterministic = analyzeCooFinance(p); break;
      case "package": deterministic = analyzePackage(p); break;
      case "positioning": deterministic = analyzePositioning(p); break;
      case "risk": deterministic = analyzeRisk(p); break;
    }

    let llmAnalysis = "";
    let llmError = "";
    let llmDebug = {
      baseUrl: process.env.LLM_BASE_URL || "(없음)",
      model: process.env.LLM_MODEL || "(없음)",
      hasKey: !!process.env.LLM_API_KEY,
    };

    try {
      const messages = buildMessages(tab, p);
      llmAnalysis = await callLLM(messages);
    } catch (e: any) {
      llmError = e.message || "알 수 없는 오류";
    }

    return NextResponse.json({
      llmAnalysis,
      llmError,
      llmDebug,
      deterministic,
      financials: deriveFinancials(p),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
