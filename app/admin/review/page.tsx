import Image from "next/image";
import { revalidatePath, updateTag } from "next/cache";
import { SignOutButton } from "@/components/SignOutButton";
import { PUBLISHED_CONTENT_TAG } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  INVITE_ACTOR_LIMIT,
  INVITE_ACTOR_WINDOW_SECONDS,
  consumeRateLimit,
  hashRateLimitSubject,
  rateLimitFailure,
  rateLimitKey,
} from "@/lib/rate-limit";
import { contributorInviteDecision } from "@/lib/contributor-invite.mjs";
import { resolveInviteOrigin } from "@/lib/site";
import { getServiceClient } from "@/lib/db";
import { JpegProcessingError, stripJpegMetadata } from "@/lib/jpeg-metadata";
import {
  locateStoredObject,
  PRIVATE_BUCKET,
  publishTarget,
  removalTarget,
  SIGNED_URL_TTL_SECONDS,
} from "@/lib/submission-media.mjs";
import { ModerationDecision } from "./ModerationDecision";
import {
  canInvite,
  canManageMembers,
  canReview,
  getEditorialAccess,
  type EditorialAccess,
  type EditorialMember,
} from "@/lib/editorial-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminInviteRedirect(status: string): never {
  redirect(`/admin/review?invite=${encodeURIComponent(status)}`);
}

async function enforceInviteRateLimit(
  db: NonNullable<ReturnType<typeof getServiceClient>>,
  actorId: string,
): Promise<void> {
  const failure = rateLimitFailure([
    await consumeRateLimit(
      db,
      rateLimitKey("invite:actor", hashRateLimitSubject(actorId)),
      INVITE_ACTOR_LIMIT,
      INVITE_ACTOR_WINDOW_SECONDS,
    ),
  ]);
  if (failure === "rate_limited") adminInviteRedirect("rate-limited");
  if (failure === "rate_limit_unavailable") adminInviteRedirect("rate-unavailable");
}

async function recordModerationEvent(
  db: NonNullable<ReturnType<typeof getServiceClient>>,
  access: EditorialAccess,
  action:
    | "invite_contributor"
    | "approve_submission"
    | "reject_submission"
    | "invite_editorial_member"
    | "change_editorial_role"
    | "change_editorial_status",
  details: { submissionId?: string; targetHandle?: string; metadata?: Record<string, string> },
): Promise<void> {
  await db.from("moderation_events").insert({
    actor_user_id: access.member.auth_user_id,
    actor_source: "auth",
    action,
    submission_id: details.submissionId ?? null,
    target_handle: details.targetHandle ?? null,
    metadata: details.metadata ?? {},
  });
}

type Submission = {
  id: string;
  author_handle: string;
  image_url: string;
  caption_raw: string;
  source: string;
  created_at: string;
};

