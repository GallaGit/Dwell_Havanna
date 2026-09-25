import { getServiceClient } from "@/lib/db";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  canInvite,
  canManageMembers,
  canReview,
  getActiveEditorialAccess,
  type EditorialAccess,
  type EditorialMember,
  type EditorialRole,
} from "@/lib/editorial-permissions";
import { cookies } from "next/headers";

const LEGACY_COOKIE = "dh_admin";

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

      const access = getActiveEditorialAccess(member);
      if (access) return access;
    }
  }

  const token = process.env.ADMIN_TOKEN;
  if (!token) return null;
  const store = await cookies();
  return store.get(LEGACY_COOKIE)?.value === token
    ? { kind: "legacy", member: null }
    : null;
}

export { canInvite, canManageMembers, canReview };
export type { EditorialAccess, EditorialMember, EditorialRole };
