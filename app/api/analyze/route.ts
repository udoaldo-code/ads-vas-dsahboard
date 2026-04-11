import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface AnalysisResult {
  overallScore: number;
  grade: string;
  metrics: {
    hookRate: number;
    ctrPotential: number;
    visualClarity: number;
    brandRecall: number;
    brandSafety: number;
  };
  insights: string[];
  improvements: string[];
  predictedCTR: number;
  predictedCVR: number;
}

function grade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  return "D";
}

// Simulate AI analysis — replace with real model calls in production
function simulateAnalysis(): AnalysisResult {
  const hookRate = Math.floor(Math.random() * 30 + 60);
  const ctrPotential = Math.floor(Math.random() * 25 + 65);
  const visualClarity = Math.floor(Math.random() * 20 + 75);
  const brandRecall = Math.floor(Math.random() * 35 + 55);
  const brandSafety = Math.floor(Math.random() * 10 + 88);

  const overallScore = Math.round(
    (hookRate * 0.25 + ctrPotential * 0.3 + visualClarity * 0.2 + brandRecall * 0.15 + brandSafety * 0.1)
  );

  const allInsights = [
    "Strong visual contrast detected in the focal region",
    "Human face detected — increases emotional engagement by up to 38%",
    "CTA button color contrasts well with background",
    "Clear value proposition within first 3 words",
    "Brand logo is prominently placed",
    "Color palette aligns with brand guidelines",
  ];

  const allImprovements = [
    "Increase CTA font size by 2–4px for better mobile legibility",
    "Reduce headline word count to under 8 words",
    "Add social proof element (star rating or user count)",
    "Increase color contrast ratio for accessibility compliance",
    "Move primary CTA higher in the visual hierarchy",
  ];

  const insights = allInsights.sort(() => 0.5 - Math.random()).slice(0, 3);
  const improvements = allImprovements.sort(() => 0.5 - Math.random()).slice(0, 3);

  return {
    overallScore,
    grade: grade(overallScore),
    metrics: { hookRate, ctrPotential, visualClarity, brandRecall, brandSafety },
    insights,
    improvements,
    predictedCTR: parseFloat((Math.random() * 3 + 1.5).toFixed(2)),
    predictedCVR: parseFloat((Math.random() * 6 + 2).toFixed(2)),
  };
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data") && !contentType.includes("application/json")) {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = simulateAnalysis();

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: "AI Creative Insight Analyzer",
    version: "1.0.0",
    status: "operational",
    endpoints: {
      "POST /api/analyze": "Analyze an ad creative asset",
    },
  });
}
