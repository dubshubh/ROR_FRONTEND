import type { Metadata } from "next";
import { Camera } from "lucide-react";
import { PhotographyGallery } from "@/components/photography/photography-gallery";
import { PublicHeader } from "@/components/layout/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { loadPublicContent } from "@/lib/public-content";

export const metadata: Metadata = { title: "Road Photography", description: "Immersive photos and films from Rebels on Roads rides, events, and community stories." };

export default async function PhotographyPage() {
  const content = await loadPublicContent();
  return <main className="photography-page min-h-screen overflow-hidden bg-[#070707]"><PublicHeader />
    <section className="photo-archive" id="road-archive">
      <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
        <div className="photo-minimal-heading"><Camera className="h-4 w-4" /><h1>Road Archive</h1><span>Photos · Films</span></div>
        <div className="mt-5"><PhotographyGallery items={content.photos} /></div>
      </div>
    </section>
    <SiteFooter />
  </main>;
}
