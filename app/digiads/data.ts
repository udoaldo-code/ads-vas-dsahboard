export interface Campaign {
  id: number;
  date: string;
  month: string;
  channel: string;
  cp: string;
  service: string;
  costAfterVAT: number;
  mo: number;
  pricePerMO: number | null;
  grossRevenue: number | null;
  nettRevenue: number | null;
  billrateFP: number | null;
  billrateDP: number | null;
  days: number | null;
  subactive: number | null;
  unreg: number | null;
  churn: number | null;
  arpu: number | null;
  /** Break-even months — from spreadsheet col "Est.ROI (month)" which stores investment/monthly-nett-rate */
  breakEvenMonths: number | null;
  ltv: number | null;
  roas: number | null;
  notes?: string;
}

/* ── formatters ──────────────────────────────────────────────────────── */

export function formatRp(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}K`;
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

export function formatRpFull(value: number): string {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

/* ── computed helpers — all accept a campaigns array ────────────────── */

export function getKPIs(campaigns: Campaign[]) {
  const totalInvestment = campaigns.reduce((s, c) => s + c.costAfterVAT, 0);
  const totalMO = campaigns.reduce((s, c) => s + c.mo, 0);
  const totalGross = campaigns.reduce((s, c) => s + (c.grossRevenue ?? 0), 0);
  const totalNett = campaigns.reduce((s, c) => s + (c.nettRevenue ?? 0), 0);
  const overallROAS = totalInvestment > 0 ? totalNett / totalInvestment : 0;
  const activeCampaigns = campaigns.filter((c) => c.mo > 0).length;
  const totalSubactive = campaigns.reduce((s, c) => s + (c.subactive ?? 0), 0);
  const totalUnreg = campaigns.reduce((s, c) => s + (c.unreg ?? 0), 0);
  return {
    totalInvestment,
    totalMO,
    totalGross,
    totalNett,
    overallROAS,
    activeCampaigns,
    totalSubactive,
    totalUnreg,
  };
}

const CHANNEL_RANK: Record<string, number> = {
  "Cek Pulsa": 0,
  "Medium Banner": 1,
  "SMS Blast": 2,
  "SMS Target": 3,
  "OTA": 4,
  "Meta Ads": 5,
};

export function getChannelData(campaigns: Campaign[]) {
  // Derive channels from data in preferred order
  const channels = Array.from(new Set(campaigns.map((c) => c.channel))).sort(
    (a, b) =>
      (CHANNEL_RANK[a] ?? 99) - (CHANNEL_RANK[b] ?? 99)
  );

  return channels.map((channel) => {
    const cc = campaigns.filter((c) => c.channel === channel);
    const withBE    = cc.filter((c) => c.breakEvenMonths !== null);
    const withChurn = cc.filter((c) => c.churn !== null);
    const withDays  = cc.filter((c) => c.days !== null && c.days > 0);
    return {
      channel,
      count: cc.length,
      totalCost: cc.reduce((s, c) => s + c.costAfterVAT, 0),
      totalMO: cc.reduce((s, c) => s + c.mo, 0),
      totalGross: cc.reduce((s, c) => s + (c.grossRevenue ?? 0), 0),
      totalNett: cc.reduce((s, c) => s + (c.nettRevenue ?? 0), 0),
      /** Average break-even months (from spreadsheet's own calculation per campaign) */
      avgBreakEvenMonths:
        withBE.length
          ? withBE.reduce((s, c) => s + c.breakEvenMonths!, 0) / withBE.length
          : null,
      avgChurn:
        withChurn.length
          ? withChurn.reduce((s, c) => s + c.churn!, 0) / withChurn.length
          : null,
      /** Weighted-average campaign duration in days */
      avgDays:
        withDays.length
          ? withDays.reduce((s, c) => s + c.days!, 0) / withDays.length
          : null,
    };
  });
}

export function getMonthlyData(campaigns: Campaign[]) {
  // Preserve insertion order (order months appear in the sheet)
  const seen = new Set<string>();
  const months: string[] = [];
  for (const c of campaigns) {
    if (!seen.has(c.month)) { seen.add(c.month); months.push(c.month); }
  }

  return months.map((month) => {
    const mc = campaigns.filter((c) => c.month === month);
    return {
      month,
      count: mc.length,
      totalCost: mc.reduce((s, c) => s + c.costAfterVAT, 0),
      totalMO: mc.reduce((s, c) => s + c.mo, 0),
      totalGross: mc.reduce((s, c) => s + (c.grossRevenue ?? 0), 0),
      totalNett: mc.reduce((s, c) => s + (c.nettRevenue ?? 0), 0),
    };
  });
}

/* ── static fallback LTV projection (Jul'25 Cek Pulsa cohort) ────────── */
export const FALLBACK_LTV = [
  { period: "30 days",    days: 30,  ltv: 1110, roas: 0.41, label: "Short-term" },
  { period: "120 days",   days: 120, ltv: 2961, roas: 1.08, label: "Break-even" },
  { period: "Full period",days: null,ltv: 4140, roas: 1.51, label: "Profitable"  },
];

/* ── channel colour map + lookup helper ─────────────────────────────── */
export const CHANNEL_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  "Cek Pulsa":     { bg: "bg-violet-100",  text: "text-violet-700",  bar: "bg-violet-500" },
  "Medium Banner": { bg: "bg-emerald-100", text: "text-emerald-700", bar: "bg-emerald-500" },
  "SMS Blast":     { bg: "bg-blue-100",    text: "text-blue-700",    bar: "bg-blue-500"    },
  "SMS Target":    { bg: "bg-sky-100",     text: "text-sky-700",     bar: "bg-sky-500"     },
  "OTA":           { bg: "bg-amber-100",   text: "text-amber-700",   bar: "bg-amber-500"   },
  "Meta Ads":      { bg: "bg-rose-100",    text: "text-rose-700",    bar: "bg-rose-400"    },
};

/** Colour lookup that tolerates unnormalised channel names. */
export function getChannelColor(channel: string) {
  if (CHANNEL_COLORS[channel]) return CHANNEL_COLORS[channel];
  // Fuzzy fallbacks (shouldn't be needed after parse normalisation, but kept as safety net)
  if (channel.includes("Cek Pulsa")) return CHANNEL_COLORS["Cek Pulsa"];
  if (channel.includes("Meta"))      return CHANNEL_COLORS["Meta Ads"];
  if (channel.includes("SMS Blast")) return CHANNEL_COLORS["SMS Blast"];
  if (channel.includes("SMS"))       return CHANNEL_COLORS["SMS Target"];
  return { bg: "bg-slate-100", text: "text-slate-600", bar: "bg-slate-400" };
}
