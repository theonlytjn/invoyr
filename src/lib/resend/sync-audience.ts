import { getResend } from "./client";
import { createServiceClient } from "@/lib/supabase/server";

interface SyncContactOptions {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  userId?: string | null;
  subscribe: boolean;
}

export async function syncContactToAudience({
  email,
  firstName,
  lastName,
  userId,
  subscribe,
}: SyncContactOptions): Promise<void> {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const supabase = await createServiceClient();

  if (audienceId) {
    const resend = getResend();

    if (subscribe) {
      const { data } = await resend.contacts.create({
        audienceId,
        email,
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        unsubscribed: false,
      });

      await supabase
        .from("marketing_contacts")
        .upsert(
          {
            user_id: userId ?? null,
            email,
            first_name: firstName ?? null,
            last_name: lastName ?? null,
            resend_contact_id: data?.id ?? null,
            subscribed: true,
          },
          { onConflict: "email" }
        );
    } else {
      const { data: existing } = await supabase
        .from("marketing_contacts")
        .select("resend_contact_id")
        .eq("email", email)
        .single();

      if (existing?.resend_contact_id) {
        await resend.contacts.update({
          audienceId,
          id: existing.resend_contact_id,
          unsubscribed: true,
        });
      }

      await supabase
        .from("marketing_contacts")
        .update({ subscribed: false })
        .eq("email", email);
    }
  } else {
    await supabase
      .from("marketing_contacts")
      .upsert(
        {
          user_id: userId ?? null,
          email,
          first_name: firstName ?? null,
          last_name: lastName ?? null,
          subscribed: subscribe,
        },
        { onConflict: "email" }
      );
  }
}
