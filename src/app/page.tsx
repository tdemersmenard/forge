import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import DashboardPreview from "./components/DashboardPreview";
import StatsBar from "./components/StatsBar";
import Features from "./components/Features";
import Pricing from "./components/Pricing";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <DashboardPreview />
        <StatsBar />
        <Features />
        <Pricing />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
