const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: "bg-violet-50 text-violet-600",
    title: "Asset-Level Insights",
    description:
      "AI breaks down each banner into its individual elements — text, images, CTA buttons, and layout — and scores each component's contribution to overall ad performance.",
    bullets: ["Text readability & tone analysis", "Image composition scoring", "CTA placement & color evaluation"],
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: "bg-indigo-50 text-indigo-600",
    title: "Predictive Performance",
    description:
      "Predict the effectiveness of your banner with over 90% accuracy before it goes live, dramatically reducing the need for costly traditional A/B testing.",
    bullets: ["Pre-launch CTR prediction", "Conversion rate forecasting", "Spend risk scoring"],
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    color: "bg-blue-50 text-blue-600",
    title: "Visual & Text Analysis",
    description:
      "Deep analysis of color contrast, font choices, image composition, and emotional tone. Identifies specific visual cues — like human faces or CTA colors — that boost CTR.",
    bullets: ["Color contrast & palette scoring", "Font legibility analysis", "Emotional resonance detection"],
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: "bg-emerald-50 text-emerald-600",
    title: "Contextual Relevance",
    description:
      "Ensures your ad aligns with your target audience and brand identity, preventing generic or off-brand content while guaranteeing brand safety across all placements.",
    bullets: ["Brand safety verification", "Audience alignment scoring", "Tone & identity consistency check"],
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    color: "bg-orange-50 text-orange-600",
    title: "Automated A/B Testing",
    description:
      "Generate dozens of ad variations — different headlines, backgrounds, and CTA buttons — simultaneously. AI identifies the best-performing combinations in real-time.",
    bullets: ["Bulk variant generation", "Real-time performance comparison", "Auto-select winning creative"],
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    color: "bg-pink-50 text-pink-600",
    title: "Brand Consistency",
    description:
      "Maintain brand kits so every AI-generated and analyzed ad automatically follows your company logos, color palettes, and typography guidelines.",
    bullets: ["Brand kit enforcement", "Logo placement validation", "Color & font compliance scoring"],
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold text-violet-600 uppercase tracking-widest">Key Features</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Everything You Need to Win at Creative
          </h2>
          <p className="mt-4 text-slate-500 text-lg leading-relaxed">
            Our AI engine dissects every element of your ad creative and delivers actionable insights that move the needle on real business metrics.
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-1 transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                {f.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">{f.description}</p>
              <ul className="space-y-1.5">
                {f.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs text-slate-600">
                    <svg className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
