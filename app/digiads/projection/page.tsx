"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CampaignProjection } from "../parseProjection";
import { formatRp, formatRpFull } from "../data";

/* ── constants ───────────────────────────────────────────────────────── */
const REFRESH_INTERVAL_MS = 60 * 60 * 1000;
const BREAK_EVEN_THRESHOLD = 4; // months

interface ApiResponse {
  campaigns: CampaignProjection[];
  fetchedAt: string;
  error?: string;
}

/* ── primitives ──────────────────────────────────────────────────────── */

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
      <span className="w-1 h-4 rounded-full bg-indigo-500 inline-block shrink-0" />
      {children}
    </h2>
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

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />;
}

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

function ROASBadge({ roas }: { roas: number }) {
  const cls = roas >= 1 ? "text-emerald-600 font-bold" : roas >= 0.3 ? "text-amber-600 font-semibold" : "text-red-500";
  return <span className={cls}>{(roas * 100).toFixed(1)}%</span>;
}

function BreakEvenBadge({ months }: { months: number | null }) {
  if (months === null) return <span className="text-slate-300">–</span>;
  const cls = months <= BREAK_EVEN_THRESHOLD ? "text-emerald-600 font-bold"
    : months <= BREAK_EVEN_THRESHOLD * 2 ? "text-amber-600 font-semibold"
    : "text-red-500 font-medium";
  return <span className={cls}>{months.toFixed(2)}<span className="text-[10px] font-normal opacity-70"> mo</span></span>;
}

function ChurnBadge({ churn }: { churn: number | null }) {
  if (churn === null) return <span className="text-slate-300">–</span>;
  const cls = churn > 25 ? "text-red-500 font-semibold" : churn > 15 ? "text-amber-600 font-medium" : "text-emerald-600 font-medium";
  return <span className={cls}>{churn.toFixed(2)}%</span>;
}

/* ── per-campaign card ────────────────────────────────────────────────── */

