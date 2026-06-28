"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OrgMemberWithProfile, OrgInvite } from "@/lib/supabase/types";

const ROLE_LABELS: Record<string, string> = { owner: "Owner", admin: "Admin", member: "Member" };

interface Props {
  members: OrgMemberWithProfile[];
  invites: OrgInvite[];
  currentUserId: string;
  currentUserRole: string;
  memberCap?: number;
}

export default function TeamPanel({ members, invites, currentUserId, currentUserRole, memberCap = Infinity }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteSent, setInviteSent] = useState(false);

  const isOwnerOrAdmin = ["owner", "admin"].includes(currentUserRole);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInviteSent(false);
    startTransition(async () => {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Something went wrong.");
        return;
      }
      setInviteEmail("");
      setInviteSent(true);
      router.refresh();
    });
  }

  function handleRemoveMember(id: number) {
    if (!confirm("Remove this member from your team?")) return;
    startTransition(async () => {
      await fetch(`/api/team/members/${id}`, { method: "DELETE" });
      router.refresh();
    });
  }

  function handleChangeRole(id: number, role: string) {
    startTransition(async () => {
      await fetch(`/api/team/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      router.refresh();
    });
  }

  function handleRevokeInvite(id: string) {
    startTransition(async () => {
      await fetch(`/api/team/invite/${id}`, { method: "DELETE" });
      router.refresh();
    });
  }

  const pendingInvites = invites.filter((i) => !i.accepted_at && new Date(i.expires_at) > new Date());

  return (
    <div className="space-y-6">
      {/* Current members */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="font-semibold text-neutral-950 dark:text-neutral-50">Team members</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800">
              <th className="text-left py-3 px-5 text-xs text-neutral-400 uppercase tracking-wider">Name</th>
              <th className="text-left py-3 px-4 text-xs text-neutral-400 uppercase tracking-wider">Role</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {members.map((m) => {
              const isSelf = m.user_id === currentUserId;
              return (
                <tr key={m.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="py-3 px-5 text-neutral-950 dark:text-neutral-50">
                    <div>{m.profiles?.full_name ?? "—"}</div>
                    <div className="text-xs text-neutral-400">{m.users?.email ?? ""}</div>
                  </td>
                  <td className="py-3 px-4">
                    {currentUserRole === "owner" && !isSelf && m.role !== "owner" ? (
                      <Select
                        value={m.role}
                        onValueChange={(v) => handleChangeRole(m.id, v)}
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-7 text-xs w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-neutral-600 dark:text-neutral-400 text-xs capitalize">
                        {ROLE_LABELS[m.role] ?? m.role}
                        {isSelf && <span className="ml-1.5 text-neutral-400">(you)</span>}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {(isSelf || (isOwnerOrAdmin && m.role !== "owner")) && (
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        disabled={isPending}
                        className="text-xs text-neutral-400 hover:text-red-600 transition-colors"
                      >
                        {isSelf ? "Leave" : "Remove"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="font-semibold text-neutral-950 dark:text-neutral-50">Pending invites</h2>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {pendingInvites.map((inv) => (
                <tr key={inv.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="py-3 px-5 text-neutral-950 dark:text-neutral-50">{inv.email}</td>
                  <td className="py-3 px-4 text-xs text-neutral-400 capitalize">{ROLE_LABELS[inv.role] ?? inv.role}</td>
                  <td className="py-3 px-4 text-xs text-neutral-400">
                    Expires {new Date(inv.expires_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isOwnerOrAdmin && (
                      <button
                        onClick={() => handleRevokeInvite(inv.id)}
                        disabled={isPending}
                        className="text-xs text-neutral-400 hover:text-red-600 transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite form */}
      {isOwnerOrAdmin && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold text-neutral-950 dark:text-neutral-50">Invite a team member</h2>
            {memberCap !== Infinity && (
              <span className="text-sm text-neutral-500">{members.length} / {memberCap} seats used</span>
            )}
          </div>
          {members.length >= memberCap && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-400">
              You&apos;ve reached your {memberCap}-seat limit. <a href="/settings/billing" className="underline font-medium">Upgrade to Pro</a> for unlimited members.
            </div>
          )}
          <form onSubmit={handleInvite} className="flex gap-3 items-end">
            <div className="space-y-1.5 flex-1">
              <Label>Email address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
              />
            </div>
            <div className="space-y-1.5 w-36">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isPending || !inviteEmail || members.length >= memberCap}>
              {isPending ? "Sending…" : "Send invite"}
            </Button>
          </form>
          {inviteSent && <p className="text-sm text-green-600">Invite sent!</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-xs text-neutral-400">
            Admins can invite members and manage invoices. Members can view and create invoices.
          </p>
        </div>
      )}
    </div>
  );
}
