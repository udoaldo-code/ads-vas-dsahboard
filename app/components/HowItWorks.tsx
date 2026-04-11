const steps = [
  {
    step: "01",
    title: "Upload Your Creative",
    description:
      "Drag and drop your banner, ad image, or video asset. Supports all major formats: JPEG, PNG, GIF, MP4, HTML5. Connect directly from Google Drive, Dropbox, or your ad manager.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "AI Runs Deep Analysis",
    description:
      "Our models scan every layer of your creative in seconds — visual composition, color psychology, copy effectiveness, CTA strength, audience alignment, and brand safety.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Get Actionable Insights",
    description:
      "Receive a detailed performance score with element-level breakdowns. See exactly which parts of your creative to change, why, and what impact that change is expected to make.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    step: "04",
    title: "Optimize & Launch",
    description:
      "Apply recommended changes or let AI auto-generate improved variants. Compare side-by-side, pick your winner, and export directly to your preferred ad platform — all in one workflow.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3l14 9-14 9V3z" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold text-violet-600 uppercase tracking-widest">How It Works</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            From Upload to Insight in Seconds
          </h2>
          <p className="mt-4 text-slate-500 text-lg leading-relaxed">
            A simple four-step workflow that replaces weeks of manual testing with AI-driven clarity.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line — desktop */}
          <div className="hidden lg:block absolute top-14 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={s.step} className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                {/* Step number + icon */}
                <div className="relative mb-5">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-md shadow-slate-100 border border-slate-100 flex items-center justify-center text-violet-600">
                    {s.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 text-[10px] font-bold bg-violet-600 text-white w-5 h-5 rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 text-center">
          <a
            href="#get-started"
            className="inline-flex items-center gap-2 bg-violet-600 text-white px-7 py-3.5 rounded-xl font-semibold text-sm hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200"
          >
            Try It Free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
