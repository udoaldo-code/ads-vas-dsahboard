"use client";

import { useRef, useState } from "react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4"];
const MAX_SIZE_MB = 50;

interface Metrics {
  hookRate: number;
  ctrPotential: number;
  visualClarity: number;
  brandRecall: number;
  brandSafety: number;
}

interface AnalysisResult {
  overallScore: number;
  grade: string;
  metrics: Metrics;
  insights: string[];
  improvements: string[];
  predictedCTR: number;
  predictedCVR: number;
}

interface VariantResult {
  overallScore: number;
  grade: string;
  metrics: Metrics;
  predictedCTR: number;
  predictedCVR: number;
  appliedChanges: string[];
}

const METRIC_META: { key: keyof Metrics; label: string; color: string; track: string }[] = [
  { key: "hookRate",      label: "Hook Rate",      color: "bg-violet-500", track: "bg-violet-100" },
  { key: "ctrPotential",  label: "CTR Potential",  color: "bg-indigo-500", track: "bg-indigo-100" },
  { key: "visualClarity", label: "Visual Clarity", color: "bg-blue-500",   track: "bg-blue-100"   },
  { key: "brandRecall",   label: "Brand Recall",   color: "bg-emerald-500",track: "bg-emerald-100"},
  { key: "brandSafety",   label: "Brand Safety",   color: "bg-teal-500",   track: "bg-teal-100"   },
];

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ScoreBar({
  label,
  original,
  variant,
  color,
  track,
}: {
  label: string;
  original: number;
  variant?: number;
  color: string;
  track: string;
}) {
  const delta = variant !== undefined ? variant - original : null;
  return (
    <div>
      <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {variant !== undefined && (
            <span className={`font-semibold ${delta! > 0 ? "text-emerald-600" : "text-slate-400"}`}>
              {delta! > 0 ? `+${delta}` : delta} → {variant}/100
            </span>
          )}
          <span className="font-bold text-slate-700">{variant ?? original}/100</span>
        </div>
      </div>
      <div className={`relative h-2.5 ${track} rounded-full overflow-hidden`}>
        {/* original ghost bar */}
        {variant !== undefined && (
          <div
            className="absolute inset-y-0 left-0 bg-slate-300 rounded-full"
            style={{ width: `${original}%` }}
          />
        )}
        {/* active bar */}
        <div
          className={`absolute inset-y-0 left-0 ${color} rounded-full transition-all duration-700`}
          style={{ width: `${variant ?? original}%` }}
        />
      </div>
    </div>
  );
}