function CampaignCard({ cp }: { cp: CampaignProjection }) {
  const [expanded, setExpanded] = useState(false);
  const roasColor = cp.estROAS >= 1 ? "bg-emerald-500" : cp.estROAS >= 0.3 ? "bg-amber-400" : "bg-red-500";
  const beColor   = cp.roiInMonths !== null
    ? (cp.roiInMonths <= BREAK_EVEN_THRESHOLD ? "border-emerald-500" : cp.roiInMonths <= BREAK_EVEN_THRESHOLD * 2 ? "border-amber-400" : "border-red-500")
    : "border-slate-200";

  return (
    <Card className={`overflow-hidden border-l-4 ${beColor}`}>
      {/* header */}
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Campaign</p>
            <h3 className="text-sm md:text-base font-bold text-slate-800 leading-tight">{cp.name}</h3>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-slate-400 mb-0.5">Est. ROAS</p>
            <p className={`text-lg font-bold ${cp.estROAS >= 1 ? "text-emerald-600" : cp.estROAS >= 0.3 ? "text-amber-600" : "text-red-500"}`}>
              {(cp.estROAS * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* key metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
          {[
            { label: "MO",          value: cp.mo.toLocaleString("id-ID") },
            { label: "Campaign Days", value: `${cp.campaignDays}d` },
            { label: "Net ROAS",    value: <ROASBadge roas={cp.netROAS} /> },
            { label: "Break-even",  value: <BreakEvenBadge months={cp.roiInMonths} /> },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-xl px-3 py-2 text-center">
              <p className="text-xs font-bold text-slate-800 leading-snug">{value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* actuals vs projection */}
      <div className="border-t border-slate-100 grid grid-cols-2 divide-x divide-slate-100">
        <div className="p-3 md:p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Actuals (to date)</p>
          <div className="space-y-1.5">
            {[
              { label: "Gross Revenue",   value: formatRp(cp.grossRevActual) },
              { label: "Net Revenue",     value: formatRp(cp.netRevActual),    accent: "text-blue-700 font-semibold" },
              { label: "Net LTV",         value: formatRp(cp.netLTV) },
              { label: "Net Run Rate/mo", value: formatRp(cp.netRunRate) },
              { label: "Cost",            value: formatRp(cp.costCampaign),    accent: "text-slate-500" },
              { label: "Churn",           value: <ChurnBadge churn={cp.churn} /> },
            ].map(({ label, value, accent }) => (
              <div key={label} className="flex justify-between items-center gap-2">
                <span className="text-[11px] text-slate-500 truncate">{label}</span>
                <span className={`text-[11px] font-medium text-right whitespace-nowrap ${accent ?? "text-slate-700"}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 md:p-4 bg-indigo-50/30">
          <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-2">Projected (end period)</p>
          <div className="space-y-1.5">
            {[
              { label: "Est. Gross Rev",  value: formatRp(cp.estGrossRevTotal) },
              { label: "Est. Net Rev",    value: formatRp(cp.estNetRevTotal),   accent: "text-indigo-700 font-semibold" },
              { label: "Est. LTV",        value: formatRp(cp.estLTV) },
              { label: "Est. Avg Subs",   value: cp.estAvgActiveSubs.toLocaleString() },
              { label: "Est. Total Charges", value: cp.estTotalCharges.toLocaleString() },
              { label: "Est. ROAS",       value: <ROASBadge roas={cp.estROAS} /> },
            ].map(({ label, value, accent }) => (
              <div key={label} className="flex justify-between items-center gap-2">
                <span className="text-[11px] text-slate-500 truncate">{label}</span>
                <span className={`text-[11px] font-medium text-right whitespace-nowrap ${accent ?? "text-slate-700"}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ARPU forecast toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/40 transition-colors border-t border-slate-100"
        aria-expanded={expanded}
      >
        <svg className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        {expanded ? "Hide ARPU forecast" : "ARPU & churn forecast"}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-3 md:p-4 bg-slate-50/50">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">ARPU Forecast</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { period: "30 days",  arpu: cp.forecastARPU30, churn: cp.churn30 },
              { period: "60 days",  arpu: cp.forecastARPU60, churn: cp.churn60 },
              { period: "90 days",  arpu: cp.forecastARPU90, churn: null },
            ].map(({ period, arpu, churn }) => (
              <div key={period} className="bg-white rounded-xl p-2.5 text-center border border-slate-100">
                <p className="text-xs font-bold text-slate-800">{arpu != null ? formatRp(arpu) : "–"}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{period}</p>
                {churn != null && (
                  <p className={`text-[10px] font-medium mt-0.5 ${churn > 25 ? "text-red-500" : churn > 10 ? "text-amber-600" : "text-emerald-600"}`}>
                    churn {churn.toFixed(2)}%
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { label: "ARPU 30 (with churn)", value: cp.arpu30WithChurn != null ? formatRp(cp.arpu30WithChurn) : "–" },
              { label: "CR MO (Click→MO)", value: cp.crMO != null ? `${cp.crMO.toFixed(2)}%` : "–" },
              { label: "CPA", value: cp.cpa != null ? formatRp(cp.cpa) : "–" },
              { label: "Service Price/Charge", value: cp.servicePricePerCharge > 0 ? formatRp(cp.servicePricePerCharge) : "–" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center gap-2">
                <span className="text-[11px] text-slate-500 truncate">{label}</span>
                <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ── comparison table ─────────────────────────────────────────────────── */

function ComparisonTable({ campaigns }: { campaigns: CampaignProjection[] }) {
  const rows: { label: string; fn: (c: CampaignProjection) => React.ReactNode }[] = [
    { label: "MO",               fn: (c) => c.mo.toLocaleString("id-ID") },
    { label: "Campaign Days",    fn: (c) => `${c.campaignDays}d` },
    { label: "Churn",            fn: (c) => <ChurnBadge churn={c.churn} /> },
    { label: "Cost",             fn: (c) => formatRp(c.costCampaign) },
    { label: "CPA",              fn: (c) => c.cpa != null ? formatRp(c.cpa) : "–" },
    { label: "Gross Rev (actual)",fn: (c) => formatRp(c.grossRevActual) },
    { label: "Net Rev (actual)", fn: (c) => formatRp(c.netRevActual) },
    { label: "Net ROAS",         fn: (c) => <ROASBadge roas={c.netROAS} /> },
    { label: "Net Run Rate/mo",  fn: (c) => formatRp(c.netRunRate) },
    { label: "Break-even (mo)",  fn: (c) => <BreakEvenBadge months={c.roiInMonths} /> },
    { label: "Est. Gross Rev",   fn: (c) => formatRp(c.estGrossRevTotal) },
    { label: "Est. Net Rev",     fn: (c) => formatRp(c.estNetRevTotal) },
    { label: "Est. LTV",         fn: (c) => formatRp(c.estLTV) },
    { label: "Est. ROAS",        fn: (c) => <ROASBadge roas={c.estROAS} /> },
    { label: "Forecast ARPU 30d",fn: (c) => c.forecastARPU30 != null ? formatRp(c.forecastARPU30) : "–" },
    { label: "Forecast ARPU 60d",fn: (c) => c.forecastARPU60 != null ? formatRp(c.forecastARPU60) : "–" },
    { label: "Forecast ARPU 90d",fn: (c) => c.forecastARPU90 != null ? formatRp(c.forecastARPU90) : "–" },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto scroll-smooth">
        <table className="w-full text-xs min-w-[480px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-3 md:px-4 py-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold w-36">Metric</th>
              {campaigns.map((c) => (
                <th key={c.name} className="text-right px-3 md:px-4 py-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  <span className="truncate block max-w-[120px] ml-auto">{c.name.split(" ").slice(0, 3).join(" ")}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${i % 2 !== 0 ? "bg-slate-50/40" : ""}`}>
                <td className="px-3 md:px-4 py-2.5 text-slate-600 font-medium whitespace-nowrap">{row.label}</td>
                {campaigns.map((c) => (
                  <td key={c.name} className="px-3 md:px-4 py-2.5 text-right text-slate-700">{row.fn(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ── main page ───────────────────────────────────────────────────────── */

export default function ProjectionPage() {
  const [data,          setData]          = useState<ApiResponse | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [fetchError,    setFetchError]    = useState<string | null>(null);
  const [nextRefresh,   setNextRefresh]   = useState(Date.now() + REFRESH_INTERVAL_MS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    setFetchError(null);
    try {
      const res  = await fetch("/api/digiads/projection", { cache: "no-store" });
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

  const campaigns = data?.campaigns ?? [];
  const lastUpdatedStr = data?.fetchedAt
    ? new Date(data.fetchedAt).toLocaleString("id-ID", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false,
      })
    : null;

  // KPI totals
  const totalCost   = campaigns.reduce((s, c) => s + c.costCampaign,   0);
  const totalMO     = campaigns.reduce((s, c) => s + c.mo,             0);
  const totalNetAct = campaigns.reduce((s, c) => s + c.netRevActual,   0);
  const totalNetEst = campaigns.reduce((s, c) => s + c.estNetRevTotal, 0);
  const bestBE      = campaigns.filter(c => c.roiInMonths !== null).sort((a, b) => a.roiInMonths! - b.roiInMonths!)[0];

  /* ── HEADER ───────────────────────────────────────────────────────── */
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
            <h1 className="text-base md:text-lg font-bold text-white leading-tight">Revenue Projection</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/25 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors min-w-[80px] justify-center"
          >
            <svg className={`w-3.5 h-3.5 shrink-0 ${refreshing ? "animate-spin" : ""}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114.93-3M20 15a8 8 0 01-14.93 3" />
            </svg>
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </div>

      {/* top nav — switch between pages */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-3 md:px-8 flex gap-1 py-1.5">
          <Link href="/digiads"
            className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors">
            Campaign Dashboard
          </Link>
          <Link href="/digiads/projection"
            className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium bg-white/15 text-white">
            Revenue Projection
          </Link>
        </div>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        {header}
        <div className="max-w-7xl mx-auto px-3 md:px-8 py-5 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-3 md:p-4 space-y-2">
                <div className="animate-pulse bg-slate-200 rounded h-3 w-20" />
                <div className="animate-pulse bg-slate-200 rounded h-6 w-28" />
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-64" />)}
          </div>
        </div>
      </div>
    );
  }

  if (fetchError && campaigns.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        {header}
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center gap-4 text-center">
          <p className="text-slate-700 font-semibold text-lg">Failed to load data</p>
          <p className="text-sm text-slate-500">{fetchError}</p>
          <button onClick={handleRefresh} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold">Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {header}

      {refreshing && (
        <div className="bg-blue-50 border-b border-blue-100 py-2 text-center">
          <p className="text-xs text-blue-600 font-medium">Fetching latest data from Google Sheets…</p>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-3 md:px-8 py-5 md:py-6 space-y-5 md:space-y-8">

        {/* ── KPI summary ─────────────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard
              label="Total Investment"
              value={formatRp(totalCost)}
              sub={formatRpFull(totalCost)}
            />
            <KPICard
              label="Total MO"
              value={totalMO.toLocaleString("id-ID")}
              sub={`${campaigns.length} campaigns`}
            />
            <KPICard
              label="Net Revenue (actual)"
              value={formatRp(totalNetAct)}
              sub={`ROAS ${totalCost > 0 ? ((totalNetAct / totalCost) * 100).toFixed(1) : "–"}%`}
              accent="text-blue-600"
            />
            <KPICard
              label="Est. Net Revenue"
              value={formatRp(totalNetEst)}
              sub={`Est. ROAS ${totalCost > 0 ? ((totalNetEst / totalCost) * 100).toFixed(1) : "–"}%`}
              accent={totalNetEst >= totalCost ? "text-emerald-600" : "text-amber-600"}
            />
          </div>
        </section>

        {/* ── best break-even highlight ────────────────────────────────── */}
        {bestBE && (
          <section>
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-2xl p-4 md:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wider mb-0.5">Fastest Break-even</p>
                <p className="text-base md:text-lg font-bold">{bestBE.name}</p>
                <p className="text-sm text-emerald-200 mt-0.5">
                  Break-even in <span className="font-bold text-white">{bestBE.roiInMonths!.toFixed(2)} months</span> · Est. ROAS {(bestBE.estROAS * 100).toFixed(1)}%
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center shrink-0">
                {[
                  { label: "MO",       value: bestBE.mo.toLocaleString() },
                  { label: "Net ROAS", value: `${(bestBE.netROAS * 100).toFixed(1)}%` },
                  { label: "Est. LTV", value: formatRp(bestBE.estLTV) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/10 rounded-xl px-3 py-2">
                    <p className="text-sm font-bold">{value}</p>
                    <p className="text-[10px] text-emerald-200">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── per-campaign cards ───────────────────────────────────────── */}
        <section>
          <SectionTitle>Campaign Projections</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {campaigns.map((c) => <CampaignCard key={c.name} cp={c} />)}
          </div>
        </section>

        {/* ── comparison table ─────────────────────────────────────────── */}
        <section>
          <SectionTitle>Side-by-side Comparison</SectionTitle>
          <ComparisonTable campaigns={campaigns} />
        </section>

      </main>

      <footer className="border-t border-slate-200 mt-6">
        <div className="max-w-7xl mx-auto px-3 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] text-slate-400">
          <span>Source: TELKOMSEL – Digiads 2026 · Revenue Projection Sheet (live)</span>
          <span>{lastUpdatedStr ? `Updated: ${lastUpdatedStr}` : "–"} · IDR</span>
        </div>
      </footer>
    </div>
  );
}
