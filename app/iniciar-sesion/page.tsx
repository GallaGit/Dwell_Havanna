"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setEmailError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setEmailError("Enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError("Enter a valid email address, for example name@example.com.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Access is not configured yet.");
      return;
    }

    const requestedNext = new URLSearchParams(window.location.search).get("next");
    const next = safeRedirectPath(requestedNext, window.location.origin);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        shouldCreateUser: false,
      },
    });
    if (authError) {
      setError("We could not send the link. Confirm that this email was invited and check that it is spelled correctly.");
      return;
    }
    setMessage("Check your inbox and spam folder. The sign-in link can only be used once. If it expires, request a new one here.");
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 md:px-10 pt-16 pb-16">
      <p className="meta-label mb-3">Contributors — Private access</p>
      <h1 className="font-display text-5xl md:text-7xl leading-[0.95] max-w-3xl">
        Enter with your <span className="italic font-normal">invitation</span>.
      </h1>
      <p className="mt-5 max-w-xl text-[15px] leading-7 text-charcoal/85">
         Dwell Havana has no public sign-up. If the editorial team invited you,
         enter the associated email to receive a secure link. The link works once
         and must be opened in the browser where you want to work.
      </p>
      <form onSubmit={onSubmit} className="mt-10 max-w-md border-t rule pt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-2">
           <span className="meta-label">Invited email</span>
          <input
            required
            type="email"
           value={email}
           onChange={(event) => setEmail(event.target.value)}
           onBlur={() => {
             if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) setEmailError("Enter a valid email address, for example name@example.com.");
           }}
           aria-invalid={Boolean(emailError)}
           aria-describedby={emailError ? "email-error" : undefined}
            autoComplete="email"
            className="border border-line bg-transparent px-4 py-3 text-[15px] outline-none focus:border-ink"
         />
         {emailError && <p id="email-error" role="alert" className="text-sm text-red-900">{emailError}</p>}
        </label>
        <button type="submit" className="w-fit text-sm bg-ink text-paper px-7 py-3 hover:opacity-80 transition">
           Send sign-in link
        </button>
        {message && <p className="border border-ink p-4 text-sm leading-6">{message}</p>}
        {error && <p className="border border-red-800/60 p-4 text-sm leading-6">{error}</p>}
      </form>
      <Link href="/contribuir" className="inline-block mt-8 text-sm underline underline-offset-4">
         Back to contributing
      </Link>
    </div>
  );
}
