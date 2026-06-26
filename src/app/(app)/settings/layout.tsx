import { type ReactNode } from "react";
import Topbar from "@/components/shell/Topbar";
import SettingsNav from "@/components/settings/SettingsNav";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <Topbar title="Settings" />
      <SettingsNav />
      <div className="p-4 sm:p-6 max-w-2xl">{children}</div>
    </div>
  );
}
