import Sidebar from "./Sidebar";
import type { Organisation } from "@/lib/supabase/types";

interface Props {
  org: Organisation | null;
  userEmail: string;
  children: React.ReactNode;
}

export default function AppShell({ org, userEmail, children }: Props) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar org={org} userEmail={userEmail} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
