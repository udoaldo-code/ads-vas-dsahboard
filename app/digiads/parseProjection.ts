/** Parser for Revenue Projection sheets (any number of campaigns side-by-side). */

export interface CampaignProjection {
  name: string;

  // Actuals (as-till-date)
  campaignDays: number;
  remainingDays: number;
  clicks: number | null;
  crMO: number | null;          // %
  mo: number;
  activeSubs: number;
  billingRateFP: number | null; // %
  billingRateDaily: number | null; // %
  churn: number | null;         // %
  costCampaign: number;
  cpa: number | null;
  grossRevActual: number;
  netRevActual: number;
  netLTV: number;
  netROAS: number;
  netRunRate: number;

  // End-of-period estimates
  estChurnPessimistic: number | null;
  estActiveSubsEnd: number;
  servicePricePerCharge: number;
  dailyChargesFP: number;
  dailyChargesActual: number;
  successfulChargesToDate: number;
  estUnsubPerDayActual: number;
  estUnsubPerDayEnd: number;
  estAvgActiveSubs: number;
  estAvgDailyCharges: number;
  estTotalCharges: number;
  estGrossRevIncremental: number;
  estGrossRevTotal: number;
  estNetRevTotal: number;
  estLTV: number;
  estROAS: number;

  // Forecast metrics (side-table)
  ratio30Campaign: number | null;
  arpu30WithChurn: number | null;
  churn30: number | null;
  remainingChurn30: number | null;
  forecastARPU30: number | null;
  churn60: number | null;
  remainingChurn60: number | null;
  forecastARPU60: number | null;
  forecastARPU90: number | null;
  roiInMonths: number | null;
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

function parseMoney(s: string): number | null {
  return parseRp(s) ?? parseNum(s);
}

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

/* ── main parser ─────────────────────────────────────────────────────── */

/**
 * Parse a Revenue Projection sheet CSV.
 * Wide-format: N campaigns side-by-side, each group 4 columns wide:
 *   [main_value, side_key, side_value, separator]
 * Campaign groups start at columns 1, 5, 9, 13, …
 */
export function parseProjectionSheet(csv: string): CampaignProjection[] {
  const lines = csv.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headerRow = parseCsvRow(lines[0]);

  // Detect campaign start columns: 1, 5, 9, 13, ... (step=4)
  // A column is a campaign if it has a non-empty name that isn't a generic label.
  const skip = new Set(["Metrics", "Values", ""]);
  const offsets: number[] = [];
  for (let col = 1; col < headerRow.length; col += 4) {
    const cell = (headerRow[col] ?? "").trim();
    if (cell && !skip.has(cell)) offsets.push(col);
  }
  if (offsets.length === 0) return [];

  const n = offsets.length;
  const names = offsets.map((col) =>
    (headerRow[col] ?? "").replace(/\s*Values\s*$/i, "").trim()
  );

  // Build lookups: metric-name → string[] (one per campaign)
  const metricMap: Record<string, string[]> = {};
  const sideMap:   Record<string, string[]> = {};

  for (let i = 1; i < lines.length; i++) {
    const c = parseCsvRow(lines[i]);
    const metricName = c[0]?.trim();
    if (!metricName) continue;

    if (!metricMap[metricName]) metricMap[metricName] = new Array(n).fill("");
    offsets.forEach((startCol, idx) => {
      metricMap[metricName][idx] = c[startCol] ?? "";
      const sk = c[startCol + 1]?.trim();
      const sv = c[startCol + 2]?.trim() ?? "";
      if (sk) {
        if (!sideMap[sk]) sideMap[sk] = new Array(n).fill("");
        sideMap[sk][idx] = sv;
      }
    });
  }

  // Duplicate rows for "Est. Gross Revenue" — first row = incremental, second = total
  const grossRevRows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = parseCsvRow(lines[i]);
    if (c[0]?.trim().startsWith("Est. Gross Revenue")) {
      grossRevRows.push(offsets.map((col) => c[col] ?? ""));
    }
  }

  const mv = (key: string, idx: number) => metricMap[key]?.[idx] ?? "";
  const sv = (key: string, idx: number) => sideMap[key]?.[idx]  ?? "";

