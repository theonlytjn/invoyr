import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin — Invoyr" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="flex h-dvh bg-neutral-100 dark:bg-neutral-950 overflow-hidden">
      <AdminSidebar />
      <AdminMobileNav />
      {/* pt-[57px] clears the fixed mobile header; the sidebar replaces it at lg. */}
      <main className="flex-1 overflow-y-auto overscroll-contain bg-white pt-[calc(57px+env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)] dark:bg-neutral-950 lg:pt-0 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
