import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import { LandingTracker } from "./components/LandingTracker";
import DashboardPreview from "./components/DashboardPreview";
import StatsBar from "./components/StatsBar";
import HowItWorks from "./components/HowItWorks";
import LiveDemo from "./components/LiveDemo";
import Features from "./components/Features";
import ComparisonTable from "./components/ComparisonTable";
import Pricing from "./components/Pricing";
import FAQ from "./components/FAQ";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";
import ExitIntentPopup from "./components/ExitIntentPopup";
import FounderStory from "./components/FounderStory";

export default function Home() {
  return (
    <>
      <LandingTracker />
      <Navbar />
      <main>
        <Hero />
        <StatsBar />
        <FounderStory />
        <DashboardPreview />
        <HowItWorks />
        <div id="demo">
          <LiveDemo />
        </div>
        <Features />
        <ComparisonTable />
        <Pricing />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
      <ExitIntentPopup />
    </>
  );
}
