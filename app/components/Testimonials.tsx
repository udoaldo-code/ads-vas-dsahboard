const testimonials = [
  {
    quote:
      "We cut our creative testing cycle from 3 weeks to 3 days. The predictive CTR scores are eerily accurate — we now pre-approve creatives based on the AI score alone.",
    author: "Sarah K.",
    role: "Head of Performance Marketing",
    company: "TechStartup Co.",
    initials: "SK",
    color: "bg-violet-100 text-violet-700",
  },
  {
    quote:
      "The asset-level breakdown is a game changer. I can tell my designers exactly which element is dragging performance down and why. No more guesswork, just data.",
    author: "Marcus R.",
    role: "Creative Director",
    company: "Digital Agency",
    initials: "MR",
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    quote:
      "We saw a 2.4× improvement in CTR within the first month just by applying the AI's CTA color and placement recommendations. ROI on this tool is massive.",
    author: "Priya L.",
    role: "Paid Social Manager",
    company: "E-commerce Brand",
    initials: "PL",
    color: "bg-blue-100 text-blue-700",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-xs font-semibold text-violet-600 uppercase tracking-widest">Testimonials</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Loved by Performance Marketers
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.author} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <blockquote className="text-sm text-slate-600 leading-relaxed mb-5">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{t.author}</div>
                  <div className="text-xs text-slate-400">{t.role} · {t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
