"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Campaign,
  FALLBACK_LTV,
  formatRp,
  formatRpFull,
  getChannelColor,
  getChannelData,
  getKPIs,
  getMonthlyData,
} from "./data";
import type { LTVPoint } from "./parse";

/* ─── constants (outside component to avoid re-creation) ────────────── */

interface ApiResponse {
  campaigns: Campaign[];
  ltvRef: LTVPoint[];
  fetchedAt: string;
  error?: string;
}

const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

const CHANNEL_FILTERS: Record<string, (ch: string) => boolean> = {
  "All Channels":  ()   => true,
  "Cek Pulsa":     (ch) => ch === "Cek Pulsa",
  "Medium Banner": (ch) => ch === "Medium Banner",
  "SMS":           (ch) => ch.startsWith("SMS"),
  "OTA":           (ch) => ch === "OTA",
  "Meta Ads":      (ch) => ch === "Meta Ads",
};
const TABS = Object.keys(CHANNEL_FILTERS);

// Shorter labels for small screens
const TAB_SHORT: Record<string, string> = {
  "All Channels": "All",
  "Medium Banner": "Banner",
  "Meta Ads": "Meta",
};

/* ─── primitives ─────────────────────────────────────────────────────── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-slate-700 mb-3 md:mb-4 flex items-center gap-2">
      <span className="w-1 h-4 rounded-full bg-blue-500 inline-block shrink-0" />
      {children}
    </h2>
  );
}

function Badge({ channel }: { channel: string }) {
  const c = getChannelColor(channel);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${c.bg} ${c.text}`}>
      {channel}
    </span>
  );
}

function KPICard({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <Card className="p-3 md:p-4 flex flex-col gap-1">
      <p className="text-[10px] md:text-[11px] font-semibold text-slate-400 uppercase tracking-wider leading-none">{label}</p>
      <p className={`text-xl md:text-2xl font-bold leading-tight ${accent ?? "text-slate-800"}`}>{value}</p>
      {sub && <p className="text-[10px] md:text-[11px] text-slate-400 leading-tight">{sub}</p>}
    </Card>
  );
}

function HBar({ label, value, maxValue, barClass, metaLeft, metaRight }: {
  label: string; value: number; maxValue: number; barClass: string;
  metaLeft?: string; metaRight?: string;
}) {
  const pct = maxValue > 0 ? Math.max(2, Math.round((value / maxValue) * 100)) : 0;
  return (
    <div className="py-2.5 border-b border-slate-50 last:border-0">
      <div className="flex justify-between items-baseline mb-1.5 gap-2">
        <span className="text-sm font-medium text-slate-700 truncate">{label}</span>
        <span className="text-sm font-semibold text-slate-800 whitespace-nowrap shrink-0">{formatRp(value)}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
        <div className={`h-2 rounded-full transition-all duration-500 ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
      {(metaLeft || metaRight) && (
        <div className="flex justify-between gap-2">
          {metaLeft  && <span className="text-[11px] text-slate-400 truncate">{metaLeft}</span>}
          {metaRight && <span className="text-[11px] text-slate-400 whitespace-nowrap">{metaRight}</span>}
        </div>
      )}
    </div>
  );
}

function ChurnBadge({ churn }: { churn: number | null }) {
  if (churn === null) return <span className="text-slate-300">–</span>;
  const cls = churn > 25 ? "text-red-500 font-semibold" : churn > 15 ? "text-amber-600 font-medium" : "text-emerald-600 font-medium";
  return <span className={cls}>{churn.toFixed(1)}%</span>;
}

/**
 * Break-even badge — shows months to recoup investment.
 * Source: spreadsheet column "Est.ROI (month)" = investment / (nettRevenue / days × 30).
 * Threshold: ≤ 4 months = green, 4–8 months = amber, > 8 months = red.
 */
function BreakEvenBadge({ months }: { months: number | null }) {
  if (months === null) return <span className="text-slate-300">–</span>;
  const cls = months <= 4 ? "text-emerald-600 font-bold"
    : months <= 8 ? "text-amber-600 font-semibold"
    : "text-red-500 font-medium";
  return (
    <span className={cls}>
      {months.toFixed(1)}<span className="text-[10px] font-normal opacity-70"> mo</span>
    </span>
  );
}

function ROASBadge({ roas }: { roas: number | null }) {
  if (roas === null) return <span className="text-slate-300">–</span>;
  const cls = roas >= 1 ? "text-emerald-600 font-bold" : roas >= 0.3 ? "text-amber-600 font-semibold" : "text-slate-500";
  return <span className={cls}>{(roas * 100).toFixed(1)}%</span>;
}

/* ─── recommendation logic ───────────────────────────────────────────── */

