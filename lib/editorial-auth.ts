import { getServiceClient } from "@/lib/db";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export type EditorialRole = "owner" | "moderator";

export type EditorialMember = {
  auth_user_id: string;
  role: EditorialRole;
  active: boolean;
  display_name: string | null;
};

export type EditorialAccess =
  | { kind: "member"; member: EditorialMember }
  | { kind: "legacy"; member: null };

const LEGACY_COOKIE = "dh_admin";

function isEditorialRole(value: unknown): value is EditorialRole {
  return value === "owner" || value === "moderator";
}

export async function getEditorialAccess(): Promise<EditorialAccess | null> {
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    const db = getServiceClient();

    if (user && db) {
      const { data: member } = await db
        .from("editorial_members")
        .select("auth_user_id, role, active, display_name")
        .eq("auth_user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      if (member && isEditorialRole(member.role) && member.active === true) {
        return { kind: "member", member: member as EditorialMember };
      }
    }
  }

  const token = process.env.ADMIN_TOKEN;
  if (!token) return null;
  const store = await cookies();
  return store.get(LEGACY_COOKIE)?.value === token
    ? { kind: "legacy", member: null }
    : null;
}

export function canReview(access: EditorialAccess | null): boolean {
  return access !== null;
}

export function canInvite(access: EditorialAccess | null): boolean {
  return access?.kind === "legacy" || access?.member.role === "owner";
}
