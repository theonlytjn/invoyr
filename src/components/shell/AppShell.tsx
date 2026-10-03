import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import type { Organisation } from "@/lib/supabase/types";

interface Props {
  org: Organisation | null;
  orgs: Organisation[];
  userEmail: string;
  plan?: string | null;
  trialDaysLeft?: number | null;
  isAdmin?: boolean;
  children: React.ReactNode;
}

/**
 * h-dvh rather than h-screen: on iOS, 100vh is the viewport height as if the
 * browser toolbars were hidden, so the bottom of every page sat behind them and
 * needed an over-scroll to reach. The main region's bottom padding clears the
 * fixed nav plus the home indicator.
 */
export default function AppShell({ org, orgs, userEmail, plan, trialDaysLeft, isAdmin, children }: Props) {
  return (
    <div className="flex h-dvh bg-neutral-100 dark:bg-neutral-950 overflow-hidden">
      <Sidebar org={org} orgs={orgs} userEmail={userEmail} plan={plan} trialDaysLeft={trialDaysLeft} isAdmin={isAdmin} />
      <main className="flex-1 overflow-y-auto overscroll-contain bg-white pb-[calc(4.5rem+env(safe-area-inset-bottom))] dark:bg-neutral-950 lg:pb-0">
        {children}
      </main>
      <MobileNav isAdmin={isAdmin} />
    </div>
  );
}
