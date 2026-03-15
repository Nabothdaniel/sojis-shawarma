import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import PlatformsSection from '@/components/sections/PlatformsSection';
import AboutSection from '@/components/sections/AboutSection';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
import SupportSection from '@/components/sections/SupportSection';
import CTASection from '@/components/sections/CTASection';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <PlatformsSection />
        <AboutSection />
        <HowItWorksSection />
        <SupportSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
