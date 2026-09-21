import Image from "next/image";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getServiceClient } from "@/lib/db";
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

const COOKIE = "dh_admin";

async function login(formData: FormData): Promise<void> {
  "use server";
  const token = process.env.ADMIN_TOKEN;
  const given = String(formData.get("token") ?? "");
  if (token && given === token) {
    const store = await cookies();
    const ttlSeconds = Number(process.env.ADMIN_TOKEN_TTL_SECONDS ?? 60 * 60 * 24 * 7);
    store.set(COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : 60 * 60 * 24 * 7,
    });
  }
  revalidatePath("/admin/review");
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
    actor_user_id: access.kind === "member" ? access.member.auth_user_id : null,
    actor_source: access.kind === "member" ? "auth" : "legacy_admin",
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

    const firstLine =
      sub.caption_raw.split("\n").find((l: string) => l.trim()) ?? "";
    const slug = `community-${sub.id.slice(0, 8)}`;
    const { error: draftError } = await db.from("journal_posts").insert({
      slug,
      title: firstLine.slice(0, 90) || "Envío de la comunidad",
      category: "Community",
      excerpt: sub.caption_raw.slice(0, 220),
      image: sub.image_url,
      date_label: "Borrador — revisión",
      reading_time: "3 min",
      status: "review",
    });
    if (draftError) return;
    const { data: approved } = await db
      .from("submissions")
      .update({ status: "approved" })
      .eq("id", id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (approved) {
      await recordModerationEvent(db, access, "approve_submission", { submissionId: id });
    }
  }
  revalidatePath("/admin/review");
}

async function inviteContributor(formData: FormData): Promise<void> {
  "use server";
  const access = await getEditorialAccess();
  if (!canInvite(access) || !access) return;
  const db = getServiceClient();
  if (!db) return;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const handle = String(formData.get("handle") ?? "").trim();
  if (!email || !handle || !email.includes("@")) return;

  const { data: contributor } = await db
    .from("verified_contributors")
    .select("handle")
    .eq("handle", handle)
    .maybeSingle();
  if (!contributor) return;

  const { data: invited, error: inviteError } = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/contribuir`,
  });
  if (inviteError || !invited.user) return;

  const { error: linkError } = await db
    .from("verified_contributors")
    .update({ auth_user_id: invited.user.id })
    .eq("handle", contributor.handle);
  if (linkError) return;
  await recordModerationEvent(db, access, "invite_contributor", {
    targetHandle: contributor.handle,
    metadata: { email_domain: email.split("@")[1] ?? "unknown" },
  });
  revalidatePath("/admin/review");
}

async function manageEditorialMember(formData: FormData): Promise<void> {
  "use server";
  const access = await getEditorialAccess();
  if (!canManageMembers(access) || access?.kind !== "member" || access.member.role !== "owner") return;
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
  revalidatePath("/admin/review");
}

async function inviteEditorialMember(formData: FormData): Promise<void> {
  "use server";
  const access = await getEditorialAccess();
  if (!canManageMembers(access) || access?.kind !== "member" || access.member.role !== "owner") return;
  const db = getServiceClient();
  if (!db) return;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "moderator");
  const displayName = String(formData.get("display_name") ?? "").trim().slice(0, 120);
  if (!email || !email.includes("@") || (role !== "owner" && role !== "moderator")) return;

  const { data: invited, error } = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/admin/review`,
  });
  if (error || !invited.user) return;

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
  if (memberError || !member) return;

  await recordModerationEvent(db, access, "invite_editorial_member", {
    metadata: { target_user_id: invited.user.id, email_domain: email.split("@")[1] ?? "unknown", role },
  });
  revalidatePath("/admin/review");
}

