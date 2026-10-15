import LandingPage from "@/components/landing/LandingPage";
import GlobalActivity from "@/components/landing/GlobalActivity";

// Landing page is the same for every logged-out visitor, so it is cached and
// the live-activity feed refreshes every few minutes.
export const revalidate = 300;

export default function Page() {
  return (
    <LandingPage>
      <GlobalActivity />
    </LandingPage>
  );
}