export default function AnalyzerDemo() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile]         = useState<File | null>(null);
  const [preview, setPreview]   = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing]   = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult]     = useState<AnalysisResult | null>(null);
  const [variant, setVariant]   = useState<VariantResult | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [analysisTime, setAnalysisTime] = useState(0);

  /* ── file helpers ─────────────────────────────────────────── */
  const acceptFile = (f: File) => {
    setError(null);
    setResult(null);
    setVariant(null);

    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError("Unsupported file type. Please upload PNG, JPG, GIF, WebP, or MP4.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File exceeds ${MAX_SIZE_MB} MB limit.`);
      return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  };

  /* ── analyze ──────────────────────────────────────────────── */
  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    setVariant(null);
    const t0 = Date.now();

    try {
      const form = new FormData();
      if (file) form.append("file", file);

      const res  = await fetch("/api/analyze", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Analysis failed.");

      setAnalysisTime(parseFloat(((Date.now() - t0) / 1000).toFixed(1)));
      setResult(json.data as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setAnalyzing(false);
    }
  };

  /* ── generate variant ─────────────────────────────────────── */
  const handleGenerateVariant = async () => {
    if (!result) return;
    setGenerating(true);
    setError(null);

    try {
      const res  = await fetch("/api/generate-variant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original: result.metrics }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Variant generation failed.");
      setVariant(json.data as VariantResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  };

  /* ── reset ────────────────────────────────────────────────── */
  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setVariant(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const displayScore = variant?.overallScore ?? result?.overallScore;
  const displayGrade = variant?.grade ?? result?.grade;

  /* ── render ───────────────────────────────────────────────── */
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold text-violet-600 uppercase tracking-widest">Live Demo</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            See the AI in Action
          </h2>
          <p className="mt-4 text-slate-500 text-lg">
            Upload your banner or use the sample creative — get AI analysis and optimized variants in seconds.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-100 overflow-hidden">
          {/* Window chrome */}
          <div className="flex items-center gap-1.5 px-5 py-3 bg-slate-50 border-b border-slate-100">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-2 text-xs text-slate-400 font-mono">Creative Analyzer</span>
            {result && (
              <span className="ml-auto text-[11px] font-medium text-slate-400">
                {variant ? "Variant Generated" : "Analysis Complete"}
              </span>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.webp,.mp4"
            onChange={handleInputChange}
            className="hidden"
            aria-label="Upload banner file"
          />

          <div className="p-6 md:p-8">
            {/* ════════ UPLOAD / PRE-ANALYSIS ════════ */}
            {!result ? (
              <div className="space-y-5">
                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => !file && fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl transition-colors ${
                    file
                      ? "border-violet-300 bg-violet-50/40 cursor-default"
                      : dragging
                      ? "border-violet-400 bg-violet-50 cursor-pointer"
                      : "border-slate-200 hover:border-violet-300 hover:bg-slate-50 cursor-pointer"
                  }`}
                >
                  {file ? (
                    <div className="flex items-start gap-4 p-5">
                      <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200">
                        {preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82V15a1 1 0 01-.553.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{file.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {file.type.split("/")[1]?.toUpperCase()} · {formatBytes(file.size)}
                        </p>
                        <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Ready to analyze
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReset(); }}
                        className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 flex items-center justify-center transition-colors"
                        aria-label="Remove file"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="p-10 text-center">
                      <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-slate-700 mb-1">Drop your banner here</p>
                      <p className="text-sm text-slate-400 mb-3">PNG, JPG, GIF, WebP, MP4 · Max 50 MB</p>
                      <span className="text-xs text-slate-400">or click to browse</span>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-5 py-3.5 border-2 border-violet-200 text-violet-700 text-sm font-semibold rounded-xl hover:bg-violet-50 hover:border-violet-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {file ? "Replace File" : "Upload Banner"}
                  </button>

                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                      analyzing
                        ? "bg-violet-400 text-white cursor-not-allowed"
                        : "bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-200"
                    }`}
                  >
                    {analyzing ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Analyzing{file ? ` "${file.name}"` : " sample"}...
                      </>
                    ) : file ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Analyze Banner
                      </>
                    ) : (
                      "Analyze Sample Creative"
                    )}
                  </button>
                </div>

                <p className="text-center text-xs text-slate-400">
                  {file ? "Your file is processed locally and never stored." : "No file? We'll use a sample banner for the demo."}
                </p>
              </div>
            ) : (
              /* ════════ RESULTS ════════ */
              <div className="space-y-6">

                {/* ── Top: original vs variant images ── */}
                <div className={`grid gap-4 ${variant ? "grid-cols-2" : "grid-cols-1"}`}>
                  {/* Original */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Original</span>
                      <span className="text-xs font-bold text-slate-700">{result.overallScore}/100 · {result.grade}</span>
                    </div>
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
                      {preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview} alt="Original" className="w-full h-full object-contain" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-300">
                          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs">sample_banner_300x250</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Optimized variant */}
                  {variant && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-violet-600 uppercase tracking-wide flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          AI Optimized
                        </span>
                        <span className="text-xs font-bold text-violet-700">{variant.overallScore}/100 · {variant.grade}</span>
                      </div>
                      <div className="relative rounded-xl overflow-hidden border-2 border-violet-400 bg-violet-50 aspect-video flex items-center justify-center">
                        {preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={preview}
                            alt="AI Optimized Variant"
                            className="w-full h-full object-contain"
                            style={{ filter: "brightness(1.06) contrast(1.1) saturate(1.15)" }}
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-violet-300">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs">optimized_variant_v1</span>
                          </div>
                        )}
                        {/* AI badge overlay */}
                        <div className="absolute top-2 right-2 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          AI Optimized
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Score summary row ── */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Overall score */}
                  <div className="col-span-1 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl p-4 text-white flex flex-col justify-between">
                    <div className="text-xs font-semibold opacity-75 mb-1">Overall Score</div>
                    <div>
                      <div className="text-3xl font-bold">
                        {displayScore}
                        <span className="text-base opacity-60">/100</span>
                      </div>
                      <div className="text-xs font-bold opacity-90 mt-0.5">{displayGrade} Grade</div>
                    </div>
                    {variant && (
                      <div className="mt-2 text-xs font-semibold bg-white/20 rounded-lg px-2 py-1 text-center">
                        +{variant.overallScore - result.overallScore} pts improvement
                      </div>
                    )}
                  </div>
                  {/* CTR */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col justify-between">
                    <div className="text-xs font-semibold text-emerald-600 mb-1">Predicted CTR</div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-700">
                        {(variant?.predictedCTR ?? result.predictedCTR).toFixed(2)}%
                      </div>
                      {variant && (
                        <div className="text-xs text-emerald-600 font-medium mt-0.5">
                          ↑ from {result.predictedCTR.toFixed(2)}%
                        </div>
                      )}
                    </div>
                  </div>
                  {/* CVR */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col justify-between">
                    <div className="text-xs font-semibold text-blue-600 mb-1">Predicted CVR</div>
                    <div>
                      <div className="text-2xl font-bold text-blue-700">
                        {(variant?.predictedCVR ?? result.predictedCVR).toFixed(2)}%
                      </div>
                      {variant && (
                        <div className="text-xs text-blue-600 font-medium mt-0.5">
                          ↑ from {result.predictedCVR.toFixed(2)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Metric bars (with delta if variant exists) ── */}
                <div className="space-y-3">
                  {METRIC_META.map((m) => (
                    <ScoreBar
                      key={m.key}
                      label={m.label}
                      original={result.metrics[m.key]}
                      variant={variant?.metrics[m.key]}
                      color={m.color}
                      track={m.track}
                    />
                  ))}
                </div>

                {/* ── Applied changes (variant only) ── */}
                {variant && (
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-sm font-semibold text-violet-800">AI Applied Changes</span>
                    </div>
                    <ul className="space-y-1.5">
                      {variant.appliedChanges.map((c) => (
                        <li key={c} className="flex items-start gap-2 text-xs text-violet-700">
                          <svg className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ── AI Insights (pre-variant) ── */}
                {!variant && (
                  <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-violet-700 mb-2">AI Insights</p>
                    <ul className="space-y-1.5">
                      {result.insights.map((ins) => (
                        <li key={ins} className="flex items-start gap-2 text-xs text-violet-800">
                          <svg className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {ins}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ── Improvements (pre-variant) ── */}
                {!variant && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-semibold text-amber-700">Recommended Improvements</span>
                    </div>
                    <ul className="space-y-1.5">
                      {result.improvements.map((imp) => (
                        <li key={imp} className="flex items-start gap-2 text-xs text-amber-800">
                          <span className="flex-shrink-0 mt-0.5">→</span>
                          {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* ── Action buttons ── */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Generate / regenerate */}
                  <button
                    onClick={handleGenerateVariant}
                    disabled={generating}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                      generating
                        ? "bg-violet-400 text-white cursor-not-allowed"
                        : "bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-200"
                    }`}
                  >
                    {generating ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating variant...
                      </>
                    ) : variant ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Generate Another Variant
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                        </svg>
                        Generate Improved Variants
                      </>
                    )}
                  </button>

                  {/* Analyze another */}
                  <button
                    onClick={handleReset}
                    className="sm:w-44 py-3.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Analyze Another
                  </button>
                </div>

                <p className="text-center text-xs text-slate-400">
                  Analyzed {file?.name ?? "sample_banner_300x250.png"} in {analysisTime || "1.8"}s
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
