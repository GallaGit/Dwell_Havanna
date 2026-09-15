import Image from "next/image";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getServiceClient } from "@/lib/db";

export const runtime = "nodejs";

const COOKIE = "dh_admin";

async function isAuthed(): Promise<boolean> {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  const store = await cookies();
  return store.get(COOKIE)?.value === token;
}

async function login(formData: FormData): Promise<void> {
  "use server";
  const token = process.env.ADMIN_TOKEN;
  const given = String(formData.get("token") ?? "");
  if (token && given === token) {
    const store = await cookies();
    store.set(COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  revalidatePath("/admin/review");
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
  if (!(await isAuthed())) return;
  const db = getServiceClient();
  if (!db) return;

  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!id) return;

  if (action === "reject") {
    await db.from("submissions").update({ status: "rejected" }).eq("id", id);
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
    await db.from("journal_posts").insert({
      slug,
      title: firstLine.slice(0, 90) || "Envío de la comunidad",
      category: "Community",
      excerpt: sub.caption_raw.slice(0, 220),
      image: sub.image_url,
      date_label: "Borrador — revisión",
      reading_time: "3 min",
      status: "review",
    });
    await db.from("submissions").update({ status: "approved" }).eq("id", id);
  }
  revalidatePath("/admin/review");
}

export default async function AdminReviewPage() {
  if (!process.env.ADMIN_TOKEN) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 pt-16">
        <p className="meta-label mb-3">Admin</p>
        <h1 className="font-display text-4xl">Panel deshabilitado</h1>
        <p className="mt-4 max-w-xl text-[15px] leading-7 text-charcoal/85">
          Configura ADMIN_TOKEN en el entorno para activar la revisión.
        </p>
      </div>
    );
  }

  if (!(await isAuthed())) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 pt-16 pb-16">
        <p className="meta-label mb-3">Admin — Acceso restringido</p>
        <h1 className="font-display text-4xl mb-8">Revisión editorial</h1>
        <form action={login} className="max-w-sm flex flex-col gap-4">
          <input
            name="token"
            type="password"
            required
            placeholder="Token de editora"
            className="border border-line bg-transparent px-4 py-3 text-[15px] outline-none focus:border-ink"
          />
          <button
            type="submit"
            className="w-fit text-sm bg-ink text-paper px-7 py-3 hover:opacity-80 transition"
          >
            Entrar
          </button>
        </form>
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
