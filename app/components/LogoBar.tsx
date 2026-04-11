const brands = [
  "Meta Ads",
  "Google Ads",
  "TikTok Ads",
  "LinkedIn Ads",
  "Pinterest",
  "Snapchat",
  "YouTube",
  "Amazon DSP",
];

export default function LogoBar() {
  return (
    <section className="py-10 bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
          Works with all major ad platforms
        </p>
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
          {brands.map((brand) => (
            <span
              key={brand}
              className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-default"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
