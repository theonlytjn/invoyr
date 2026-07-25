import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import type { Organisation } from "@/lib/supabase/types";

interface Props {
  org: Organisation | null;
  orgs: Organisation[];
  userEmail: string;
  plan?: string | null;
  isAdmin?: boolean;
  children: React.ReactNode;
}

export default function AppShell({ org, orgs, userEmail, plan, isAdmin, children }: Props) {
  return (
    <div className="flex h-screen bg-neutral-100 dark:bg-neutral-950 overflow-hidden">
      <Sidebar org={org} orgs={orgs} userEmail={userEmail} plan={plan} isAdmin={isAdmin} />
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0 bg-white dark:bg-neutral-950">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
