import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";

// Buckets whose files live under `{org_id}/...`.
const ORG_BUCKETS = ["logos", "receipts", "attachments"] as const;

/** Deletes everything under `prefix` in a bucket, folders included. Returns an error message or null. */
async function removeFolder(client: SupabaseClient, bucket: string, prefix: string): Promise<string | null> {
  const { data: entries, error } = await client.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) return error.message;

  const files: string[] = [];
  for (const entry of entries ?? []) {
    const path = `${prefix}/${entry.name}`;
    // Folders come back without an id.
    if (entry.id === null) {
      const nestedError = await removeFolder(client, bucket, path);
      if (nestedError) return nestedError;
    } else {
      files.push(path);
    }
  }

  if (files.length) {
    const { error: removeError } = await client.storage.from(bucket).remove(files);
    if (removeError) return removeError.message;
  }

  // A full page may mean more remain; go round again until the folder is empty.
  // Only when this pass actually removed something, so a stubborn file can't loop forever.
  return (entries?.length ?? 0) >= 1000 && files.length ? removeFolder(client, bucket, prefix) : null;
}

const bodySchema = z.object({
  confirmation: z.literal("DELETE MY ACCOUNT"),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Type "DELETE MY ACCOUNT" to confirm.' },
      { status: 400 }
    );
  }

  const serviceClient = await createServiceClient();

  // Every step below is checked, and the login is deleted last and only if
  // everything before it succeeded. It used to be deleted regardless, which
  // could leave orgs, files or a live Stripe subscription behind with no way
  // for the person to sign back in and finish the job.
  const fail = (step: string, message?: string) => {
    console.error("account delete failed", { user_id: user.id, step, error: message });
    return NextResponse.json(
      { error: "We couldn't finish deleting your account. Nothing has been lost; please try again or contact support@invoyr.io." },
      { status: 500 }
    );
  };

  const { data: ownedOrgs, error: ownedError } = await serviceClient
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .eq("role", "owner");
  if (ownedError) return fail("read owned orgs", ownedError.message);

  // Check if any owned org has other members — if so, block deletion
  for (const { org_id } of ownedOrgs ?? []) {
    const { count, error } = await serviceClient
      .from("org_members")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org_id);
    if (error) return fail("count members", error.message);

    if ((count ?? 0) > 1) {
      return NextResponse.json(
        { error: "Transfer ownership or remove other team members before deleting your account." },
        { status: 409 }
      );
    }
  }

  for (const { org_id } of ownedOrgs ?? []) {
    // Cancel billing first. Deleting the org cascades away our subscription
    // row, but Stripe would carry on charging the card on file.
    const { data: sub, error: subError } = await serviceClient
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("org_id", org_id)
      .maybeSingle();
    if (subError) return fail("read subscription", subError.message);

    if (sub?.stripe_subscription_id && sub.status !== "canceled") {
      try {
        await getStripe().subscriptions.cancel(sub.stripe_subscription_id);
      } catch (err) {
        // Already cancelled in Stripe is fine; anything else stops the delete.
        const code = (err as { code?: string })?.code;
        if (code !== "resource_missing") return fail("cancel stripe subscription", (err as Error)?.message);
      }
    }

    for (const bucket of ORG_BUCKETS) {
      const filesError = await removeFolder(serviceClient, bucket, org_id);
      if (filesError) return fail(`remove ${bucket} files`, filesError);
    }

    // Cascades to all org-scoped data via FK.
    const { error: orgError } = await serviceClient.from("organisations").delete().eq("id", org_id);
    if (orgError) return fail("delete organisation", orgError.message);
  }

  // Remove from any remaining org memberships (as non-owner)
  const { error: membershipError } = await serviceClient.from("org_members").delete().eq("user_id", user.id);
  if (membershipError) return fail("remove memberships", membershipError.message);

  // Delete email preferences and marketing contacts
  const { error: prefsError } = await serviceClient.from("email_preferences").delete().eq("user_id", user.id);
  if (prefsError) return fail("delete email preferences", prefsError.message);
  const { error: contactsError } = await serviceClient.from("marketing_contacts").delete().eq("user_id", user.id);
  if (contactsError) return fail("delete marketing contact", contactsError.message);

  // Delete the auth user (must be service role)
  const { error: userError } = await serviceClient.auth.admin.deleteUser(user.id);
  if (userError) return fail("delete login", userError.message);

  // The user no longer exists; this just clears the session cookies.
  await supabase.auth.signOut().catch(() => null);

  return NextResponse.json({ ok: true });
}