type RecAction = "Scale" | "Continue" | "Stop";

const REC_STYLE: Record<RecAction, { border: string; badgeBg: string; badgeText: string; bg: string }> = {
  Scale:    { border: "border-l-4 border-emerald-500", badgeBg: "bg-emerald-500",  badgeText: "text-white",  bg: "bg-emerald-50"  },
  Continue: { border: "border-l-4 border-amber-400",   badgeBg: "bg-amber-400",    badgeText: "text-white",  bg: "bg-amber-50"    },
  Stop:     { border: "border-l-4 border-red-500",     badgeBg: "bg-red-500",      badgeText: "text-white",  bg: "bg-red-50"      },
};

const BREAK_EVEN_THRESHOLD = 4; // months — the 4-month rule

/**
 * Computes break-even months from aggregated channel totals.
 * Used as fallback when the spreadsheet's own per-campaign value isn't available.
 */
function calcBreakEven(ch: {
  totalCost: number; totalNett: number; avgDays: number | null;
}): number | null {
  if (ch.totalNett <= 0 || ch.totalCost <= 0) return null;
  const days = ch.avgDays ?? 30;
  const monthlyNett = ch.totalNett / (days / 30);
  return monthlyNett > 0 ? ch.totalCost / monthlyNett : null;
}

function getChannelRec(ch: {
  totalCost: number; totalNett: number; totalMO: number;
  avgChurn: number | null; avgDays: number | null; avgBreakEvenMonths: number | null;
}): { action: RecAction; reason: string; breakEvenMonths: number | null } {
  const roas = ch.totalCost > 0 ? ch.totalNett / ch.totalCost : 0;
  const churn = ch.avgChurn;
  // Prefer the spreadsheet's own break-even value; fall back to computed
  const beMonths = ch.avgBreakEvenMonths ?? calcBreakEven(ch);
  const T = BREAK_EVEN_THRESHOLD;

  if (ch.totalNett === 0 && ch.totalCost > 0) {
    return { action: "Stop", reason: "Cost incurred but no revenue recorded. Pause and audit.", breakEvenMonths: null };
  }
  if (churn !== null && churn > 40) {
    return { action: "Stop", reason: `Churn ${churn.toFixed(1)}% critically high — poor subscriber quality. Review targeting.`, breakEvenMonths: beMonths };
  }
  if (beMonths !== null) {
    if (beMonths <= T)     return { action: "Scale",    reason: `Break-even ${beMonths.toFixed(1)} mo ≤ ${T} mo — strong unit economics. Increase budget.`, breakEvenMonths: beMonths };
    if (beMonths <= T * 2) return { action: "Continue", reason: `Break-even ${beMonths.toFixed(1)} mo — within acceptable window. Optimise to reach ${T}-mo target.`, breakEvenMonths: beMonths };
    return                        { action: "Stop",     reason: `Break-even ${beMonths.toFixed(1)} mo exceeds ${T * 2} mo ceiling. Pause and reassess.`, breakEvenMonths: beMonths };
  }
  // Fallback: no duration data
  if (roas >= 0.7) return { action: "Scale",    reason: `ROAS ${(roas*100).toFixed(0)}% — promising. Increase allocation.`, breakEvenMonths: null };
  if (roas >= 0.3) return { action: "Continue", reason: `ROAS ${(roas*100).toFixed(0)}% — moderate. Monitor and optimise.`, breakEvenMonths: null };
  return                  { action: "Stop",     reason: `ROAS ${(roas*100).toFixed(0)}% — insufficient return. Pause or review.`, breakEvenMonths: null };
}

/* ─── campaign card (mobile-only) ───────────────────────────────────── */

