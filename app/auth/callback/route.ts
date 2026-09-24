import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const destination = next?.startsWith("/") ? next : "/contribuir";
  const supabase = await getSupabaseServerClient();
  let signedIn = false;

  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    signedIn = !error;
  }

  const destinationUrl = new URL(destination, url.origin);
  if (signedIn) destinationUrl.searchParams.set("welcome", "1");
  return NextResponse.redirect(destinationUrl);
}
