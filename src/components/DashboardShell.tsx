"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ClinicProfile, Verdict } from "@/types/clinic";

// ── 탭 정의 ──
const TABS = [
  {
    id: "location" as const,
    label: "입지 분석",
    icon: "📍",
    desc: "지역 적합성·경쟁 구조",
  },
  {
    id: "coo" as const,
    label: "COO · CFO",
    icon: "📊",
    desc: "재무·운영 효율",
  },
  {
    id: "package" as const,
    label: "패키지 설계",
    icon: "📦",
    desc: "서비스 상품 구성",
  },
  {
    id: "positioning" as const,
    label: "포지셔닝",
    icon: "🎯",
    desc: "차별화·전략 방향",
  },
  {
    id: "risk" as const,
    label: "리스크 관리",
    icon: "🛡️",
    desc: "위험 요인·시나리오",
  },
];

type TabId = (typeof TABS)[number]["id"];

interface AnalysisResult {
  llmAnalysis: string;
  deterministic: any;
  financials: any;
}

// ── 마크다운 간이 렌더러 ──
function renderMarkdown(md: string) {
  if (!md) return null;
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="space-y-1.5 mb-4">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  }

  function inlineFormat(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs">$1</code>');
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2
          key={key++}
          className="text-base font-bold text-gray-900 mt-6 mb-3 pb-2 border-b border-gray-100"
        >
          {trimmed.replace(/^##\s+/, "")}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={key++} className="text-sm font-semibold text-gray-800 mt-4 mb-2">
          {trimmed.replace(/^###\s+/, "")}
        </h3>
      );
    } else if (/^[-*]\s/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-*]\s+/, ""));
    } else if (/^\d+\.\s/.test(trimmed)) {
      listItems.push(trimmed.replace(/^\d+\.\s+/, ""));
    } else if (trimmed === "") {
      flushList();
    } else {
      flushList();
      elements.push(
        <p
          key={key++}
          className="text-sm text-gray-700 leading-relaxed mb-3"
          dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed) }}
        />
      );
    }
  }
  flushList();
  return <div>{elements}</div>;
}

// ── 판정 뱃지 ──
function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const map: Record<Verdict, { cls: string; label: string }> = {
    적합: { cls: "badge-green", label: "적합" },
    "주의 필요": { cls: "badge-amber", label: "주의 필요" },
    비추천: { cls: "badge-red", label: "비추천" },
  };
  const c = map[verdict];
  return <span className={c.cls}>{c.label}</span>;
}

// ── 로딩 애니메이션 ──
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="flex gap-1.5 mb-4">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 loading-dot" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 loading-dot" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 loading-dot" />
      </div>
      <p className="text-sm text-gray-500">분석 중입니다...</p>
    </div>
  );
}

// ── 수치 카드 ──
function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        accent
          ? "bg-emerald-50/60 border-emerald-200"
          : "bg-white border-gray-100"
      }`}
    >
      <p className="caption mb-1">{label}</p>
      <p
        className={`text-lg font-bold ${
          accent ? "text-emerald-700" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString("ko-KR");
}

