import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import LogoBar from "./components/LogoBar";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import AnalyzerDemo from "./components/AnalyzerDemo";
import Metrics from "./components/Metrics";
import Testimonials from "./components/Testimonials";
import Pricing from "./components/Pricing";
import CTA from "./components/CTA";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <LogoBar />
        <Features />
        <HowItWorks />
        <AnalyzerDemo />
        <Metrics />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
