import { NavSite } from "@/components/site/NavSite";
import { FooterSite } from "@/components/site/FooterSite";
import { ROICalculator } from "@/components/site/ROICalculator";

export default function SiteROICalculator() {
  return (
    <div className="min-h-screen">
      <NavSite />
      
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <ROICalculator />
        </div>
      </section>

      <FooterSite />
    </div>
  );
}
