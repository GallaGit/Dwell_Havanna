"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { hasSupabaseAuthCookieInDocument } from "@/lib/auth-cookie";

function subscribe() {
  return () => {};
}

function signedInOnClient() {
  return hasSupabaseAuthCookieInDocument(document.cookie);
}

function signedInOnServer() {
  return false;
}

/**
 * El texto del enlace depende de una cookie. Se lee en el cliente para que
 * la portada siga siendo estática. La autorización real ocurre en
 * /contribuir y en POST /api/submissions.
 */
export default function ContributeLink() {
  const signedIn = useSyncExternalStore(subscribe, signedInOnClient, signedInOnServer);

  return (
    <Link
      href={signedIn ? "/contribuir" : "/iniciar-sesion?next=/contribuir"}
      className="mt-5 inline-flex border border-ink px-5 py-2.5 text-[13px] hover:bg-ink hover:text-paper transition-colors"
    >
      {signedIn ? "Contribute a story" : "Sign in to contribute"}
    </Link>
  );
}