async function decide(formData: FormData): Promise<void> {
  "use server";
  const access = await getEditorialAccess();
  if (!canReview(access) || !access) return;
  const db = getServiceClient();
  if (!db) return;

  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!id) return;

  if (action === "reject") {
    const { data: pendingRow } = await db
      .from("submissions")
      .select("id,image_url")
      .eq("id", id)
      .eq("status", "pending")
      .maybeSingle();
    if (!pendingRow) return;

    const target = removalTarget(pendingRow.image_url);
    if (target) {
      const { error: removeError } = await db.storage.from(target.bucket).remove([target.path]);
      if (removeError) return;
    }

    const { data: rejected } = await db
      .from("submissions")
      .update({ status: "rejected" })
      .eq("id", id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (rejected) {
      await recordModerationEvent(db, access, "reject_submission", { submissionId: id });
    }
  } else if (action === "approve") {
    const { data: sub } = await db
      .from("submissions")
      .select("id,image_url,caption_raw")
      .eq("id", id)
      .eq("status", "pending")
      .single();
    if (!sub) return;

    const target = publishTarget(sub.image_url);
    if (!target) return;
    const downloaded = await db.storage.from(target.fromBucket).download(target.fromPath);
    if (downloaded.error || !downloaded.data) return;

    let publishedBytes: Buffer;
    try {
      publishedBytes = await stripJpegMetadata(new Uint8Array(await downloaded.data.arrayBuffer()));
    } catch (error) {
      if (error instanceof JpegProcessingError) return;
      return;
    }

    const { error: uploadError } = await db.storage
      .from(target.toBucket)
      .upload(target.toPath, publishedBytes, { contentType: "image/jpeg", upsert: false });
    if (uploadError) return;

    const { data: publishedUrl } = db.storage.from(target.toBucket).getPublicUrl(target.toPath);
    const firstLine =
      sub.caption_raw.split("\n").find((l: string) => l.trim()) ?? "";
    const slug = `community-${sub.id.slice(0, 8)}`;
    const { error: draftError } = await db.from("journal_posts").insert({
      slug,
      title: firstLine.slice(0, 90) || "Envío de la comunidad",
      category: "Community",
      excerpt: sub.caption_raw.slice(0, 220),
      image: publishedUrl.publicUrl,
      date_label: new Date().toLocaleDateString("es", { month: "long", year: "numeric" }),
      reading_time: "3 min",
      status: "published",
      published_at: new Date().toISOString(),
    });
    if (draftError) {
      await db.storage.from(target.toBucket).remove([target.toPath]);
      return;
    }
    const { data: approved } = await db
      .from("submissions")
      .update({ status: "approved", image_url: publishedUrl.publicUrl })
      .eq("id", id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (!approved) {
      await db.storage.from(target.toBucket).remove([target.toPath]);
      return;
    }
    await db.storage.from(target.fromBucket).remove([target.fromPath]);
    await recordModerationEvent(db, access, "approve_submission", { submissionId: id });
  }
  revalidatePath("/admin/review");
  if (action === "approve") {
    updateTag(PUBLISHED_CONTENT_TAG);
    revalidatePath("/");
    revalidatePath("/journal");
    revalidatePath(`/journal/community-${id.slice(0, 8)}`);
    revalidatePath("/feed.xml");
    revalidatePath("/sitemap.xml");
  }
}

async function inviteContributor(formData: FormData): Promise<void> {
  "use server";
  const access = await getEditorialAccess();
  if (!canInvite(access) || !access) return;
  const db = getServiceClient();
  if (!db) return;
  await enforceInviteRateLimit(db, access.member.auth_user_id);

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const handle = String(formData.get("handle") ?? "").trim();
  if (!email || !handle || !email.includes("@")) return;

  const { data: contributor } = await db
    .from("verified_contributors")
    .select("handle, auth_user_id")
    .eq("handle", handle)
    .maybeSingle();
  if (!contributor) {
    adminInviteRedirect("contributor-not-found");
  }
  if (contributorInviteDecision(contributor.auth_user_id) === "already_linked") {
    adminInviteRedirect("already-linked");
  }

  const { data: invited, error: inviteError } = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${resolveInviteOrigin(process.env.NEXT_PUBLIC_SITE_URL)}/auth/callback?next=/contribuir`,
  });
  if (inviteError || !invited.user) {
    adminInviteRedirect(inviteError?.code === "email_exists" ? "already-registered" : "send-failed");
  }

  const { data: linked, error: linkError } = await db
    .from("verified_contributors")
    .update({ auth_user_id: invited.user.id })
    .eq("handle", contributor.handle)
    .is("auth_user_id", null)
    .select("handle")
    .maybeSingle();
  if (linkError) {
    adminInviteRedirect("link-failed");
  }
  if (!linked) {
    adminInviteRedirect("already-linked");
  }
  await recordModerationEvent(db, access, "invite_contributor", {
    targetHandle: contributor.handle,
    metadata: { email_domain: email.split("@")[1] ?? "unknown" },
  });
  revalidatePath("/admin/review");
  adminInviteRedirect("contributor-sent");
}

async function manageEditorialMember(formData: FormData): Promise<void> {
  "use server";
  const access = await getEditorialAccess();
  if (!canManageMembers(access) || !access) return;
  const db = getServiceClient();
  if (!db) return;

  const operation = String(formData.get("operation") ?? "");
  const targetUserId = String(formData.get("auth_user_id") ?? "").trim();
  if (!targetUserId || targetUserId === access.member.auth_user_id) return;

  if (operation === "role") {
    const role = String(formData.get("role") ?? "");
    if (role !== "owner" && role !== "moderator") return;

    if (role === "moderator") {
      const { count } = await db
        .from("editorial_members")
        .select("auth_user_id", { count: "exact", head: true })
        .eq("role", "owner")
        .eq("active", true);
      const { data: target } = await db
        .from("editorial_members")
        .select("role,active")
        .eq("auth_user_id", targetUserId)
        .maybeSingle();
      if (target?.role === "owner" && target.active === true && (count ?? 0) <= 1) return;
    }

    const { data: changed } = await db
      .from("editorial_members")
      .update({ role })
      .eq("auth_user_id", targetUserId)
      .select("auth_user_id")
      .maybeSingle();
    if (changed) {
      await recordModerationEvent(db, access, "change_editorial_role", {
        metadata: { target_user_id: targetUserId, role },
      });
    }
  } else if (operation === "status") {
    const active = String(formData.get("active") ?? "") === "true";
    if (!active) {
      const { data: target } = await db
        .from("editorial_members")
        .select("role,active")
        .eq("auth_user_id", targetUserId)
        .maybeSingle();
      if (target?.role === "owner" && target.active === true) {
        const { count } = await db
          .from("editorial_members")
          .select("auth_user_id", { count: "exact", head: true })
          .eq("role", "owner")
          .eq("active", true);
        if ((count ?? 0) <= 1) return;
      }
    }

    const { data: changed } = await db
      .from("editorial_members")
      .update({ active })
      .eq("auth_user_id", targetUserId)
      .select("auth_user_id")
      .maybeSingle();
    if (changed) {
      await recordModerationEvent(db, access, "change_editorial_status", {
        metadata: { target_user_id: targetUserId, active: String(active) },
      });
    }
  }
}

async function inviteEditorialMember(formData: FormData): Promise<void> {
  "use server";
  const access = await getEditorialAccess();
  if (!canManageMembers(access) || !access) return;
  const db = getServiceClient();
  if (!db) return;
  await enforceInviteRateLimit(db, access.member.auth_user_id);

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "moderator");
  const displayName = String(formData.get("display_name") ?? "").trim().slice(0, 120);
  if (!email || !email.includes("@") || (role !== "owner" && role !== "moderator")) return;

  const { data: invited, error } = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${resolveInviteOrigin(process.env.NEXT_PUBLIC_SITE_URL)}/auth/callback?next=/admin/review`,
  });
  if (error || !invited.user) {
    adminInviteRedirect(error?.code === "email_exists" ? "already-registered" : "send-failed");
  }

  const { data: member, error: memberError } = await db
    .from("editorial_members")
    .insert({
      auth_user_id: invited.user.id,
      role,
      active: true,
      display_name: displayName || null,
    })
    .select("auth_user_id")
    .maybeSingle();
  if (memberError || !member) {
    adminInviteRedirect("member-link-failed");
  }

  await recordModerationEvent(db, access, "invite_editorial_member", {
    metadata: { target_user_id: invited.user.id, email_domain: email.split("@")[1] ?? "unknown", role },
  });
  revalidatePath("/admin/review");
  adminInviteRedirect(role === "owner" ? "owner-sent" : "moderator-sent");
}

