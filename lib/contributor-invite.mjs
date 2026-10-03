/**
 * Una reinvitación no puede sustituir un auth_user_id ya vinculado.
 * La revocación del handle es otra acción: no pasa por este formulario.
 * @param {unknown} authUserId
 * @returns {"link" | "already_linked"}
 */
export function contributorInviteDecision(authUserId) {
  if (typeof authUserId === "string" && authUserId.trim() !== "") return "already_linked";
  return "link";
}
