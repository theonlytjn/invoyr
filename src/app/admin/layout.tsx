import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin — Invoyr" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="flex h-screen bg-neutral-100 dark:bg-neutral-950 overflow-hidden">
      <AdminSidebar />
      <AdminMobileNav />
      {/* pt-[57px] clears the fixed mobile header; the sidebar replaces it at lg. */}
      <main className="flex-1 overflow-y-auto bg-white pt-[57px] dark:bg-neutral-950 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
