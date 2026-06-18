"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(
      form.get("email") as string,
      { redirectTo: `${window.location.origin}/auth/callback?next=/settings/account` }
    );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          {sent
            ? "Check your inbox for a reset link."
            : "Enter your email and we'll send you a reset link."}
        </CardDescription>
      </CardHeader>
      {!sent && (
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
            <p className="text-center text-sm text-gray-500">
              <Link href="/login" className="font-medium text-gray-900 hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
