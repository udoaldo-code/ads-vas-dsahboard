/** Parser for the Revenue Projection sheet (gid=1612633253). */

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
  estGrossRevIncremental: number; // future period only
  estGrossRevTotal: number;       // total = actual + incremental
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
 * Parse the Revenue Projection sheet CSV.
 * The sheet is wide-format: 3 campaigns side-by-side.
 * Column offsets: Campaign 1 → [1, 2/3], Campaign 2 → [5, 6/7], Campaign 3 → [9, 10/11]
 */
export function parseProjectionSheet(csv: string): CampaignProjection[] {
  const lines = csv.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headerRow = parseCsvRow(lines[0]);

  // Extract campaign names from header: strip trailing " Values"
  const rawName = (col: number) =>
    (headerRow[col] ?? "").replace(/\s*Values\s*$/i, "").trim();
  const names = [rawName(1), rawName(5), rawName(9)];

  // Build metric-name → [val1, val2, val3] lookup
  // val[n] = main column, sideKey[n] = side-table metric, sideVal[n] = side-table value
  const metricMap: Record<string, [string, string, string]> = {};
  // Side-table metric-name → value (per campaign index)
  const sideMap: Record<string, [string, string, string]> = {};

  for (let i = 1; i < lines.length; i++) {
    const c = parseCsvRow(lines[i]);
    const metricName = c[0]?.trim();
    if (!metricName) continue;

    metricMap[metricName] = [c[1] ?? "", c[5] ?? "", c[9] ?? ""];

    // Side-table entries
    for (const [keyIdx, valIdx] of [[2, 3], [6, 7], [10, 11]] as [number, number][]) {
      const sk = c[keyIdx]?.trim();
      const sv = c[valIdx]?.trim() ?? "";
      if (sk) {
        const campIdx = keyIdx === 2 ? 0 : keyIdx === 6 ? 1 : 2;
        if (!sideMap[sk]) sideMap[sk] = ["", "", ""];
        sideMap[sk][campIdx] = sv;
      }
    }
  }

  const mainVal = (metricName: string, campIdx: 0 | 1 | 2): string =>
    (metricMap[metricName]?.[campIdx] ?? "");
  const sideVal = (sideKey: string, campIdx: 0 | 1 | 2): string =>
    (sideMap[sideKey]?.[campIdx] ?? "");

  // Some metric names appear twice (Est. Gross Revenue has two rows: incremental + total)
  // We handle this by renaming on second encounter during raw row scan.
  // Let's re-scan once to pick up duplicate rows explicitly.
  const grossRevRows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = parseCsvRow(lines[i]);
    if (c[0]?.trim() === "Est. Gross Revenue (until end period )") {
      grossRevRows.push([c[1] ?? "", c[5] ?? "", c[9] ?? ""]);
    }
  }

  return names.map((name, idx) => {
    const ci = idx as 0 | 1 | 2;
    const m = (key: string) => mainVal(key, ci);
    const s = (key: string) => sideVal(key, ci);

    return {
      name,
      campaignDays:        parseNum(m("Campaign days (as-till date)"))        ?? 0,
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
      successfulChargesToDate: parseNum(m("Successfull Charges (as-till date)")) ?? 0,
      estUnsubPerDayActual: parseNum(m("Est. Unsub per Day (as-till date)"))  ?? 0,
      estUnsubPerDayEnd:   parseNum(m("Est. Unsub per Day (until end period )")) ?? 0,
      estAvgActiveSubs:    parseNum(m("Est. Average Active Subs "))           ?? parseNum(m("Est. Average Active Subs")) ?? 0,
      estAvgDailyCharges:  parseNum(m("Est. Average Daily Charges "))         ?? parseNum(m("Est. Average Daily Charges")) ?? 0,
      estTotalCharges:     parseNum(m("Est. Total Charges (until end period")) ?? 0,
      estGrossRevIncremental: parseMoney(grossRevRows[0]?.[ci] ?? "")         ?? 0,
      estGrossRevTotal:    parseMoney(grossRevRows[1]?.[ci] ?? "")             ?? 0,
      estNetRevTotal:      parseMoney(m("Est. Net Revenue (until end period )")) ?? 0,
      estLTV:              parseMoney(m("Est. LTV"))                          ?? 0,
      estROAS:             parseNum(m("Est. ROAS"))                           ?? 0,

      // Side-table forecast
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
