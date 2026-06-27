import { MarketingShell } from "@/components/marketing/MarketingShell";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingLongform } from "@/components/landing/LandingLongform";
import { LandingPillars } from "@/components/landing/LandingPillars";
import { LandingAccess } from "@/components/landing/LandingAccess";

export function CorporateLanding() {
  return (
    <MarketingShell showFooter>
      <LandingHero />
      <LandingPillars />
      <LandingLongform />
      <LandingAccess />
    </MarketingShell>
  );
}