function CampaignCard({ c, idx }: { c: Campaign; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden ${idx % 2 !== 0 ? "bg-slate-50/40" : ""}`}>
      {/* top row */}
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0">
          <Badge channel={c.channel} />
          <p className="text-[11px] text-slate-500 mt-1 truncate">{c.date} · {c.cp}</p>
          <p className="text-xs font-medium text-slate-700 mt-0.5 truncate">{c.service}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-blue-700">
            {c.nettRevenue != null ? formatRp(c.nettRevenue) : "–"}
          </p>
          <p className="text-[10px] text-slate-400">Nett Rev</p>
        </div>
      </div>

      {/* metric chips */}
      <div className="grid grid-cols-3 gap-px bg-slate-100 border-t border-slate-100">
        {[
          { label: "MO", value: c.mo.toLocaleString() },
          { label: "Investment", value: formatRp(c.costAfterVAT) },
          { label: "ROAS", value: <ROASBadge roas={c.roas} /> },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white px-2 py-2 text-center">
            <p className="text-xs font-semibold text-slate-800 leading-snug">{value}</p>
            <p className="text-[10px] text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* expand toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-center gap-1 py-2 text-[11px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors border-t border-slate-100 active:bg-slate-100"
        aria-expanded={open}
      >
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        {open ? "Less" : "More details"}
      </button>

      {open && (
        <div className="grid grid-cols-3 gap-px bg-slate-100 border-t border-slate-100">
          {[
            { label: "Churn",      value: <ChurnBadge churn={c.churn} /> },
            { label: "Break-even", value: <BreakEvenBadge months={c.breakEvenMonths} /> },
            { label: "Cost/MO",  value: c.mo > 0 ? formatRp(c.costAfterVAT / c.mo) : "–" },
            { label: "Gross Rev",value: c.grossRevenue != null ? formatRp(c.grossRevenue) : "–" },
            { label: "Billrate FP", value: c.billrateFP != null ? `${c.billrateFP}%` : "–" },
            { label: "Days",     value: c.days ?? "–" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white px-2 py-2 text-center">
              <p className="text-xs font-semibold text-slate-800 leading-snug">{value}</p>
              <p className="text-[10px] text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── skeleton ───────────────────────────────────────────────────────── */

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-3 md:px-8 py-5 space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-3 md:p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-3 w-16" />
          </Card>
        ))}
      </div>
      <Card className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between"><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-16" /></div>
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </Card>
      <Card className="p-4"><Skeleton className="h-36 w-full" /></Card>
    </div>
  );
}

/* ─── countdown ──────────────────────────────────────────────────────── */

function Countdown({ nextRefreshAt }: { nextRefreshAt: number }) {
  const [rem, setRem] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = Math.max(0, nextRefreshAt - Date.now());
      setRem(`${Math.floor(d / 60000)}:${String(Math.floor((d % 60000) / 1000)).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextRefreshAt]);
  return <span className="tabular-nums">{rem}</span>;
}

/* ─── main page ──────────────────────────────────────────────────────── */

