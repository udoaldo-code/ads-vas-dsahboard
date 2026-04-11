const metrics = [
  {
    name: "Hook Rate",
    abbr: "HR",
    color: "violet",
    bgColor: "bg-violet-50",
    textColor: "text-violet-700",
    borderColor: "border-violet-200",
    accentColor: "bg-violet-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    headline: "Scroll-Stopping Power",
    description:
      "Measures what percentage of users stop scrolling within the first 3 seconds of seeing your ad. AI evaluates visual hierarchy, motion, contrast, and emotional triggers that create instant attention.",
    benchmark: "Industry avg: 2.1% · Top 10%: 8%+",
    example: "A human face looking directly at camera increases hook rate by up to 38%.",
  },
  {
    name: "Click-Through Rate",
    abbr: "CTR",
    color: "indigo",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-200",
    accentColor: "bg-indigo-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
    headline: "CTA & Copy Effectiveness",
    description:
      "Predicts how effectively your CTA button color, placement, and copy drives clicks. Our model has analyzed 10M+ ads to understand which combinations maximise click intent.",
    benchmark: "Industry avg: 0.9% · Top 10%: 3.5%+",
    example: "Contrasting CTA button (vs. background) increases CTR by an average of 24%.",
  },
  {
    name: "Conversion Rate",
    abbr: "CVR",
    color: "blue",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    accentColor: "bg-blue-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    headline: "End-to-End Funnel Effectiveness",
    description:
      "Measures how effectively an ad drives the final desired action — purchase, sign-up, or download. AI evaluates value proposition clarity, urgency signals, and trust cues embedded in the creative.",
    benchmark: "Industry avg: 2.4% · Top 10%: 9%+",
    example: "Social proof elements (ratings, user counts) in banners increase CVR by up to 29%.",
  },
  {
    name: "Brand Recall Score",
    abbr: "BRS",
    color: "emerald",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    accentColor: "bg-emerald-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    headline: "Memorability Prediction",
    description:
      "An AI-derived prediction of how memorable your ad will be 24 hours after exposure. Analyzes distinctiveness, brand element prominence, color uniqueness, and narrative clarity.",
    benchmark: "Industry avg: 41/100 · Top 10%: 75+",
    example: "Ads with a single bold visual focal point score 31% higher on brand recall.",
  },
];

export default function Metrics() {
  return (
    <section id="metrics" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold text-violet-600 uppercase tracking-widest">Performance Metrics</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            The Metrics That Actually Matter
          </h2>
          <p className="mt-4 text-slate-500 text-lg leading-relaxed">
            We analyze and predict four core dimensions of ad creative performance — all benchmarked against your industry.
          </p>
        </div>

        {/* Metric cards */}
        <div className="grid sm:grid-cols-2 gap-6">
          {metrics.map((m) => (
            <div
              key={m.name}
              className={`border ${m.borderColor} rounded-2xl p-6 hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-11 h-11 ${m.bgColor} ${m.textColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  {m.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold ${m.textColor} ${m.bgColor} px-2 py-0.5 rounded`}>
                      {m.abbr}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{m.name}</h3>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">{m.headline}</p>
                </div>
              </div>

              <p className="text-sm text-slate-500 leading-relaxed mb-4">{m.description}</p>

              {/* Benchmark bar */}
              <div className="mb-3">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>0</span>
                  <span className="text-slate-500 font-medium">Your benchmark: {m.benchmark}</span>
                  <span>100%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${m.accentColor} rounded-full w-3/4`} />
                </div>
              </div>

              {/* Insight tip */}
              <div className={`${m.bgColor} rounded-xl px-4 py-3 flex items-start gap-2`}>
                <svg className={`w-3.5 h-3.5 ${m.textColor} mt-0.5 flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className={`text-xs ${m.textColor} font-medium`}>{m.example}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
