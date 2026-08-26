import Benefits from "../components/Benefits";
import BlogGuides from "../components/BlogGuides";
import DestinationsGrid from "../components/DestinationsGrid";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import Newsletter from "../components/Newsletter";
import OffersHighlight from "../components/OffersHighlight";
import PromoBar from "../components/PromoBar";
import Testimonials from "../components/Testimonials";
import WhyChooseUs from "../components/WhyChooseUs";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <PromoBar />
      <Navbar />
      <Hero />
      <Benefits />
      <DestinationsGrid />
      <OffersHighlight />
      <WhyChooseUs />
      <Testimonials />
      <BlogGuides />

      <div className="bg-card">
        <Newsletter />
      </div>

      <Footer />
    </div>
  );
}