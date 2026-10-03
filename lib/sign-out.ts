"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { endSession } from "@/lib/session-end";

export async function signOutAction(): Promise<void> {
  const store = await cookies();
  const names = store.getAll().map((cookie) => cookie.name);
  const supabase = await getSupabaseServerClient();
  await endSession({
    cookieNames: names,
    deleteCookie: (name) => {
      store.delete(name);
    },
    signOutAuth: async () => {
      if (!supabase) return;
      await supabase.auth.signOut();
    },
  });
  redirect("/");
}
