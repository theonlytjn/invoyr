"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: form.get("email") as string,
      password: form.get("password") as string,
      options: {
        data: { full_name: form.get("name") as string },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-950">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 14.5C5 14.5 6.5 14.5 8.5 18C8.5 18 14.0588 8.83333 19 7"/>
            </svg>
          </div>
          <h1 className="text-2xl font-serif text-neutral-950 mb-2">Check your email</h1>
          <p className="text-sm text-neutral-500">
            We sent a confirmation link to your inbox. Click it to activate your account.
          </p>
          <Link href="/login" className="mt-6 inline-block text-sm font-medium text-neutral-950 underline underline-offset-4">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Left: form */}
      <div className="relative flex w-full flex-col lg:w-1/2">
        <header className="flex items-center justify-between px-8 py-6">
          <Link href="/">
            <Image src="/main-logo.svg" alt="Invoyr" width={110} height={34} priority />
          </Link>
          <Link href="mailto:hello@invoyr.io" className="text-sm text-neutral-500 hover:text-neutral-950 transition-colors">
            Need help?
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-8">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-3xl font-serif text-neutral-950 mb-2">Create your account</h1>
              <p className="text-sm text-neutral-500">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-neutral-950 underline underline-offset-4 hover:no-underline">
                  Sign in
                </Link>
              </p>
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-950 hover:bg-neutral-50 transition-colors mb-6"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-neutral-100 px-4 text-xs text-neutral-500">or sign up with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-sm font-medium text-neutral-950">Full name</label>
                <input
                  id="name"
                  name="name"
                  placeholder="Jane Smith"
                  required
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#0a0a0a] transition-shadow"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-neutral-950">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#0a0a0a] transition-shadow"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-neutral-950">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    minLength={8}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 pr-10 text-sm text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#0a0a0a] transition-shadow"
                  />
                  {password && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
                    </button>
                  )}
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {loading ? "Creating account…" : "Create account"}
              </button>

              <p className="text-center text-xs text-neutral-500">
                By signing up you agree to our{" "}
                <Link href="/terms" className="underline underline-offset-2">Terms</Link> and{" "}
                <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
              </p>
            </form>
          </div>
        </div>

        <footer className="px-8 py-6">
          <p className="text-xs text-neutral-500 text-center">
            &copy; {new Date().getFullYear()} Invoyr. All rights reserved.
          </p>
        </footer>
      </div>

      {/* Right: dark panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-neutral-950 p-24 overflow-hidden">
        <div className="max-w-md pt-8">
          <h2 className="text-5xl font-serif text-white leading-tight mb-4">
            Start sending professional invoices today
          </h2>
          <p className="text-lg text-neutral-400">
            Join businesses using Invoyr to manage clients, send invoices, and accept payments online.
          </p>
        </div>

        <div className="space-y-6">
          {[
            "Send invoices via email or payment link",
            "Accept card payments via Stripe Connect",
            "Automatic overdue reminders",
            "PDF downloads and branded templates",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <span className="text-sm text-neutral-400">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
