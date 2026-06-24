import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin — Invoyr" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
