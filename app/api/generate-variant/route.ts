import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface VariantResult {
  overallScore: number;
  grade: string;
  metrics: {
    hookRate: number;
    ctrPotential: number;
    visualClarity: number;
    brandRecall: number;
    brandSafety: number;
  };
  predictedCTR: number;
  predictedCVR: number;
  appliedChanges: string[];
}

function grade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  return "C";
}

function clamp(v: number) {
  return Math.min(100, Math.max(0, v));
}

export async function POST(req: NextRequest) {
  try {
    // Read original scores from request body
    const body = await req.json().catch(() => ({}));
    const original = body.original ?? {};

    const boost = (base: number, min = 4, max = 14) =>
      clamp(base + Math.floor(Math.random() * (max - min + 1) + min));

    const hookRate     = boost(original.hookRate     ?? 70);
    const ctrPotential = boost(original.ctrPotential ?? 70);
    const visualClarity= boost(original.visualClarity?? 75);
    const brandRecall  = boost(original.brandRecall  ?? 65);
    const brandSafety  = boost(original.brandSafety  ?? 90, 1, 4);

    const overallScore = Math.round(
      hookRate * 0.25 + ctrPotential * 0.30 + visualClarity * 0.20 + brandRecall * 0.15 + brandSafety * 0.10
    );

    const allChanges = [
      "CTA button enlarged and repositioned to upper-right quadrant",
      "Headline shortened to 6 words with stronger action verb",
      "Color contrast ratio increased from 3.2:1 to 5.8:1 (WCAG AA)",
      "Brand logo moved to top-left for 18% higher recall",
      "Added social proof badge (4.8★ · 12K users)",
      "Background decluttered — reduced visual noise by removing 3 elements",
      "CTA button color shifted to high-contrast orange (#F97316)",
      "Added human face in top-left attention zone",
      "Font size increased from 14px to 17px for mobile legibility",
    ];

    const appliedChanges = allChanges.sort(() => 0.5 - Math.random()).slice(0, 4);

    const result: VariantResult = {
      overallScore,
      grade: grade(overallScore),
      metrics: { hookRate, ctrPotential, visualClarity, brandRecall, brandSafety },
      predictedCTR: parseFloat((Math.random() * 1.5 + (original.predictedCTR ?? 2.5)).toFixed(2)),
      predictedCVR: parseFloat((Math.random() * 2   + (original.predictedCVR ?? 4)).toFixed(2)),
      appliedChanges,
    };

    await new Promise((r) => setTimeout(r, 900));

    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ error: "Variant generation failed." }, { status: 500 });
  }
}
