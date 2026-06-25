import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import type { Organisation } from "@/lib/supabase/types";

interface Props {
  org: Organisation | null;
  userEmail: string;
  plan?: string | null;
  children: React.ReactNode;
}

export default function AppShell({ org, userEmail, plan, children }: Props) {
  return (
    <div className="flex h-screen bg-neutral-100 dark:bg-neutral-950 overflow-hidden">
      <Sidebar org={org} userEmail={userEmail} plan={plan} />
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0 bg-white dark:bg-neutral-950">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
