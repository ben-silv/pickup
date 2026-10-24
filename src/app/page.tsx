import { SiteNav } from "@/components/landing/SiteNav";
import { Hero } from "@/components/landing/Hero";
import { ImageBand } from "@/components/landing/ImageBand";
import { CampusBlock, Faq, FinalCta, Footer, HowItWorks, Roles } from "@/components/landing/Sections";
import { getUser } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";

export default async function Home() {
  // Signed-in visitors get "Browse open roles" instead of the join buttons.
  const signedIn = supabaseConfigured() ? Boolean(await getUser()) : false;
  return (
    <>
      <SiteNav />
      <Hero signedIn={signedIn} />
      <main>
        <ImageBand />
        <HowItWorks />
        <Roles />
        <CampusBlock />
        <Faq />
        <FinalCta signedIn={signedIn} />
      </main>
      <Footer />
    </>
  );
}
