const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Perfect for freelancers and small teams testing the waters.",
    cta: "Start Free",
    ctaStyle: "border border-slate-200 text-slate-900 hover:bg-slate-50",
    features: [
      "10 analyses per month",
      "Hook Rate & CTR scoring",
      "Basic improvement suggestions",
      "PNG / JPG uploads",
      "Email support",
    ],
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$49",
    period: "/month",
    description: "For growing teams that run regular ad campaigns.",
    cta: "Start 14-day Trial",
    ctaStyle: "bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-200",
    features: [
      "200 analyses per month",
      "Full 4-metric scoring",
      "AI variant generation (5/analysis)",
      "Brand kit upload",
      "Bulk upload support",
      "CSV export",
      "Priority email support",
    ],
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Scale",
    price: "$149",
    period: "/month",
    description: "For agencies and performance marketing teams at scale.",
    cta: "Start 14-day Trial",
    ctaStyle: "border border-slate-200 text-slate-900 hover:bg-slate-50",
    features: [
      "Unlimited analyses",
      "Full 4-metric scoring",
      "AI variant generation (20/analysis)",
      "Multi-brand kit support",
      "API access",
      "Ad platform integrations",
      "Dedicated account manager",
      "SSO & team roles",
    ],
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold text-violet-600 uppercase tracking-widest">Pricing</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-slate-500 text-lg">
            Start free. Scale when you&apos;re ready. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-7 ${
                plan.highlighted
                  ? "bg-white border-2 border-violet-500 shadow-2xl shadow-violet-100"
                  : "bg-white border border-slate-100 shadow-sm"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  {plan.period && <span className="text-slate-400 text-sm mb-1">{plan.period}</span>}
                </div>
                <p className="text-sm text-slate-500 mt-2">{plan.description}</p>
              </div>

              <a
                href="#get-started"
                className={`block w-full text-center py-3 rounded-xl text-sm font-semibold transition-colors mb-7 ${plan.ctaStyle}`}
              >
                {plan.cta}
              </a>

              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <svg className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-400 mt-8">
          All plans include a 14-day free trial · Cancel anytime · GDPR & SOC 2 compliant
        </p>
      </div>
    </section>
  );
}
