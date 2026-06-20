import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import Topbar from "@/components/shell/Topbar";
import ChangePasswordForm from "@/components/settings/ChangePasswordForm";
import DeleteAccountForm from "@/components/settings/DeleteAccountForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings — Account" };

export default async function AccountSettingsPage() {
  await requireOrg();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      {/* Change password */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Change password</h2>
          <p className="text-sm text-gray-500 mt-1">
            Choose a strong password of at least 8 characters.
          </p>
        </div>
        <ChangePasswordForm />
      </div>

      {/* Data export */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Export your data</h2>
          <p className="text-sm text-gray-500 mt-1">
            Download a JSON file containing all your account data — profile, organisations, clients,
            invoices, payments and email history.
          </p>
        </div>
        <a
          href="/api/account/export"
          download
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Download data export
        </a>
      </div>

      {/* Delete account */}
      <div className="bg-white rounded-xl border border-red-100 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-red-700">Delete account</h2>
          <p className="text-sm text-gray-500 mt-1">
            Permanently delete your account and all associated data. This cannot be undone.
            If you own an organisation, it and all its data will be deleted too.
          </p>
        </div>
        <DeleteAccountForm email={user?.email ?? ""} />
      </div>
    </div>
  );
}
