export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { callLLM, profileToContext } from "@/lib/llm";
import { ClinicProfile } from "@/types/clinic";

const CHAT_SYSTEM_PROMPT = `당신은 한의원 경영 컨설팅 분야 최고 전문가입니다. 반드시 한국어로 작성하십시오.

사용자가 자신의 한의원 경영에 대해 자유롭게 질문합니다. 아래 프로필 데이터를 기반으로 구체적이고 실용적인 답변을 제공하십시오.

**답변 원칙:**
1. 하십시오체를 사용합니다.
2. 숫자와 데이터에 기반한 구체적 근거를 제시합니다.
3. 추상적 조언이 아닌, 즉시 실행 가능한 액션 아이템을 제시합니다.
4. 마크다운 형식(##, ###, -, **강조**)을 사용합니다.
5. VIP는 "프리미엄"으로 표기하고, 불필요한 영어 사용은 피합니다.
6. 한의원 업계의 실무적 맥락과 건강보험 제도를 반영합니다.
7. 질문이 모호하면 명확화를 요청하되, 가능한 범위에서 먼저 답변을 제공합니다.
8. 이전 대화 맥락을 참고하여 일관된 조언을 하십시오.`;

export async function POST(req: NextRequest) {
  try {
    const { message, history, profile } = await req.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "메시지를 입력해주십시오" },
        { status: 400 }
      );
    }
    if (!profile) {
      return NextResponse.json(
        { error: "프로필이 필요합니다" },
        { status: 400 }
      );
    }
    if (message.trim().length > 2000) {
      return NextResponse.json(
        { error: "메시지는 2000자 이하로 입력해주십시오" },
        { status: 400 }
      );
    }

    const profileContext = profileToContext(profile as ClinicProfile);

    const messages = [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      { role: "user", content: profileContext },
      {
        role: "assistant",
        content:
          "프로필 데이터를 확인했습니다. 궁금하신 점을 질문해 주십시오.",
      },
      ...(Array.isArray(history) ? history.slice(-20) : []),
      { role: "user", content: message.trim() },
    ];

    const reply = await callLLM(messages);

    if (!reply) {
      return NextResponse.json(
        { error: "LLM 응답을 받지 못했습니다. 잠시 후 다시 시도해주십시오." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("[chat] POST 오류:", e);
    return NextResponse.json(
      { error: "채팅 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
