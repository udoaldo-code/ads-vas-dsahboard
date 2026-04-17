import type { Campaign } from "./data";

export interface LTVPoint {
  period: string;
  days: number | null;
  ltv: number;
  roas: number;
  label: string;
}

/* ── helpers ─────────────────────────────────────────────────────────── */

function parseRp(s: string): number | null {
  if (!s || s.trim() === "" || s.trim() === "-") return null;
  const n = parseFloat(s.replace(/[Rp,\s]/gi, ""));
  return isNaN(n) ? null : n;
}

function parsePct(s: string): number | null {
  if (!s || s.trim() === "") return null;
  const n = parseFloat(s.replace("%", "").trim());
  return isNaN(n) ? null : n;
}

function parseNum(s: string): number | null {
  if (!s || s.trim() === "") return null;
  const n = parseFloat(s.replace(/[,\s]/g, ""));
  return isNaN(n) ? null : n;
}

/** Try parseRp first, then parseNum — handles both "Rp1234" and plain "1234" */
function parseMoney(s: string): number | null {
  return parseRp(s) ?? parseNum(s);
}

function getMonth(dateStr: string): string {
  const s = dateStr.trim();
  const map: [string, string][] = [
    ["Jan", "Jan"], ["Feb", "Feb"], ["Mar", "Mar"], ["Apr", "Apr"],
    ["May", "May"], ["Jun", "Jun"], ["Jul", "Jul"], ["Aug", "Aug"],
    ["Sep", "Sep"], ["Oct", "Oct"], ["Nov", "Nov"], ["Dec", "Dec"],
  ];
  for (const [abbr, label] of map) {
    if (s.includes(abbr)) {
      const m = s.match(/(\d{4})/);
      const yr = m ? `'${m[1].slice(2)}` : "'26";
      return `${label} ${yr}`;
    }
  }
  return "Unknown";
}

/** Minimal but correct CSV row parser (handles double-quoted fields). */
function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

/* ── channel name normaliser ──────────────────────────────────────────
   The spreadsheet uses long names like "Cek Pulsa Slot A", "Cek Pulsa - A",
   "Meta" etc. Normalise them to the canonical names used everywhere else.
────────────────────────────────────────────────────────────────────── */
function normaliseChannel(raw: string): string {
  const s = raw.trim();
  if (s.toLowerCase().startsWith("cek pulsa")) return "Cek Pulsa";
  if (s === "Meta" || s.toLowerCase().startsWith("meta")) return "Meta Ads";
  return s;
}

/* ── main parser ─────────────────────────────────────────────────────── */

export function parseSheet(csv: string): {
  campaigns: Campaign[];
  ltvRef: LTVPoint[];
} {
  const lines = csv.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return { campaigns: [], ltvRef: [] };

  const campaigns: Campaign[] = [];
  const ltvRef: LTVPoint[] = [];
  let id = 1;

  for (let i = 1; i < lines.length; i++) {
    const c = parseCsvRow(lines[i]);
    const date = c[0] ?? "";
    const channel = c[1] ?? "";
    const cp = c[2] ?? "";
    const service = c[3] ?? "";

    // Skip blank or header-repeat rows
    if (!date || !channel || channel === "Channel") continue;

    const costAfterVAT = parseMoney(c[4] ?? "") ?? 0;
    const mo = parseNum(c[5] ?? "") ?? 0;

    // ── LTV reference rows (Jul 2025 historical cohort) ─────────────
    if (date.includes("Jul 2025") || date.includes("Jul2025")) {
      const daysRaw = c[13] ?? "";
      const ltv = parseMoney(c[14] ?? "");
      if (ltv === null || ltv === 0) continue;

      const isPct = daysRaw.includes("%");
      const days = isPct ? null : parseNum(daysRaw);

      // Full-period row has a shifted structure: ROAS is at col[16].
      // Numbered rows (30, 120 days) have ROAS at col[17] or col[21].
      const roas = isPct
        ? (parseNum(c[16] ?? "") ?? 0)
        : (parseNum(c[17] ?? "") ?? parseNum(c[21] ?? "") ?? 0);

      let period = days !== null ? `${days} days` : "Full period";
      const label =
        days === 30 ? "Short-term" :
        days === 120 ? "Break-even" : "Profitable";

      ltvRef.push({ period, days, ltv, roas, label });
      continue;
    }

    // Skip rows with no meaningful cost/mo
    if (costAfterVAT === 0 && mo === 0) continue;

    // Gross Revenue: use c[9] when present, otherwise fall back to FP + DP components
    const fpRev   = parseMoney(c[7] ?? "") ?? 0;
    const dpRev   = parseMoney(c[8] ?? "") ?? 0;
    const grossRevenue =
      parseMoney(c[9] ?? "") ??
      (fpRev > 0 || dpRev > 0 ? fpRev + dpRev : null);

    campaigns.push({
      id: id++,
      date,
      month: getMonth(date),
      channel: normaliseChannel(channel),
      cp,
      service,
      costAfterVAT,
      mo,
      pricePerMO: parseMoney(c[6] ?? ""),
      grossRevenue,
      nettRevenue: parseMoney(c[10] ?? ""),
      billrateFP: parseNum(c[11] ?? ""),
      billrateDP: parseNum(c[12] ?? ""),
      days: parseNum(c[13] ?? ""),
      subactive: parseNum(c[14] ?? ""),
      unreg: parseNum(c[15] ?? ""),
      churn: parsePct(c[16] ?? ""),
      arpu: parseMoney(c[17] ?? ""),
      breakEvenMonths: parseNum(c[18] ?? ""),
      ltv: parseMoney(c[20] ?? ""),
      roas: parseNum(c[21] ?? ""),
      notes: c[19] && c[19].trim() ? c[19].trim() : undefined,
    });
  }

  // Sort ltvRef by days ascending (nulls last)
  ltvRef.sort((a, b) => {
    if (a.days === null) return 1;
    if (b.days === null) return -1;
    return a.days - b.days;
  });

  return { campaigns, ltvRef };
}
