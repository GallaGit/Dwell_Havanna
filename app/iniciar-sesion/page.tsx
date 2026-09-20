"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("El acceso no está configurado todavía.");
      return;
    }

    const requestedNext = new URLSearchParams(window.location.search).get("next");
    const next = requestedNext?.startsWith("/") ? requestedNext : "/contribuir";
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        shouldCreateUser: false,
      },
    });
    if (authError) {
      setError("No pudimos enviar el enlace. Confirma que recibiste una invitación.");
      return;
    }
    setMessage("Revisa tu email. El enlace de acceso es de un solo uso.");
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 md:px-10 pt-16 pb-16">
      <p className="meta-label mb-3">Colaboradores — Acceso privado</p>
      <h1 className="font-display text-5xl md:text-7xl leading-[0.95] max-w-3xl">
        Entra con tu <span className="italic font-normal">invitación</span>.
      </h1>
      <p className="mt-5 max-w-xl text-[15px] leading-7 text-charcoal/85">
        Dwell Havana no tiene registro público. Si el equipo editorial te invitó,
        escribe el email asociado para recibir un enlace seguro.
      </p>
      <form onSubmit={onSubmit} className="mt-10 max-w-md border-t rule pt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="meta-label">Email invitado</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="border border-line bg-transparent px-4 py-3 text-[15px] outline-none focus:border-ink"
          />
        </label>
        <button type="submit" className="w-fit text-sm bg-ink text-paper px-7 py-3 hover:opacity-80 transition">
          Enviar enlace
        </button>
        {message && <p className="border border-ink p-4 text-sm leading-6">{message}</p>}
        {error && <p className="border border-red-800/60 p-4 text-sm leading-6">{error}</p>}
      </form>
      <Link href="/contribuir" className="inline-block mt-8 text-sm underline underline-offset-4">
        Volver a contribuir
      </Link>
    </div>
  );
}