export default function DigiAdsDashboard() {
  const [data,         setData]         = useState<ApiResponse | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [fetchError,   setFetchError]   = useState<string | null>(null);
  const [nextRefresh,  setNextRefresh]  = useState(Date.now() + REFRESH_INTERVAL_MS);
  const [activeTab,    setActiveTab]    = useState("All Channels");
  const [showScrollTop,setShowScrollTop]= useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* fetch ─────────────────────────────────────────────────────────── */
  const fetchData = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    setFetchError(null);
    try {
      const res  = await fetch("/api/digiads", { cache: "no-store" });
      const json: ApiResponse = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const scheduleAutoRefresh = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setNextRefresh(Date.now() + REFRESH_INTERVAL_MS);
    timerRef.current = setInterval(() => {
      fetchData(true);
      setNextRefresh(Date.now() + REFRESH_INTERVAL_MS);
    }, REFRESH_INTERVAL_MS);
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    fetchData(true);
    scheduleAutoRefresh();
  }, [fetchData, scheduleAutoRefresh]);

  useEffect(() => {
    fetchData(false);
    scheduleAutoRefresh();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchData, scheduleAutoRefresh]);

  /* scroll-to-top visibility ─────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 350);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* derived ───────────────────────────────────────────────────────── */
  const allCampaigns = data?.campaigns ?? [];
  const filterFn     = CHANNEL_FILTERS[activeTab] ?? (() => true);
  const campaigns    = activeTab === "All Channels"
    ? allCampaigns
    : allCampaigns.filter((c) => filterFn(c.channel));

  const ltvPoints   = data?.ltvRef?.length ? data.ltvRef : FALLBACK_LTV;
  const kpis        = getKPIs(campaigns);
  const channelData = getChannelData(campaigns);
  const monthlyData = getMonthlyData(campaigns);

  const sortedByNett = [...channelData].sort((a, b) => b.totalNett - a.totalNett);
  const sortedByMO   = [...channelData].sort((a, b) => b.totalMO   - a.totalMO);
  const maxNett      = Math.max(...channelData.map((c) => c.totalNett), 1);
  const maxMO        = Math.max(...channelData.map((c) => c.totalMO),   1);

  const bestChannel  = sortedByNett[0];
  const fastestBERow = [...campaigns]
    .filter((c): c is Campaign & { breakEvenMonths: number } => c.breakEvenMonths !== null)
    .sort((a, b) => a.breakEvenMonths - b.breakEvenMonths)[0];
  const highestChurnCh = [...channelData]
    .filter((ch) => ch.avgChurn !== null)
    .sort((a, b) => b.avgChurn! - a.avgChurn!)[0];

  const uniqueCPs = [...new Set(campaigns.map((c) => c.cp))].join(" · ");

  const lastUpdatedStr = data?.fetchedAt
    ? new Date(data.fetchedAt).toLocaleString("id-ID", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false,
      })
    : null;

  /* ─── HEADER ────────────────────────────────────────────────────── */
  const header = (
    <header className="bg-[#0f172a] text-white sticky top-0 z-20 shadow-lg">

      {/* title row */}
      <div className="max-w-7xl mx-auto px-3 md:px-8 py-3 md:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 md:w-9 md:h-9 bg-red-500 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0">T</div>
          <div className="min-w-0">
            <p className="text-slate-400 text-[9px] md:text-[10px] uppercase tracking-widest font-semibold leading-none hidden sm:block">
              Telkomsel · Digiads 2026
            </p>
            <h1 className="text-base md:text-lg font-bold text-white leading-tight">Executive Dashboard</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* status — desktop only */}
          <div className="text-right hidden md:block">
            <div className="flex items-center justify-end gap-1.5 mb-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${refreshing ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
              <span className="text-[11px] text-slate-400">
                {refreshing ? "Refreshing…" : lastUpdatedStr ? `Updated ${lastUpdatedStr}` : "Loading…"}
              </span>
            </div>
            {!refreshing && !loading && (
              <p className="text-[10px] text-slate-500 text-right">
                Next refresh in <Countdown nextRefreshAt={nextRefresh} />
              </p>
            )}
          </div>

          {/* refresh button */}
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/25 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors min-w-[80px] justify-center"
            aria-label="Refresh data"
          >
            <svg className={`w-3.5 h-3.5 shrink-0 ${refreshing ? "animate-spin" : ""}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114.93-3M20 15a8 8 0 01-14.93 3" />
            </svg>
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </div>

      {/* mobile status strip */}
      {!loading && (
        <div className="md:hidden flex items-center justify-between px-3 pb-1.5 -mt-0.5">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${refreshing ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
            <span className="text-[10px] text-slate-400">
              {refreshing ? "Refreshing…" : lastUpdatedStr ? `${lastUpdatedStr}` : "–"}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            Next: <Countdown nextRefreshAt={nextRefresh} />
          </span>
        </div>
      )}

      {/* page nav */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-3 md:px-8 flex gap-1 py-1.5 overflow-x-auto scrollbar-none">
          {[
            { href: "/digiads",            label: "Campaign Dashboard", active: true  },
            { href: "/digiads/projection", label: "Revenue Projection", active: false },
            { href: "/digiads/forecast",   label: "Campaign Forecast",  active: false },
          ].map(({ href, label, active }) => (
            <Link key={href} href={href}
              className={`flex items-center whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                active ? "bg-white/15 text-white" : "text-slate-400 hover:text-white hover:bg-white/10 active:bg-white/15"
              }`}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* tab navigation */}
      <div className="border-t border-white/10 relative">
        {/* right-fade scroll hint */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0f172a] to-transparent pointer-events-none z-10" />
        <div className="max-w-7xl mx-auto px-3 md:px-8 flex gap-1 overflow-x-auto py-1.5 scrollbar-none scroll-smooth">
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            const count = tab === "All Channels"
              ? allCampaigns.length
              : allCampaigns.filter((c) => (CHANNEL_FILTERS[tab] ?? (() => false))(c.channel)).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 min-h-[40px] rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/10 active:bg-white/15"
                }`}
              >
                <span className="hidden sm:inline">{tab}</span>
                <span className="sm:hidden">{TAB_SHORT[tab] ?? tab}</span>
                {!loading && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
                    isActive ? "bg-white/25 text-white" : "bg-white/10 text-slate-500"
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );

  /* ─── LOADING ─────────────────────────────────────────────────────── */
  if (loading) {
    return <div className="min-h-screen bg-slate-50 font-sans">{header}<LoadingSkeleton /></div>;
  }

  /* ─── ERROR (no data at all) ─────────────────────────────────────── */
  if (fetchError && allCampaigns.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        {header}
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx={12} cy={12} r={10} />
              <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
            </svg>
          </div>
          <p className="text-slate-700 font-semibold text-lg">Failed to load data</p>
          <p className="text-sm text-slate-500 max-w-xs">{fetchError}</p>
          <button onClick={handleRefresh}
            className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors">
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* ─── DASHBOARD ──────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {header}

      {/* banners */}
      {refreshing && (
        <div className="bg-blue-50 border-b border-blue-100 py-2 text-center">
          <p className="text-xs text-blue-600 font-medium">Fetching latest data from Google Sheets…</p>
        </div>
      )}
      {fetchError && allCampaigns.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-100 py-2 px-4 flex items-center justify-between gap-3">
          <p className="text-xs text-amber-700">Could not refresh — showing data from {lastUpdatedStr}</p>
          <button onClick={handleRefresh} className="text-xs text-amber-800 font-semibold underline shrink-0">Retry</button>
        </div>
      )}

      {/* active-filter indicator */}
      {activeTab !== "All Channels" && (
        <div className="bg-blue-600 text-white py-2 px-3 md:px-8 flex items-center justify-between gap-3">
          <p className="text-xs font-medium">
            Showing: <span className="font-bold">{activeTab}</span>
            {" "}·{" "}{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
          </p>
          <button onClick={() => setActiveTab("All Channels")}
            className="text-xs text-blue-200 hover:text-white font-medium flex items-center gap-1 shrink-0">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-3 md:px-8 py-5 md:py-6 space-y-5 md:space-y-8">

        {/* empty state */}
        {campaigns.length === 0 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            </div>
            <p className="text-slate-600 font-semibold">No campaigns for {activeTab}</p>
            <p className="text-sm text-slate-400 mt-1">No data matches this filter.</p>
            <button onClick={() => setActiveTab("All Channels")}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
              View all channels
            </button>
          </div>
        )}

        {campaigns.length > 0 && (
          <>
            {/* ── Recommendations ─────────────────────────────────── */}
            <section>
              <SectionTitle>Channel Recommendations</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {channelData.map((ch) => {
                  const { action, reason, breakEvenMonths } = getChannelRec(ch);
                  const style = REC_STYLE[action];
                  const roas = ch.totalCost > 0 ? ch.totalNett / ch.totalCost : 0;
                  const THRESHOLD = 4;
                  // progress bar: capped at 2× threshold (8 months) for display
                  const beBarPct = breakEvenMonths !== null
                    ? Math.min(100, Math.round((breakEvenMonths / (THRESHOLD * 2)) * 100))
                    : null;
                  const thresholdPct = 50; // THRESHOLD / (THRESHOLD*2) = 50%
                  return (
                    <div key={ch.channel} className={`rounded-2xl shadow-sm border border-slate-100 ${style.border} ${style.bg} p-4 flex flex-col gap-2.5`}>
                      {/* header row */}
                      <div className="flex items-center justify-between gap-2">
                        <Badge channel={ch.channel} />
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide ${style.badgeBg} ${style.badgeText}`}>
                          {action === "Scale" && "▲ SCALE"}
                          {action === "Continue" && "→ CONTINUE"}
                          {action === "Stop" && "■ STOP"}
                        </span>
                      </div>

                      {/* metrics row */}
                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div>
                          <p className={`text-sm font-bold ${roas >= 1 ? "text-emerald-700" : roas >= 0.3 ? "text-amber-700" : "text-red-600"}`}>
                            {(roas * 100).toFixed(0)}%
                          </p>
                          <p className="text-[10px] text-slate-500">ROAS</p>
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${
                            breakEvenMonths === null ? "text-slate-400"
                            : breakEvenMonths <= THRESHOLD ? "text-emerald-700"
                            : breakEvenMonths <= THRESHOLD * 2 ? "text-amber-700"
                            : "text-red-600"
                          }`}>
                            {breakEvenMonths !== null ? `${breakEvenMonths.toFixed(1)} mo` : "–"}
                          </p>
                          <p className="text-[10px] text-slate-500">Break-even</p>
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${
                            ch.avgChurn === null ? "text-slate-400"
                            : ch.avgChurn > 25 ? "text-red-600"
                            : ch.avgChurn > 15 ? "text-amber-700"
                            : "text-emerald-700"
                          }`}>
                            {ch.avgChurn !== null ? `${ch.avgChurn.toFixed(1)}%` : "–"}
                          </p>
                          <p className="text-[10px] text-slate-500">Churn</p>
                        </div>
                      </div>

                      {/* break-even progress bar vs 4-month threshold */}
                      {beBarPct !== null && (
                        <div>
                          <div className="relative w-full bg-slate-200 rounded-full h-1.5">
                            {/* threshold marker at 50% */}
                            <div className="absolute top-0 bottom-0 w-px bg-slate-500 z-10" style={{ left: `${thresholdPct}%` }} />
                            <div
                              className={`h-1.5 rounded-full transition-all duration-500 ${
                                action === "Scale" ? "bg-emerald-500"
                                : action === "Continue" ? "bg-amber-400"
                                : "bg-red-500"
                              }`}
                              style={{ width: `${beBarPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-0.5">
                            <span className="text-[9px] text-slate-400">0</span>
                            <span className="text-[9px] text-slate-500 font-medium" style={{ position: "relative", left: `calc(${thresholdPct}% - 24px)` }}>
                              4 mo
                            </span>
                            <span className="text-[9px] text-slate-400">8 mo</span>
                          </div>
                        </div>
                      )}

                      {/* reason */}
                      <p className="text-[11px] text-slate-600 leading-relaxed">{reason}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── KPIs ────────────────────────────────────────────── */}
            <section>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KPICard label="Total Investment"  value={formatRp(kpis.totalInvestment)}
                  sub={formatRpFull(kpis.totalInvestment)} />
                <KPICard label="Total MO"          value={kpis.totalMO.toLocaleString("id-ID")}
                  sub={`${kpis.activeCampaigns} campaigns`} />
                <KPICard label="Gross Revenue"     value={formatRp(kpis.totalGross)}
                  sub="Completed" accent="text-blue-600" />
                <KPICard label="Nett Revenue"      value={formatRp(kpis.totalNett)}
                  sub={`ROAS ${(kpis.overallROAS * 100).toFixed(1)}%`}
                  accent={kpis.overallROAS >= 0.1 ? "text-emerald-600" : "text-amber-600"} />
              </div>
            </section>

            {/* ── Secondary KPIs + LTV ────────────────────────────── */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {/* 2x2 stat grid */}
                <div className="grid grid-cols-2 gap-3">
                  <KPICard label="Active Subs"  value={kpis.totalSubactive.toLocaleString("id-ID")} sub="Last reported" />
                  <KPICard label="Unreg"         value={kpis.totalUnreg.toLocaleString("id-ID")}     sub="Unregistered" accent="text-red-500" />
                  <KPICard label="Campaigns"     value={String(campaigns.length)}                    sub={`${monthlyData.length} months`} />
                  <KPICard label="CPs"           value={String(new Set(campaigns.map(c => c.cp)).size)} sub={uniqueCPs} />
                </div>

                {/* LTV card */}
                <Card className="md:col-span-2 bg-gradient-to-br from-[#1e1b4b] to-[#312e81] border-0 p-4 md:p-5">
                  <p className="text-[10px] md:text-[11px] font-semibold text-indigo-300 uppercase tracking-wider mb-3">
                    LTV Projection · Cek Pulsa Reference Cohort (Jul&apos;25 · 14,199 MO)
                  </p>
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    {ltvPoints.map((row) => (
                      <div key={row.period} className="text-center">
                        <p className="text-lg md:text-xl font-bold text-white">{formatRp(row.ltv)}</p>
                        <p className="text-[10px] md:text-[11px] text-indigo-300 mt-0.5">{row.period}</p>
                        <span className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          row.roas >= 1 ? "bg-emerald-400/20 text-emerald-300" : "bg-amber-400/20 text-amber-300"
                        }`}>
                          {row.roas.toFixed(2)}x
                        </span>
                        <p className="text-[10px] text-indigo-400 mt-0.5">{row.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-indigo-400 mt-3 leading-relaxed">
                    Short-term ROAS is low — campaigns break even at 120 days and reach 1.51x over the full subscriber lifetime.
                  </p>
                </Card>
              </div>
            </section>

            {/* ── Channel Performance ─────────────────────────────── */}
            <section>
              <SectionTitle>Performance by Channel</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 md:p-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Nett Revenue</p>
                  {sortedByNett.map((ch) => {
                    const be = calcBreakEven(ch);
                    return (
                      <HBar key={ch.channel} label={ch.channel} value={ch.totalNett}
                        maxValue={maxNett} barClass={getChannelColor(ch.channel).bar}
                        metaLeft={`${ch.totalMO.toLocaleString()} MO · ${ch.count} cmp`}
                        metaRight={be !== null ? `BE ${be.toFixed(1)} mo` : undefined}
                      />
                    );
                  })}
                </Card>
                <Card className="p-4 md:p-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Subscribers (MO)</p>
                  {sortedByMO.map((ch) => (
                    <div key={ch.channel} className="py-2.5 border-b border-slate-50 last:border-0">
                      <div className="flex justify-between items-baseline mb-1.5 gap-2">
                        <span className="text-sm font-medium text-slate-700 truncate">{ch.channel}</span>
                        <span className="text-sm font-semibold text-slate-800 shrink-0">{ch.totalMO.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 mb-1.5">
                        <div className={`h-2 rounded-full transition-all duration-500 ${getChannelColor(ch.channel).bar}`}
                          style={{ width: `${Math.max(2, Math.round((ch.totalMO / maxMO) * 100))}%` }} />
                      </div>
                      <div className="flex gap-3">
                        {ch.avgChurn != null && (
                          <span className="text-[11px] text-slate-400">
                            Churn <span className={ch.avgChurn > 25 ? "text-red-500 font-semibold" : ch.avgChurn > 15 ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}>
                              {ch.avgChurn.toFixed(1)}%
                            </span>
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          Cost/MO <span className="font-semibold text-slate-600">{ch.totalMO > 0 ? formatRp(ch.totalCost / ch.totalMO) : "–"}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            </section>

            {/* ── Monthly Overview ────────────────────────────────── */}
            <section>
              <SectionTitle>Monthly Overview</SectionTitle>
              <Card className="overflow-hidden">
                {/* scroll hint */}
                <div className="relative">
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 md:hidden" />
                  <div className="overflow-x-auto scroll-smooth">
                    <table className="w-full text-sm min-w-[400px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                          <th className="text-left px-3 md:px-4 py-3">Month</th>
                          {/* hide on mobile */}
                          <th className="text-right px-3 md:px-4 py-3 hidden sm:table-cell">Campaigns</th>
                          <th className="text-right px-3 md:px-4 py-3 hidden sm:table-cell">Investment</th>
                          <th className="text-right px-3 md:px-4 py-3">MO</th>
                          <th className="text-right px-3 md:px-4 py-3 hidden sm:table-cell">Gross Rev</th>
                          <th className="text-right px-3 md:px-4 py-3">Nett Rev</th>
                          <th className="text-right px-3 md:px-4 py-3">Monthly ROI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyData.map((m, i) => {
                          const roi = m.totalCost > 0 ? ((m.totalNett - m.totalCost) / m.totalCost) * 100 : null;
                          return (
                            <tr key={m.month} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${i % 2 !== 0 ? "bg-slate-50/40" : ""}`}>
                              <td className="px-3 md:px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{m.month}</td>
                              <td className="px-3 md:px-4 py-3 text-right text-slate-600 hidden sm:table-cell">{m.count}</td>
                              <td className="px-3 md:px-4 py-3 text-right text-slate-700 font-medium hidden sm:table-cell">{formatRp(m.totalCost)}</td>
                              <td className="px-3 md:px-4 py-3 text-right text-slate-700">{m.totalMO.toLocaleString()}</td>
                              <td className="px-3 md:px-4 py-3 text-right text-slate-600 hidden sm:table-cell">{m.totalGross > 0 ? formatRp(m.totalGross) : "–"}</td>
                              <td className="px-3 md:px-4 py-3 text-right font-semibold text-blue-700">{m.totalNett > 0 ? formatRp(m.totalNett) : "–"}</td>
                              <td className="px-3 md:px-4 py-3 text-right">
                                {roi !== null ? (
                                  <span className={`font-semibold ${roi >= 0 ? "text-emerald-600" : roi >= -50 ? "text-amber-600" : "text-red-500"}`}>
                                    {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
                                  </span>
                                ) : <span className="text-slate-400">–</span>}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wide">
                          <td className="px-3 md:px-4 py-3">Total</td>
                          <td className="px-3 md:px-4 py-3 text-right hidden sm:table-cell">{campaigns.length}</td>
                          <td className="px-3 md:px-4 py-3 text-right hidden sm:table-cell">{formatRp(kpis.totalInvestment)}</td>
                          <td className="px-3 md:px-4 py-3 text-right">{kpis.totalMO.toLocaleString()}</td>
                          <td className="px-3 md:px-4 py-3 text-right hidden sm:table-cell">{formatRp(kpis.totalGross)}</td>
                          <td className="px-3 md:px-4 py-3 text-right">{formatRp(kpis.totalNett)}</td>
                          <td className="px-3 md:px-4 py-3 text-right">
                            {(() => {
                              const totalROI = kpis.totalInvestment > 0
                                ? ((kpis.totalNett - kpis.totalInvestment) / kpis.totalInvestment) * 100
                                : null;
                              return totalROI !== null
                                ? `${totalROI >= 0 ? "+" : ""}${totalROI.toFixed(1)}%`
                                : "–";
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </section>

            {/* ── Key Insights ─────────────────────────────────────── */}
            <section>
              <SectionTitle>Key Insights</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <Card className="p-4 border-l-4 border-violet-500">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Best Channel</p>
                  <p className="text-sm font-bold text-slate-800">{bestChannel?.channel ?? "–"}</p>
                  <p className="text-sm text-violet-600 font-semibold mt-0.5">
                    {bestChannel ? `${formatRp(bestChannel.totalNett)} nett` : "–"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {bestChannel ? `${bestChannel.totalMO.toLocaleString()} MO · ${bestChannel.count} campaigns. Highest volume.` : "No data yet."}
                  </p>
                </Card>
                <Card className="p-4 border-l-4 border-blue-500">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Fastest Break-even</p>
                  <p className="text-sm font-bold text-slate-800">{fastestBERow?.channel ?? "–"}</p>
                  <p className="text-sm text-blue-600 font-semibold mt-0.5">
                    {fastestBERow ? `${fastestBERow.breakEvenMonths.toFixed(1)} mo · ${fastestBERow.date}` : "–"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {fastestBERow
                      ? `${fastestBERow.service} · ${fastestBERow.mo.toLocaleString()} MO at ${formatRp(fastestBERow.costAfterVAT)} spend.`
                      : "No break-even data yet."}
                  </p>
                </Card>
                <Card className="p-4 border-l-4 border-amber-500">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Watch: High Churn</p>
                  <p className="text-sm font-bold text-slate-800">{highestChurnCh?.channel ?? "–"}</p>
                  <p className="text-sm text-amber-600 font-semibold mt-0.5">
                    {highestChurnCh ? `${highestChurnCh.avgChurn!.toFixed(1)}% churn · ${highestChurnCh.totalMO.toLocaleString()} MO` : "–"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Highest churn rate in current filter. Consider refining targeting or reallocating budget.
                  </p>
                </Card>
              </div>
            </section>

            {/* ── Campaign Detail ──────────────────────────────────── */}
            <section>
              <SectionTitle>Campaign Detail</SectionTitle>

              {/* mobile cards */}
              <div className="md:hidden space-y-3">
                {campaigns.map((c, i) => <CampaignCard key={c.id} c={c} idx={i} />)}
              </div>

              {/* desktop table */}
              <Card className="hidden md:block overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="text-left px-3 py-3">Date</th>
                        <th className="text-left px-3 py-3">Channel</th>
                        <th className="text-left px-3 py-3">CP</th>
                        <th className="text-left px-3 py-3">Service</th>
                        <th className="text-right px-3 py-3">Investment</th>
                        <th className="text-right px-3 py-3">MO</th>
                        <th className="text-right px-3 py-3">Cost/MO</th>
                        <th className="text-right px-3 py-3">Gross Rev</th>
                        <th className="text-right px-3 py-3">Nett Rev</th>
                        <th className="text-right px-3 py-3">Churn</th>
                        <th className="text-right px-3 py-3">Break-even</th>
                        <th className="text-right px-3 py-3">ROAS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((c, i) => (
                        <tr key={c.id}
                          className={`border-b border-slate-50 hover:bg-blue-50/40 transition-colors ${i % 2 !== 0 ? "bg-slate-50/30" : ""}`}>
                          <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{c.date}</td>
                          <td className="px-3 py-2.5"><Badge channel={c.channel} /></td>
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.cp}</td>
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                            {c.service}
                            {c.notes && <span className="ml-1 text-[10px] text-slate-400">({c.notes})</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-700 font-medium">{formatRp(c.costAfterVAT)}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-800">{c.mo.toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-right text-slate-500">{c.mo > 0 ? formatRp(c.costAfterVAT / c.mo) : "–"}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600">{c.grossRevenue != null ? formatRp(c.grossRevenue) : "–"}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-blue-700">{c.nettRevenue != null ? formatRp(c.nettRevenue) : "–"}</td>
                          <td className="px-3 py-2.5 text-right"><ChurnBadge churn={c.churn} /></td>
                          <td className="px-3 py-2.5 text-right"><BreakEvenBadge months={c.breakEvenMonths} /></td>
                          <td className="px-3 py-2.5 text-right"><ROASBadge roas={c.roas} /></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wide">
                        <td className="px-3 py-3" colSpan={4}>Grand Total</td>
                        <td className="px-3 py-3 text-right">{formatRp(kpis.totalInvestment)}</td>
                        <td className="px-3 py-3 text-right">{kpis.totalMO.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right">{kpis.totalMO > 0 ? formatRp(kpis.totalInvestment / kpis.totalMO) : "–"}</td>
                        <td className="px-3 py-3 text-right">{formatRp(kpis.totalGross)}</td>
                        <td className="px-3 py-3 text-right">{formatRp(kpis.totalNett)}</td>
                        <td className="px-3 py-3 text-right">–</td>
                        <td className="px-3 py-3 text-right">–</td>
                        <td className="px-3 py-3 text-right">{(kpis.overallROAS * 100).toFixed(1)}%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 mt-6">
        <div className="max-w-7xl mx-auto px-3 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] text-slate-400">
          <span>Source: TELKOMSEL – Digiads 2026 (Google Spreadsheet · live)</span>
          <span>{lastUpdatedStr ? `Updated: ${lastUpdatedStr}` : "–"} · IDR</span>
        </div>
      </footer>

      {/* scroll-to-top FAB */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 right-4 z-30 w-10 h-10 rounded-full bg-slate-800 text-white shadow-lg flex items-center justify-center hover:bg-slate-700 active:bg-slate-900 transition-colors"
          aria-label="Back to top"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