  return names.map((name, idx) => {
    const m = (key: string) => mv(key, idx);
    const s = (key: string) => sv(key, idx);

    return {
      name,
      campaignDays:        parseNum(m("Campaign days (as-till date)")) ?? parseNum(m("Campaign days (till date)")) ?? 0,
      remainingDays:       parseNum(m("Remaining campaign Days (until Day on last day)")) ?? 0,
      clicks:              parseNum(m("Clicks")),
      crMO:                parsePct(m("CR MO")),
      mo:                  parseNum(m("MO"))                                  ?? 0,
      activeSubs:          parseNum(m("Active Subscribers from Total Subscribers (as-till date)")) ?? 0,
      billingRateFP:       parsePct(m("Billing Rate (First Push)")),
      billingRateDaily:    parsePct(m("Average Billing Rate (Daily Push) as-till date")),
      churn:               parsePct(m("Churn")),
      costCampaign:        parseMoney(m("Cost Campaign"))                     ?? 0,
      cpa:                 parseMoney(m("CPA")),
      grossRevActual:      parseMoney(m("Gross Revenue till date"))           ?? 0,
      netRevActual:        parseMoney(m("Net Revenue "))                      ?? parseMoney(m("Net Revenue")) ?? 0,
      netLTV:              parseMoney(m("Net. LTV"))                          ?? 0,
      netROAS:             parseNum(m("Net ROAS (to Date)"))                  ?? 0,
      netRunRate:          parseMoney(m("Net Run Rate"))                      ?? 0,
      estChurnPessimistic: parsePct(m("Est. Churn (Pessimistic on last day)")),
      estActiveSubsEnd:    parseNum(m("Est. Active Subscribers from Total Subscribers (on Day on last day)")) ?? 0,
      servicePricePerCharge: parseMoney(m("Service Price per Charge"))        ?? 0,
      dailyChargesFP:      parseNum(m("Daily Successfull Charges (First Push)")) ?? 0,
      dailyChargesActual:  parseNum(m("Daily Successfull Charges  (as-till date)")) ?? 0,
      successfulChargesToDate: parseNum(m("Successfull Charges (as-of till date )")) ?? parseNum(m("Successfull Charges (as-till date)")) ?? 0,
      estUnsubPerDayActual: parseNum(m("Est. Unsub per Day (as-of 12 Apr)")) ?? parseNum(m("Est. Unsub per Day (as-till date)")) ?? 0,
      estUnsubPerDayEnd:   parseNum(m("Est. Unsub per Day (until end period )")) ?? 0,
      estAvgActiveSubs:    parseNum(m("Est. Average Active Subs "))           ?? parseNum(m("Est. Average Active Subs")) ?? 0,
      estAvgDailyCharges:  parseNum(m("Est. Average Daily Charges "))         ?? parseNum(m("Est. Average Daily Charges")) ?? 0,
      estTotalCharges:     parseNum(m("Est. Total Charges (until end period )")) ?? parseNum(m("Est. Total Charges (until end period")) ?? 0,
      estGrossRevIncremental: parseMoney(grossRevRows[0]?.[idx] ?? "")        ?? 0,
      estGrossRevTotal:    parseMoney(grossRevRows[1]?.[idx] ?? "")            ?? 0,
      estNetRevTotal:      parseMoney(m("Est. Net Revenue (until end period )")) ?? 0,
      estLTV:              parseMoney(m("Est. LTV"))                          ?? 0,
      estROAS:             parseNum(m("Est. ROAS"))                           ?? 0,

      ratio30Campaign:     parseNum(s("30 / Campaign Days")),
      arpu30WithChurn:     parseMoney(s("ARPU 30 with Churn")),
      churn30:             parsePct(s("Churn 30")),
      remainingChurn30:    parsePct(s("Remaining Churn 30 Days")),
      forecastARPU30:      parseMoney(s("Forecast ARPU 30")),
      churn60:             parsePct(s("Churn 60")),
      remainingChurn60:    parsePct(s("Remaining Churn 60 Days")),
      forecastARPU60:      parseMoney(s("Forecast ARPU 60")),
      forecastARPU90:      parseMoney(s("Forecast ARPU 90")),
      roiInMonths:         parseNum(s("ROI in Months")),
    };
  });
}