export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ invite?: string; welcome?: string }>;
}) {
  const access = await getEditorialAccess();
  const params = await searchParams;
  const inviteStatus = params?.invite;
  const welcomed = params?.welcome === "1";
  if (!access) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 pt-16 pb-16">
        <p className="meta-label mb-3">Admin — Acceso restringido</p>
        <h1 className="font-display text-4xl mb-8">Revisión editorial</h1>
        <p className="max-w-xl text-[15px] leading-7 text-charcoal/85">
           Esta ruta puede abrirse con la URL, pero no muestra la cola ni permite acciones
           sin una cuenta editorial autorizada. Inicia sesión con la cuenta owner o
           moderator invitada.
        </p>
        <div className="mt-8 flex flex-col gap-4 max-w-sm">
          <a href="/iniciar-sesion?next=/admin/review" className="w-fit text-sm bg-ink text-paper px-7 py-3 hover:opacity-80 transition">
            Iniciar sesión editorial
          </a>
          <SignOutButton label="Cerrar sesión" />
        </div>
      </div>
    );
  }

  const db = getServiceClient();
  if (!db) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 pt-16">
        <p className="meta-label mb-3">Admin</p>
        <h1 className="font-display text-4xl">Sin base de datos</h1>
        <p className="mt-4 max-w-xl text-[15px] leading-7 text-charcoal/85">
          Configura las variables de Supabase para ver la cola de envíos.
        </p>
       </div>
    );
  }

  const { data } = await db
    .from("submissions")
    .select("id,author_handle,image_url,caption_raw,source,created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  const pending = (data ?? []) as Submission[];
  const pendingPaths = pending.flatMap((submission) => {
    const located = locateStoredObject(submission.image_url);
    if (!located || located.bucket !== PRIVATE_BUCKET) return [];
    return [located.path];
  });
  const signedByPath = new Map<string, string>();
  if (pendingPaths.length > 0) {
    const { data: signed } = await db.storage
      .from(PRIVATE_BUCKET)
      .createSignedUrls(pendingPaths, SIGNED_URL_TTL_SECONDS);
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) signedByPath.set(item.path, item.signedUrl);
    }
  }
  const ownerAccess = access.kind === "member" && access.member.role === "owner" ? access : null;
  const { data: memberData } = await db
    .from("editorial_members")
    .select("auth_user_id,role,active,display_name")
    .order("created_at", { ascending: true });
  const members = (memberData ?? []) as EditorialMember[];

  return (
    <div className="mx-auto max-w-[1400px] px-5 md:px-10 pt-10 md:pt-16 pb-16">
      <div className="flex items-start justify-between gap-6">
        <p className="meta-label mb-3">Admin — Cola de revisión</p>
        <SignOutButton label="Cerrar sesión" />
      </div>
      <h1 className="font-display text-5xl md:text-6xl leading-[0.95]">
        {pending.length} envío{pending.length === 1 ? "" : "s"} pendiente
        {pending.length === 1 ? "" : "s"}
      </h1>
       <p className="mt-4 max-w-xl text-[15px] leading-7 text-charcoal/85">
           Aceptar publica el envío en el Journal y hace pública su foto.
          Rechazar borra el archivo y lo retira de la cola.
          Nada llega a redes sin pasar por aquí.
       </p>

       {welcomed && (
         <div className="mt-6 max-w-xl border border-ink p-4 text-sm leading-6" role="status">
           Welcome. Your editorial account is now signed in. You can review the queue and manage the team according to your role.
         </div>
       )}

       {inviteStatus && (
         <div
           className={`mt-6 max-w-xl border p-4 text-sm leading-6 ${
             inviteStatus.endsWith("sent") ? "border-ink" : "border-red-800/60"
           }`}
           role="status"
         >
           {inviteStatus === "owner-sent" && "Invitation sent. The new owner must open the email link once, then can request another sign-in link from the login page."}
           {inviteStatus === "moderator-sent" && "Invitation sent. The moderator must open the email link once, then can request another sign-in link from the login page."}
           {inviteStatus === "contributor-sent" && "Invitation sent. The contributor must open the email link once. Check spam if it does not arrive."}
           {inviteStatus === "already-registered" && "This email already has a Supabase account or invitation. Do not create a second account; ask the person to use the login page with this email."}
           {inviteStatus === "contributor-not-found" && "That contributor handle is not registered yet. Add it to the verified contributors list before inviting the email."}
           {inviteStatus === "already-linked" && "This handle is already linked to an account. Re-inviting does not replace that link. Ask the person to sign in, or revoke the link in a separate step."}
           {inviteStatus === "send-failed" && "The invitation could not be sent. Confirm the email, Supabase email configuration, and that the address is not already registered."}
           {inviteStatus === "link-failed" && "The email was sent, but the contributor link could not be saved. Do not resend until the account link is checked."}
           {inviteStatus === "member-link-failed" && "The email was sent, but the editorial role could not be saved. Check the team list before sending another invitation."}
           {inviteStatus === "rate-limited" && "Demasiadas invitaciones seguidas. Espera un rato antes de enviar otra."}
           {inviteStatus === "rate-unavailable" && "No se pudo anotar el límite de invitaciones. No se envió el correo. Inténtalo de nuevo cuando la base responda."}
         </div>
       )}

       {canInvite(access) && (
         <section className="mt-10 max-w-xl border-t rule pt-6">
           <p className="meta-label mb-2">Invitar colaborador</p>
           <p className="text-sm leading-6 text-charcoal/85 mb-4">
             El handle debe existir previamente en la lista de colaboradores. No hay registro público.
             Si el handle ya tiene una cuenta vinculada, la invitación no la sustituye.
           </p>
           <form action={inviteContributor} className="flex flex-col gap-3">
             <label htmlFor="contributor-handle" className="meta-label">Handle</label>
             <input
               id="contributor-handle"
               name="handle"
               required
               autoComplete="off"
               placeholder="@arq.habana"
               className="border border-line bg-transparent px-4 py-3 text-[15px] outline-none focus:border-ink"
             />
             <label htmlFor="contributor-email" className="meta-label">Email</label>
             <input
               id="contributor-email"
               name="email"
               required
               type="email"
               autoComplete="email"
               placeholder="email del colaborador"
               className="border border-line bg-transparent px-4 py-3 text-[15px] outline-none focus:border-ink"
             />
             <button type="submit" className="w-fit text-sm bg-ink text-paper px-6 py-2.5 hover:opacity-80 transition">
               Enviar invitación
             </button>
           </form>
         </section>
       )}

      {canManageMembers(ownerAccess) && ownerAccess && (
        <section className="mt-10 max-w-3xl border-t rule pt-6">
          <p className="meta-label mb-2">Equipo editorial</p>
          <p className="text-sm leading-6 text-charcoal/85 mb-4">
            Solo las cuentas owner pueden invitar, cambiar roles o desactivar acceso. Siempre debe quedar un owner activo.
          </p>
          <form action={inviteEditorialMember} className="grid gap-3 md:grid-cols-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="member-name" className="meta-label">Nombre</label>
              <input id="member-name" name="display_name" autoComplete="name" placeholder="Nombre" className="border border-line bg-transparent px-4 py-3 text-[15px] outline-none focus:border-ink" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="member-email" className="meta-label">Email</label>
              <input id="member-email" name="email" required type="email" autoComplete="email" placeholder="email editorial" className="border border-line bg-transparent px-4 py-3 text-[15px] outline-none focus:border-ink" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="member-role" className="meta-label">Rol</label>
              <select id="member-role" name="role" defaultValue="moderator" className="border border-line bg-transparent px-4 py-3 text-[15px] outline-none focus:border-ink">
              <option value="moderator">Moderator</option>
              <option value="owner">Owner</option>
            </select>
            </div>
            <button type="submit" className="text-sm bg-ink text-paper px-6 py-2.5 hover:opacity-80 transition">Invitar al equipo</button>
          </form>
          <div className="mt-6 flex flex-col gap-3">
            {members.map((member) => (
              <div key={member.auth_user_id} className="border-t rule pt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm">{member.display_name || "Sin nombre"}</p>
                  <p className="meta-label">{member.role} · {member.active ? "Activo" : "Inactivo"}</p>
                </div>
                {member.auth_user_id !== ownerAccess.member.auth_user_id && (
                  <div className="flex flex-wrap gap-2">
                    <form action={manageEditorialMember}>
                      <input type="hidden" name="operation" value="role" />
                      <input type="hidden" name="auth_user_id" value={member.auth_user_id} />
                      <input type="hidden" name="role" value={member.role === "owner" ? "moderator" : "owner"} />
                      <button type="submit" className="text-xs border border-ink px-3 py-2 hover:bg-ink hover:text-paper transition-colors">Cambiar a {member.role === "owner" ? "moderator" : "owner"}</button>
                    </form>
                    <form action={manageEditorialMember}>
                      <input type="hidden" name="operation" value="status" />
                      <input type="hidden" name="auth_user_id" value={member.auth_user_id} />
                      <input type="hidden" name="active" value={String(!member.active)} />
                      <button type="submit" className="text-xs border border-ink px-3 py-2 hover:bg-ink hover:text-paper transition-colors">{member.active ? "Desactivar" : "Activar"}</button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 flex flex-col gap-10">
        {pending.map((s) => {
          const located = locateStoredObject(s.image_url);
          const previewUrl = located ? signedByPath.get(located.path) : undefined;
          return (
          <article key={s.id} className="border-t rule pt-6 grid md:grid-cols-12 gap-6">
            <div className="md:col-span-4">
              <div className="img-editorial aspect-[4/3] relative">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt={`Envío de ${s.author_handle}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <p className="p-4 text-sm leading-6 text-charcoal/85">La foto no está disponible.</p>
                )}
              </div>
            </div>
            <div className="md:col-span-8">
              <p className="meta-label mb-2">
                {s.author_handle} · {s.source} ·{" "}
                {new Date(s.created_at).toLocaleDateString("es")}
              </p>
              <p className="text-[15px] leading-7 text-charcoal/90 whitespace-pre-line max-w-2xl">
                {s.caption_raw}
              </p>
              <div className="mt-4 flex gap-3">
                <ModerationDecision action="approve" submissionId={s.id} formAction={decide} />
                <ModerationDecision action="reject" submissionId={s.id} formAction={decide} />
              </div>
            </div>
          </article>
          );
        })}
        {pending.length === 0 && (
          <p className="text-[15px] text-charcoal/85">
            Cola vacía. Cuando un colaborador verificado envíe por /contribuir,
            aparecerá aquí.
          </p>
        )}
      </div>
    </div>
  );
}
