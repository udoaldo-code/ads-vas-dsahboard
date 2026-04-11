"use client";

import { useState } from "react";

const stats = [
  { value: "90%+", label: "Prediction Accuracy" },
  { value: "2.4×", label: "Average CTR Lift" },
  { value: "50%", label: "Faster Creative Cycles" },
  { value: "10M+", label: "Ads Analyzed" },
];

export default function Hero() {
  const [email, setEmail] = useState("");

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-white">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-50 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-50 rounded-full blur-3xl opacity-50 -translate-x-1/3 translate-y-1/4" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              AI-Powered Creative Intelligence
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight mb-6">
              Know Which Ads{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                Win
              </span>{" "}
              Before You Spend
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
              Upload your ad banners and creative assets. Our AI analyzes every pixel — color, copy, CTA, composition — and predicts performance with over 90% accuracy before you go live.
            </p>

            {/* Email capture */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto lg:mx-0 mb-4" id="get-started">
              <input
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-400"
              />
              <button className="px-6 py-3 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors whitespace-nowrap shadow-md shadow-violet-200">
                Analyze Free
              </button>
            </div>
            <p className="text-xs text-slate-400 text-center lg:text-left">
              No credit card required · 10 free analyses/month
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-100">
              {stats.map((s) => (
                <div key={s.label} className="text-center lg:text-left">
                  <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Dashboard preview mockup */}
          <div className="relative">
            <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
              {/* Mockup header */}
              <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-50 border-b border-slate-100">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-slate-400 font-mono">creative-insights.ai/analyze</span>
              </div>

              {/* Mockup content */}
              <div className="p-5 space-y-4">
                {/* Score card */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Overall Score</div>
                    <div className="text-4xl font-bold text-slate-900">87<span className="text-lg text-slate-400">/100</span></div>
                  </div>
                  <div className="w-16 h-16 rounded-full border-4 border-violet-500 flex items-center justify-center">
                    <span className="text-violet-600 font-bold text-sm">A+</span>
                  </div>
                </div>

                {/* Metrics bars */}
                {[
                  { label: "Hook Rate", value: 82, color: "bg-violet-500" },
                  { label: "Visual Impact", value: 91, color: "bg-indigo-500" },
                  { label: "CTA Strength", value: 75, color: "bg-blue-500" },
                  { label: "Brand Safety", value: 94, color: "bg-emerald-500" },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span className="font-medium">{m.label}</span>
                      <span className="font-semibold">{m.value}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${m.color} rounded-full`}
                        style={{ width: `${m.value}%` }}
                      />
                    </div>
                  </div>
                ))}

                {/* Insight chips */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {["Strong CTA color", "Human face detected", "Clear value prop", "+CTR potential"].map((tag) => (
                    <span key={tag} className="text-xs font-medium bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Predicted CTR */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-4 text-white">
                  <div className="text-xs font-semibold opacity-80 mb-1">Predicted CTR</div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold">3.8%</span>
                    <span className="text-sm opacity-80 mb-1">↑ 2.1× industry avg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Conversion lift</div>
                <div className="text-emerald-600 font-bold text-sm">+34% predicted</div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Scroll Stop</div>
                <div className="text-violet-600 font-bold text-sm">3.2s avg hold</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