// ── 결정론적 분석 렌더링 ──
function DeterministicSection({
  tab,
  data,
  financials,
}: {
  tab: TabId;
  data: any;
  financials: any;
}) {
  if (!data) return null;

  if (tab === "location") {
    return (
      <div className="space-y-4">
        {data.summary && (
          <div className="card-flat border-l-4 border-l-emerald-400 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="heading-sm">요약 판단</span>
              <VerdictBadge verdict={data.summary.verdict} />
            </div>
            <p className="body-sm">{data.summary.oneLiner}</p>
            {data.summary.actions?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="caption mb-1.5">90일 우선 행동</p>
                {data.summary.actions.map((a: string, i: number) => (
                  <p key={i} className="text-sm text-gray-700 flex items-start gap-2 mt-1">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    {a}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
        {financials && (
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="임대료/매출 비율"
              value={`${financials.rentRatio}%`}
              sub="추정치"
              accent={financials.rentRatio > 15}
            />
            <MetricCard
              label="월 추정 매출"
              value={`${fmt(financials.monthlyRevenue)}원`}
              sub="추정치"
            />
            <MetricCard
              label="영업이익률"
              value={`${financials.operatingMargin}%`}
              sub="추정치"
              accent={financials.operatingMargin < 25}
            />
          </div>
        )}
        {data.strengths?.length > 0 && (
          <div className="card-flat">
            <h4 className="text-sm font-semibold text-emerald-700 mb-2">긍정 요인</h4>
            {data.strengths.map((s: string, i: number) => (
              <p key={i} className="text-sm text-gray-700 flex items-start gap-2 mt-1.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                {s}
              </p>
            ))}
          </div>
        )}
        {data.issues?.length > 0 && (
          <div className="card-flat">
            <h4 className="text-sm font-semibold text-amber-700 mb-2">주의 사항</h4>
            {data.issues.map((s: string, i: number) => (
              <p key={i} className="text-sm text-gray-700 flex items-start gap-2 mt-1.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                {s}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (tab === "coo") {
    return (
      <div className="space-y-4">
        {data.summary && (
          <div className="card-flat border-l-4 border-l-emerald-400 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="heading-sm">요약 판단</span>
              <VerdictBadge verdict={data.summary.verdict} />
            </div>
            <p className="body-sm">{data.summary.oneLiner}</p>
          </div>
        )}
        {financials && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="월 매출"
              value={`${fmt(financials.monthlyRevenue)}원`}
              sub="추정치"
            />
            <MetricCard
              label="월 영업이익"
              value={`${fmt(financials.operatingProfit)}원`}
              sub="추정치"
              accent={financials.operatingProfit < 0}
            />
            <MetricCard
              label="영업이익률"
              value={`${financials.operatingMargin}%`}
              sub="추정치"
              accent={financials.operatingMargin < 25}
            />
            <MetricCard
              label="손익분기 환자"
              value={`${fmt(financials.breakEvenPatients)}명/월`}
              sub="추정치"
            />
          </div>
        )}
        {data.insights?.length > 0 && (
          <div className="card-flat">
            <h4 className="text-sm font-semibold text-blue-700 mb-2">분석 인사이트</h4>
            {data.insights.map((s: string, i: number) => (
              <p key={i} className="text-sm text-gray-700 flex items-start gap-2 mt-1.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                {s}
              </p>
            ))}
          </div>
        )}
        {data.issues?.length > 0 && (
          <div className="card-flat">
            <h4 className="text-sm font-semibold text-amber-700 mb-2">개선 필요 항목</h4>
            {data.issues.map((s: string, i: number) => (
              <p key={i} className="text-sm text-gray-700 flex items-start gap-2 mt-1.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                {s}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (tab === "package") {
    return (
      <div className="space-y-4">
        {data.summary && (
          <div className="card-flat border-l-4 border-l-emerald-400 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="heading-sm">요약 판단</span>
              <VerdictBadge verdict={data.summary.verdict} />
            </div>
            <p className="body-sm">{data.summary.oneLiner}</p>
          </div>
        )}
        {data.packages?.map((pkg: any, i: number) => (
          <div key={i} className="card-flat">
            <h4 className="heading-sm mb-2">{pkg.name}</h4>
            <p className="body-sm mb-3">{pkg.description}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="bg-white rounded-lg px-3 py-2 border border-gray-100">
                <p className="caption">가격</p>
                <p className="text-sm font-semibold text-gray-900">{pkg.targetPrice}</p>
              </div>
              <div className="bg-white rounded-lg px-3 py-2 border border-gray-100">
                <p className="caption">진료 횟수</p>
                <p className="text-sm font-semibold text-gray-900">{pkg.sessions}</p>
              </div>
              <div className="bg-white rounded-lg px-3 py-2 border border-gray-100">
                <p className="caption">설계 근거</p>
                <p className="text-sm font-medium text-gray-700">{pkg.rationale}</p>
              </div>
            </div>
          </div>
        ))}
        {data.nonInsuranceNote && (
          <div className="card-flat bg-blue-50/50 border-blue-200">
            <p className="text-sm font-semibold text-blue-800 mb-1">비급여 참고</p>
            <p className="text-sm text-blue-700">{data.nonInsuranceNote}</p>
          </div>
        )}
      </div>
    );
  }

  if (tab === "positioning") {
    return (
      <div className="space-y-4">
        {data.summary && (
          <div className="card-flat border-l-4 border-l-emerald-400 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="heading-sm">요약 판단</span>
              <VerdictBadge verdict={data.summary.verdict} />
            </div>
            <p className="body-sm">{data.summary.oneLiner}</p>
          </div>
        )}
        {data.strengths?.length > 0 && (
          <div className="card-flat">
            <h4 className="text-sm font-semibold text-emerald-700 mb-2">포지셔닝 강점</h4>
            {data.strengths.map((s: string, i: number) => (
              <p key={i} className="text-sm text-gray-700 flex items-start gap-2 mt-1.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                {s}
              </p>
            ))}
          </div>
        )}
        {data.issues?.length > 0 && (
          <div className="card-flat">
            <h4 className="text-sm font-semibold text-amber-700 mb-2">조정 필요 사항</h4>
            {data.issues.map((s: string, i: number) => (
              <p key={i} className="text-sm text-gray-700 flex items-start gap-2 mt-1.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                {s}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (tab === "risk") {
    return (
      <div className="space-y-4">
        {data.summary && (
          <div className="card-flat border-l-4 border-l-emerald-400 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="heading-sm">요약 판단</span>
              <VerdictBadge verdict={data.summary.verdict} />
            </div>
            <p className="body-sm">{data.summary.oneLiner}</p>
          </div>
        )}
        {data.risks?.map((risk: any, i: number) => (
          <div key={i} className="card-flat flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="heading-sm">{risk.category}</span>
                <VerdictBadge verdict={risk.level} />
              </div>
              <p className="body-sm">{risk.detail}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// ══════════════════════════════════════════
// 메인 대시보드
// ══════════════════════════════════════════
export default function DashboardShell({
  profile,
}: {
  profile: ClinicProfile;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("location");
  const [results, setResults] = useState<Record<string, AnalysisResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchAnalysis = useCallback(
    async (tab: TabId) => {
      if (results[tab] || loading[tab]) return;
      setLoading((p) => ({ ...p, [tab]: true }));
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tab, profile }),
        });
        if (res.ok) {
          const data = await res.json();
          setResults((p) => ({ ...p, [tab]: data }));
        }
      } finally {
        setLoading((p) => ({ ...p, [tab]: false }));
      }
    },
    [results, loading]
  );

  useEffect(() => {
    fetchAnalysis(activeTab);
  }, [activeTab, fetchAnalysis]);

  async function handleReset() {
    if (!confirm("프로필을 삭제하고 처음부터 다시 입력하시겠습니까?")) return;
    await fetch("/api/clinic", { method: "DELETE" });
    router.push("/setup");
  }

  const currentResult = results[activeTab];
  const isLoading = loading[activeTab];

  return (
    <div className="h-screen flex flex-col bg-[#f8f9fa]">
      {/* ── 상단 헤더 ── */}
      <header className="flex-shrink-0 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn-ghost p-1.5"
            title="사이드바 토글"
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">한</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">
                한의원 경영 인텔리전스
              </h1>
              <p className="text-[10px] text-gray-400">
                {profile.regionCity} {profile.regionDong} · {profile.buildingType}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/setup")}
            className="btn-ghost text-xs"
          >
            정보 수정
          </button>
          <button
            onClick={handleReset}
            className="btn-ghost text-xs text-red-500 hover:bg-red-50"
          >
            초기화
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* ── 왼쪽 사이드바 ── */}
        <aside
          className={`flex-shrink-0 bg-white border-r border-gray-100 transition-all duration-300 overflow-y-auto scrollbar-thin ${
            sidebarOpen ? "w-60" : "w-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="p-3 pt-4">
            <p className="caption px-3 mb-2">분석 메뉴</p>
            <nav className="space-y-1">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const hasData = !!results[tab.id];
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? "bg-emerald-50 shadow-sm"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg flex-shrink-0">{tab.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isActive ? "text-emerald-800" : "text-gray-700"
                        }`}
                      >
                        {tab.label}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {tab.desc}
                      </p>
                    </div>
                    {hasData && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* 프로필 요약 */}
            <div className="mt-6 px-3">
              <p className="caption mb-2">현재 프로필</p>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>개원 상태</span>
                  <span className="font-medium text-gray-800">
                    {profile.openingStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>환자군</span>
                  <span className="font-medium text-gray-800">
                    {profile.patientGroup}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>월 환자</span>
                  <span className="font-medium text-gray-800">
                    {fmt(profile.monthlyPatients)}명
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>객단가</span>
                  <span className="font-medium text-gray-800">
                    {fmt(profile.avgRevenuePerPatient)}원
                  </span>
                </div>
                <div className="pt-1">
                  <div className="flex flex-wrap gap-1">
                    {profile.specialties.map((s) => (
                      <span key={s} className="badge-gray text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── 메인 콘텐츠 ── */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-4xl mx-auto px-6 py-6">
            {/* 탭 제목 */}
            <div className="mb-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">
                  {TABS.find((t) => t.id === activeTab)?.icon}
                </span>
                <h2 className="text-xl font-bold text-gray-900">
                  {TABS.find((t) => t.id === activeTab)?.label}
                </h2>
              </div>
              <p className="text-sm text-gray-500 ml-10">
                {TABS.find((t) => t.id === activeTab)?.desc}
              </p>
            </div>

            {isLoading ? (
              <LoadingState />
            ) : currentResult ? (
              <div className="animate-fade-in space-y-8">
                {/* 결정론적 분석 */}
                <section>
                  <DeterministicSection
                    tab={activeTab}
                    data={currentResult.deterministic}
                    financials={currentResult.financials}
                  />
                </section>

                {/* LLM 심층 분석 */}
                {currentResult.llmAnalysis && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-5 h-5 rounded-md bg-violet-100 flex items-center justify-center">
                        <span className="text-[10px]">🤖</span>
                      </div>
                      <h3 className="heading-sm text-violet-800">
                        심층 분석
                      </h3>
                      <span className="badge-gray text-[10px]">
                        생성형 분석
                      </span>
                    </div>
                    <div className="card">
                      {renderMarkdown(currentResult.llmAnalysis)}
                    </div>
                  </section>
                )}

                {/* LLM 미연동 안내 */}
                {!currentResult.llmAnalysis && (
                  <section>
                    <div className="card-flat border-dashed border-2 border-gray-200 text-center py-8">
                      <p className="text-sm text-gray-500 mb-1">
                        생성형 심층 분석을 사용하려면 환경변수를 설정하십시오
                      </p>
                      <div className="mt-3 text-xs text-gray-400 font-mono bg-gray-100 rounded-lg inline-block px-4 py-2 text-left">
                        <p>LLM_BASE_URL=http://localhost:11434/v1</p>
                        <p>LLM_MODEL=llama3.2</p>
                        <p>LLM_API_KEY=선택사항</p>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
