"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ClinicProfile,
  Verdict,
  Financials,
  DeterministicResult,
  LocationAnalysis,
  CooAnalysis,
  PackageAnalysis,
  PackageItem,
  PositioningAnalysis,
  RiskAnalysis,
  RiskItem,
  SimulatorAnalysis,
  SimulatorScenario,
  BenchmarkAnalysis,
  BenchmarkItem,
  MetricSnapshot,
} from "@/types/clinic";
import { renderMarkdown } from "@/lib/markdown";
import ChatPanel from "./ChatPanel";

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
  {
    id: "simulator" as const,
    label: "개원 시뮬레이션",
    icon: "🧮",
    desc: "손익분기·투자 회수 시점",
  },
  {
    id: "benchmark" as const,
    label: "벤치마크",
    icon: "📈",
    desc: "업계 평균 비교·추이",
  },
];

type TabId = (typeof TABS)[number]["id"];

interface AnalysisResult {
  llmAnalysis: string;
  deterministic: DeterministicResult;
  financials: Financials;
}

// ── HTML 이스케이프 (XSS 방지) ──
// renderMarkdown는 @/lib/markdown에서 import

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
  data: DeterministicResult;
  financials: Financials;
}) {
  if (!data) return null;

  if (tab === "location") {
    const d = data as LocationAnalysis;
    return (
      <div className="space-y-4">
        {d.summary && (
          <div className="card-flat border-l-4 border-l-emerald-400 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="heading-sm">요약 판단</span>
              <VerdictBadge verdict={d.summary.verdict} />
            </div>
            <p className="body-sm">{d.summary.oneLiner}</p>
            {d.summary.actions?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="caption mb-1.5">90일 우선 행동</p>
                {d.summary.actions.map((a: string, i: number) => (
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
        {d.strengths?.length > 0 && (
          <div className="card-flat">
            <h4 className="text-sm font-semibold text-emerald-700 mb-2">긍정 요인</h4>
            {d.strengths.map((s: string, i: number) => (
              <p key={i} className="text-sm text-gray-700 flex items-start gap-2 mt-1.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                {s}
              </p>
            ))}
          </div>
        )}
        {d.issues?.length > 0 && (
          <div className="card-flat">
            <h4 className="text-sm font-semibold text-amber-700 mb-2">주의 사항</h4>
            {d.issues.map((s: string, i: number) => (
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
    const d = data as CooAnalysis;
    return (
      <div className="space-y-4">
        {d.summary && (
          <div className="card-flat border-l-4 border-l-emerald-400 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="heading-sm">요약 판단</span>
              <VerdictBadge verdict={d.summary.verdict} />
            </div>
            <p className="body-sm">{d.summary.oneLiner}</p>
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
        {d.insights?.length > 0 && (
          <div className="card-flat">
            <h4 className="text-sm font-semibold text-blue-700 mb-2">분석 인사이트</h4>
            {d.insights.map((s: string, i: number) => (
              <p key={i} className="text-sm text-gray-700 flex items-start gap-2 mt-1.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                {s}
              </p>
            ))}
          </div>
        )}
        {d.issues?.length > 0 && (
          <div className="card-flat">
            <h4 className="text-sm font-semibold text-amber-700 mb-2">개선 필요 항목</h4>
            {d.issues.map((s: string, i: number) => (
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
    const d = data as PackageAnalysis;
    return (
      <div className="space-y-4">
        {d.summary && (
          <div className="card-flat border-l-4 border-l-emerald-400 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="heading-sm">요약 판단</span>
              <VerdictBadge verdict={d.summary.verdict} />
            </div>
            <p className="body-sm">{d.summary.oneLiner}</p>
          </div>
        )}
        {d.packages?.map((pkg: PackageItem, i: number) => (
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
        {d.nonInsuranceNote && (
          <div className="card-flat bg-blue-50/50 border-blue-200">
            <p className="text-sm font-semibold text-blue-800 mb-1">비급여 참고</p>
            <p className="text-sm text-blue-700">{d.nonInsuranceNote}</p>
          </div>
        )}
      </div>
    );
  }

  if (tab === "positioning") {
    const d = data as PositioningAnalysis;
    return (
      <div className="space-y-4">
        {d.summary && (
          <div className="card-flat border-l-4 border-l-emerald-400 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="heading-sm">요약 판단</span>
              <VerdictBadge verdict={d.summary.verdict} />
            </div>
            <p className="body-sm">{d.summary.oneLiner}</p>
          </div>
        )}
        {d.strengths?.length > 0 && (
          <div className="card-flat">
            <h4 className="text-sm font-semibold text-emerald-700 mb-2">포지셔닝 강점</h4>
            {d.strengths.map((s: string, i: number) => (
              <p key={i} className="text-sm text-gray-700 flex items-start gap-2 mt-1.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                {s}
              </p>
            ))}
          </div>
        )}
        {d.issues?.length > 0 && (
          <div className="card-flat">
            <h4 className="text-sm font-semibold text-amber-700 mb-2">조정 필요 사항</h4>
            {d.issues.map((s: string, i: number) => (
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
    const d = data as RiskAnalysis;
    return (
      <div className="space-y-4">
        {d.summary && (
          <div className="card-flat border-l-4 border-l-emerald-400 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="heading-sm">요약 판단</span>
              <VerdictBadge verdict={d.summary.verdict} />
            </div>
            <p className="body-sm">{d.summary.oneLiner}</p>
          </div>
        )}
        {d.risks?.map((risk: RiskItem, i: number) => (
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

  if (tab === "simulator") {
    const d = data as SimulatorAnalysis;
    const MILESTONE_MONTHS = [1, 3, 6, 12, 18, 24, 36];
    return (
      <div className="space-y-4">
        {d.summary && (
          <div className="card-flat border-l-4 border-l-emerald-400 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="heading-sm">요약 판단</span>
              <VerdictBadge verdict={d.summary.verdict} />
            </div>
            <p className="body-sm">{d.summary.oneLiner}</p>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="초기 투자금"
            value={`${fmt(d.initialInvestment)}원`}
            sub="비용 구조에서 입력한 합계"
          />
          {d.scenarios.map((sc) => (
            <MetricCard
              key={sc.label}
              label={`${sc.label} 시나리오 (월 ${sc.growthRate}%)`}
              value={sc.roiMonth ? `${sc.roiMonth}개월` : "36개월 초과"}
              sub="투자금 회수 시점"
              accent={sc.roiMonth !== null && sc.roiMonth <= 24}
            />
          ))}
        </div>

        {/* 시나리오별 상세 테이블 */}
        {d.scenarios.map((sc: SimulatorScenario) => (
          <div key={sc.label} className="card-flat">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="heading-sm">{sc.label} 시나리오</h4>
              <span className="badge-gray text-[10px]">
                월 환자 증가율 {sc.growthRate}%
              </span>
              {sc.breakEvenMonth && (
                <span className="badge-green text-[10px]">
                  월 흑자 전환 {sc.breakEvenMonth}개월
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">개월</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">환자 수</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">월 매출</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">월 비용</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">월 손익</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">누적 손익</th>
                  </tr>
                </thead>
                <tbody>
                  {sc.projections
                    .filter((p) => MILESTONE_MONTHS.includes(p.month))
                    .map((p) => (
                      <tr
                        key={p.month}
                        className={`border-b border-gray-100 ${
                          sc.roiMonth === p.month ? "bg-emerald-50" : ""
                        }`}
                      >
                        <td className="py-2 px-2 font-medium text-gray-700">{p.month}개월</td>
                        <td className="py-2 px-2 text-right text-gray-600">{fmt(p.patients)}명</td>
                        <td className="py-2 px-2 text-right text-gray-600">{fmt(p.revenue)}원</td>
                        <td className="py-2 px-2 text-right text-gray-600">{fmt(p.cost)}원</td>
                        <td className={`py-2 px-2 text-right font-medium ${p.profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                          {fmt(p.profit)}원
                        </td>
                        <td className={`py-2 px-2 text-right font-medium ${p.cumulativeProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                          {fmt(p.cumulativeProfit)}원
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tab === "benchmark") {
    const d = data as BenchmarkAnalysis;
    return (
      <div className="space-y-4">
        {d.summary && (
          <div className="card-flat border-l-4 border-l-emerald-400 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="heading-sm">종합 점수</span>
              <VerdictBadge verdict={d.summary.verdict} />
              <span className={`text-lg font-bold ${
                d.overallScore >= 60 ? "text-emerald-700" : d.overallScore >= 30 ? "text-amber-700" : "text-red-700"
              }`}>
                {d.overallScore}점
              </span>
            </div>
            <p className="body-sm">{d.summary.oneLiner}</p>
          </div>
        )}

        <div className="card-flat">
          <h4 className="heading-sm mb-4">업계 평균 대비 비교</h4>
          <div className="space-y-4">
            {d.items.map((item: BenchmarkItem) => {
              const isBetter = item.higherIsBetter
                ? item.myValue >= item.industryAvg
                : item.myValue <= item.industryAvg;
              const maxVal = Math.max(item.myValue, item.industryAvg);
              const myPercent = maxVal > 0 ? (item.myValue / maxVal) * 100 : 0;
              const avgPercent = maxVal > 0 ? (item.industryAvg / maxVal) * 100 : 0;
              const fmtVal = (v: number) =>
                item.unit === "원" ? `${fmt(v)}${item.unit}` : `${v}${item.unit}`;

              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className={`text-xs font-semibold ${isBetter ? "text-emerald-600" : "text-red-500"}`}>
                      {isBetter ? "평균 이상" : "평균 이하"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-14 flex-shrink-0">내 한의원</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isBetter ? "bg-emerald-500" : "bg-red-400"}`}
                          style={{ width: `${Math.max(myPercent, 3)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700 w-24 text-right">{fmtVal(item.myValue)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-14 flex-shrink-0">업계 평균</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gray-400"
                          style={{ width: `${Math.max(avgPercent, 3)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-500 w-24 text-right">{fmtVal(item.industryAvg)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400 mt-4">
            * 출처: 통계청 경제총조사(2020), HIRA 진료비통계지표(2023), 보건복지부 한방의료이용 실태조사. 임대료·인건비 비율은 의원급 별도 공개 없어 업계 관행 기반 추정치
          </p>
        </div>
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 모바일에서는 사이드바 기본 접힘
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);
  const [snapshots, setSnapshots] = useState<MetricSnapshot[]>([]);
  const requestedRef = useRef<Set<string>>(new Set());
  const profileIdRef = useRef(profile.id);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  // 시계열 스냅샷 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem("clinic-metric-snapshots");
      if (saved) setSnapshots(JSON.parse(saved));
    } catch {
      // 무시
    }
  }, []);

  // 프로필이 변경되면 캐시 초기화
  useEffect(() => {
    if (profileIdRef.current !== profile.id) {
      profileIdRef.current = profile.id;
      requestedRef.current.clear();
      setResults({});
      setErrors({});
    }
  }, [profile.id]);

  const fetchAnalysis = useCallback(
    async (tab: TabId) => {
      if (requestedRef.current.has(tab)) return;
      requestedRef.current.add(tab);
      setLoading((p) => ({ ...p, [tab]: true }));
      setErrors((p) => ({ ...p, [tab]: "" }));
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tab, profile: profileRef.current }),
        });
        if (res.ok) {
          const data = await res.json();
          setResults((p) => ({ ...p, [tab]: data }));
        } else {
          setErrors((p) => ({ ...p, [tab]: `분석 요청 실패 (${res.status})` }));
          requestedRef.current.delete(tab);
        }
      } catch {
        setErrors((p) => ({ ...p, [tab]: "네트워크 오류가 발생했습니다" }));
        requestedRef.current.delete(tab);
      } finally {
        setLoading((p) => ({ ...p, [tab]: false }));
      }
    },
    [] // profileRef를 사용하므로 의존성 불필요
  );

  useEffect(() => {
    fetchAnalysis(activeTab);
  }, [activeTab, fetchAnalysis]);

  function handleRetry() {
    requestedRef.current.delete(activeTab);
    fetchAnalysis(activeTab);
  }

  async function handleReset() {
    if (!confirm("프로필을 삭제하고 처음부터 다시 입력하시겠습니까?")) return;
    localStorage.removeItem("clinic-profile");
    localStorage.removeItem("clinic-metric-snapshots");
    await fetch("/api/clinic", { method: "DELETE" });
    router.push("/setup");
  }

  function handleSaveSnapshot() {
    const fin = currentResult?.financials;
    if (!fin) return;
    const snapshot: MetricSnapshot = {
      date: new Date().toISOString().split("T")[0],
      monthlyRevenue: fin.monthlyRevenue,
      operatingProfit: fin.operatingProfit,
      operatingMargin: fin.operatingMargin,
      monthlyPatients: profile.monthlyPatients,
      avgRevenuePerPatient: profile.avgRevenuePerPatient,
    };
    const updated = [...snapshots, snapshot];
    setSnapshots(updated);
    localStorage.setItem("clinic-metric-snapshots", JSON.stringify(updated));
  }

  const activeTabData = useMemo(
    () => TABS.find((t) => t.id === activeTab)!,
    [activeTab]
  );
  const currentResult = results[activeTab];
  const isLoading = loading[activeTab];
  const currentError = errors[activeTab];

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
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight tracking-tight">
                MediStrategy
              </h1>
              <p className="text-[10px] text-gray-400">
                {profile.regionCity} {profile.regionDong} · {profile.buildingType}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <button
            onClick={() => window.print()}
            className="btn-ghost text-xs print:hidden p-1.5 md:px-2 md:py-1.5"
            title="인쇄"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.25 7.034V3.375" />
            </svg>
            <span className="hidden md:inline ml-1">인쇄</span>
          </button>
          <button
            onClick={() => router.push("/setup")}
            className="btn-ghost text-xs print:hidden p-1.5 md:px-2 md:py-1.5"
            title="정보 수정"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
            <span className="hidden md:inline ml-1">정보 수정</span>
          </button>
          <button
            onClick={handleReset}
            className="btn-ghost text-xs text-red-500 hover:bg-red-50 print:hidden p-1.5 md:px-2 md:py-1.5"
            title="초기화"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
            <span className="hidden md:inline ml-1">초기화</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* ── 모바일 백드롭 ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* ── 왼쪽 사이드바 ── */}
        <aside
          className={`bg-white border-r border-gray-100 transition-all duration-300 overflow-y-auto scrollbar-thin
            fixed top-14 bottom-0 left-0 z-40 md:static md:z-auto
            ${sidebarOpen ? "w-60" : "w-0 opacity-0 pointer-events-none"}`}
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
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
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
                <span className="text-2xl">{activeTabData.icon}</span>
                <h2 className="text-xl font-bold text-gray-900">
                  {activeTabData.label}
                </h2>
              </div>
              <p className="text-sm text-gray-500 ml-10">
                {activeTabData.desc}
              </p>
            </div>

            {currentError ? (
              <div className="card-flat border-red-200 bg-red-50 text-center py-8 animate-fade-in">
                <p className="text-sm text-red-600 mb-3">{currentError}</p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-all"
                >
                  다시 시도
                </button>
              </div>
            ) : isLoading ? (
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

                {/* LLM 심층 분석 (시뮬레이터/벤치마크 제외) */}
                {activeTab !== "simulator" && activeTab !== "benchmark" && currentResult.llmAnalysis && (
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

                {/* LLM 분석 없을 때 안내 (시뮬레이터/벤치마크 제외) */}
                {activeTab !== "simulator" && activeTab !== "benchmark" && !currentResult.llmAnalysis && (
                  <section>
                    <div className="card-flat border-dashed border-2 border-gray-200 text-center py-8">
                      <p className="text-sm text-gray-500">
                        심층 분석을 불러오지 못했습니다. 잠시 후 다시 시도해주십시오.
                      </p>
                    </div>
                  </section>
                )}

                {/* 벤치마크 탭: 시계열 추이 섹션 */}
                {activeTab === "benchmark" && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="heading-sm">추이 기록</h3>
                        <span className="badge-gray text-[10px]">시계열</span>
                      </div>
                      <button
                        onClick={handleSaveSnapshot}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all print:hidden"
                      >
                        현재 상태 저장
                      </button>
                    </div>
                    {snapshots.length > 0 ? (
                      <div className="card-flat overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-2 text-gray-500 font-medium">날짜</th>
                              <th className="text-right py-2 px-2 text-gray-500 font-medium">월 매출</th>
                              <th className="text-right py-2 px-2 text-gray-500 font-medium">영업이익</th>
                              <th className="text-right py-2 px-2 text-gray-500 font-medium">이익률</th>
                              <th className="text-right py-2 px-2 text-gray-500 font-medium">월 환자</th>
                              <th className="text-right py-2 px-2 text-gray-500 font-medium">객단가</th>
                            </tr>
                          </thead>
                          <tbody>
                            {snapshots.map((snap, i) => (
                              <tr key={i} className="border-b border-gray-100">
                                <td className="py-2 px-2 font-medium text-gray-700">{snap.date}</td>
                                <td className="py-2 px-2 text-right text-gray-600">{fmt(snap.monthlyRevenue)}원</td>
                                <td className={`py-2 px-2 text-right font-medium ${snap.operatingProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                                  {fmt(snap.operatingProfit)}원
                                </td>
                                <td className="py-2 px-2 text-right text-gray-600">{snap.operatingMargin}%</td>
                                <td className="py-2 px-2 text-right text-gray-600">{fmt(snap.monthlyPatients)}명</td>
                                <td className="py-2 px-2 text-right text-gray-600">{fmt(snap.avgRevenuePerPatient)}원</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="card-flat border-dashed border-2 border-gray-200 text-center py-6">
                        <p className="text-sm text-gray-500">
                          아직 저장된 기록이 없습니다
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          &quot;현재 상태 저장&quot; 버튼으로 주기적으로 기록하면 추이를 확인할 수 있습니다
                        </p>
                      </div>
                    )}
                  </section>
                )}
              </div>
            ) : null}
          </div>
        </main>
      </div>
      <ChatPanel profile={profile} />
    </div>
  );
}
