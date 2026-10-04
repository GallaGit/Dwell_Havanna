import "server-only";
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

export async function getEditorialAccess(): Promise<EditorialAccess | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    const db = getServiceClient();
    if (!user || !db) return null;

    const { data: member } = await db
      .from("editorial_members")
      .select("auth_user_id, role, active, display_name")
      .eq("auth_user_id", user.id)
      .eq("active", true)
      .maybeSingle();

    return getActiveEditorialAccess(member);
  } catch {
    // Timeout u otro fallo de red: sin miembro no hay acceso editorial.
    return null;
  }
}

export { canInvite, canManageMembers, canReview };
export type { EditorialAccess, EditorialMember, EditorialRole };
