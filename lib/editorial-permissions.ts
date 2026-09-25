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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEditorialRole(value: unknown): value is EditorialRole {
  return value === "owner" || value === "moderator";
}

export function getActiveEditorialAccess(value: unknown): EditorialAccess | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.auth_user_id !== "string" ||
    !isEditorialRole(value.role) ||
    value.active !== true ||
    (value.display_name !== null && typeof value.display_name !== "string")
  ) {
    return null;
  }

  return {
    kind: "member",
    member: {
      auth_user_id: value.auth_user_id,
      role: value.role,
      active: true,
      display_name: value.display_name,
    },
  };
}

export function canReview(access: EditorialAccess | null): boolean {
  return access !== null;
}

export function canInvite(access: EditorialAccess | null): boolean {
  return access?.kind === "legacy" || access?.member.role === "owner";
}

export function canManageMembers(access: EditorialAccess | null): boolean {
  return access?.kind === "member" && access.member.role === "owner";
}
