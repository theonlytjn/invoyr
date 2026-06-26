import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import InviteAccept from "./InviteAccept";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "You've been invited" };

interface Props { params: Promise<{ token: string }> }

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const service = await createServiceClient();
  const user = await getUser();

  const { data: invite } = await service
    .from("org_invites")
    .select("*, organisations(name)")
    .eq("token", token)
    .is("accepted_at", null)
    .single();

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-neutral-950 dark:text-neutral-50">Invite not found</h1>
          <p className="text-neutral-500 text-sm">This invite link is invalid or has already been used.</p>
        </div>
      </div>
    );
  }

  const expired = new Date(invite.expires_at) < new Date();
  const orgName = (invite.organisations as { name: string } | null)?.name ?? "an organisation";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-neutral-950 dark:text-neutral-50">
            Join {orgName} on Invoyr
          </h1>
          <p className="text-sm text-neutral-500">
            You've been invited as a <span className="font-medium capitalize">{invite.role}</span>.
          </p>
        </div>

        <InviteAccept
          token={token}
          inviteEmail={invite.email}
          orgName={orgName}
          expired={expired}
          userEmail={user?.email ?? null}
          userId={user?.id ?? null}
        />
      </div>
    </div>
  );
}
