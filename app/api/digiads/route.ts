import { NextResponse } from "next/server";
import { parseSheet } from "../../digiads/parse";

export const dynamic = "force-dynamic";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1ohjZix9k_QfV0IbqJJLYWBSujSi2shX5aKDTebjGm2Y/gviz/tq?tqx=out:csv";

export async function GET() {
  try {
    const res = await fetch(SHEET_URL, {
      redirect: "follow",
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Google Sheets returned HTTP ${res.status}` },
        { status: 502 }
      );
    }

    const csv = await res.text();
    const { campaigns, ltvRef } = parseSheet(csv);

    return NextResponse.json(
      { campaigns, ltvRef, fetchedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
