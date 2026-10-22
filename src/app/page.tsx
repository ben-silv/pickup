import { SiteNav } from "@/components/landing/SiteNav";
import { Hero } from "@/components/landing/Hero";
import { ImageBand } from "@/components/landing/ImageBand";
import { CampusBlock, Faq, FinalCta, Footer, HowItWorks, Roles } from "@/components/landing/Sections";

export default function Home() {
  return (
    <>
      <SiteNav />
      <Hero />
      <main>
        <ImageBand />
        <HowItWorks />
        <Roles />
        <CampusBlock />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