export default async function AdminReviewPage() {
  const access = await getEditorialAccess();
  if (!access) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 pt-16 pb-16">
        <p className="meta-label mb-3">Admin — Acceso restringido</p>
        <h1 className="font-display text-4xl mb-8">Revisión editorial</h1>
        <p className="max-w-xl text-[15px] leading-7 text-charcoal/85">
           Esta ruta puede abrirse con la URL, pero no muestra la cola ni permite acciones
           sin una cuenta editorial autorizada. Inicia sesión con una cuenta editorial
           invitada. El token de emergencia tiene una expiración configurable y solo es
           un fallback temporal mientras se completa la migración.
        </p>
        <div className="mt-8 flex flex-col gap-4 max-w-sm">
          <a href="/iniciar-sesion?next=/admin/review" className="w-fit text-sm bg-ink text-paper px-7 py-3 hover:opacity-80 transition">
            Iniciar sesión editorial
          </a>
          {process.env.ADMIN_TOKEN && (
            <form action={login} className="flex flex-col gap-4 border-t rule pt-6">
              <input
                name="token"
                type="password"
                required
                 placeholder="Emergency token"
                className="border border-line bg-transparent px-4 py-3 text-[15px] outline-none focus:border-ink"
              />
              <button
                type="submit"
                className="w-fit text-sm border border-ink px-7 py-3 hover:bg-ink hover:text-paper transition-colors"
              >
                Usar acceso de emergencia
              </button>
            </form>
          )}
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
  const ownerAccess = access.kind === "member" && access.member.role === "owner" ? access : null;
  const { data: memberData } = await db
    .from("editorial_members")
    .select("auth_user_id,role,active,display_name")
    .order("created_at", { ascending: true });
  const members = (memberData ?? []) as EditorialMember[];

  return (
    <div className="mx-auto max-w-[1400px] px-5 md:px-10 pt-10 md:pt-16 pb-16">
      <p className="meta-label mb-3">Admin — Cola de revisión</p>
      <h1 className="font-display text-5xl md:text-6xl leading-[0.95]">
        {pending.length} envío{pending.length === 1 ? "" : "s"} pendiente
        {pending.length === 1 ? "" : "s"}
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-7 text-charcoal/85">
        Aprobar crea un borrador en el Journal (estado review) para editar
        antes de publicar. Rechazar lo descarta. Nada llega a redes sin pasar
        por aquí.
      </p>

       {canInvite(access) && (
         <section className="mt-10 max-w-xl border-t rule pt-6">
           <p className="meta-label mb-2">Invitar colaborador</p>
           <p className="text-sm leading-6 text-charcoal/85 mb-4">
             El handle debe existir previamente en la lista de colaboradores. No hay registro público.
           </p>
           <form action={inviteContributor} className="flex flex-col gap-3">
             <input
               name="handle"
               required
               placeholder="@arq.habana"
               className="border border-line bg-transparent px-4 py-3 text-[15px] outline-none focus:border-ink"
             />
             <input
               name="email"
               required
               type="email"
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
            <input name="display_name" placeholder="Nombre" className="border border-line bg-transparent px-4 py-3 text-[15px] outline-none focus:border-ink" />
            <input name="email" required type="email" placeholder="email editorial" className="border border-line bg-transparent px-4 py-3 text-[15px] outline-none focus:border-ink" />
            <select name="role" defaultValue="moderator" className="border border-line bg-transparent px-4 py-3 text-[15px] outline-none focus:border-ink">
              <option value="moderator">Moderator</option>
              <option value="owner">Owner</option>
            </select>
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
        {pending.map((s) => (
          <article key={s.id} className="border-t rule pt-6 grid md:grid-cols-12 gap-6">
            <div className="md:col-span-4">
              <div className="img-editorial aspect-[4/3] relative">
                <Image
                  src={s.image_url}
                  alt={`Envío de ${s.author_handle}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
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
                <form action={decide}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="action" value="approve" />
                  <button
                    type="submit"
                    className="text-sm bg-ink text-paper px-6 py-2.5 hover:opacity-80 transition"
                  >
                    Aprobar → borrador
                  </button>
                </form>
                <form action={decide}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="action" value="reject" />
                  <button
                    type="submit"
                    className="text-sm border border-ink px-6 py-2.5 hover:bg-ink hover:text-paper transition-colors"
                  >
                    Rechazar
                  </button>
                </form>
              </div>
            </div>
          </article>
        ))}
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
