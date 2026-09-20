"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done" }
  | { kind: "error"; message: string };

const FRIENDLY: Record<string, string> = {
  handle_and_caption_required: "Faltan tu handle o el texto.",
  rights_required: "Debes aceptar la cesión de derechos para publicar.",
  photo_required: "Adjunta una foto.",
  photo_must_be_jpeg: "Solo JPEG (.jpg). Convierte la foto e inténtalo de nuevo.",
  photo_too_large_8mb: "La foto supera 8 MB. Reduce su tamaño e inténtalo de nuevo.",
  unknown_contributor:
    "Tu cuenta no está asociada a ese colaborador. Escríbenos para revisar tu invitación.",
  authentication_required: "Inicia sesión con tu invitación antes de enviar.",
  auth_not_configured: "El acceso de colaboradores no está activo todavía.",
  db_not_configured: "El buzón no está activo todavía. Inténtalo más tarde.",
  upload_failed: "Falló la subida. Revisa tu conexión e inténtalo de nuevo.",
  save_failed: "No pudimos guardar tu envío. Inténtalo de nuevo.",
  bad_form: "Formulario inválido.",
};

export default function ContribuirPage() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: "sending" });
    const res = await fetch("/api/submissions", {
      method: "POST",
      body: new FormData(e.currentTarget),
    });
    const json = (await res.json().catch(() => null)) as {
      ok: boolean;
      error?: string;
    } | null;
    if (json?.ok) {
      (e.target as HTMLFormElement).reset();
      setState({ kind: "done" });
    } else {
      setState({
        kind: "error",
        message:
          FRIENDLY[json?.error ?? ""] ??
          "Algo falló. Inténtalo de nuevo.",
      });
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 md:px-10 pt-10 md:pt-16 pb-16">
      <p className="meta-label mb-3">Contribuir — Solo colaboradores verificados</p>
      <h1 className="font-display text-5xl md:text-7xl leading-[0.95] max-w-4xl">
        Envía una <span className="italic font-normal">foto y su historia</span>.
      </h1>
      <p className="mt-5 max-w-xl text-[15px] leading-7 text-charcoal/85">
        Tu envío entra a una cola de revisión editorial. Nada se publica
        automáticamente: si se aprueba, aparece primero en la web y desde ahí
        se comparte a nuestras redes con tu crédito.
      </p>
      <p className="mt-4 max-w-xl text-[15px] leading-7 text-charcoal/85">
        Solo colaboradores invitados pueden enviar. Si aún no tienes acceso, escribe al equipo editorial.
      </p>
      <Link href="/iniciar-sesion" className="inline-block mt-4 text-sm underline underline-offset-4">
        Entrar con mi invitación
      </Link>

      <form
        onSubmit={onSubmit}
        className="mt-10 max-w-xl border-t rule pt-8 flex flex-col gap-6"
      >
        <label className="flex flex-col gap-2">
          <span className="meta-label">Tu handle (verificado)</span>
          <input
            name="handle"
            required
            placeholder="@arq.habana"
            autoComplete="off"
            className="border border-line bg-transparent px-4 py-3 text-[15px] outline-none focus:border-ink"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="meta-label">Título (opcional)</span>
          <input
            name="title"
            maxLength={140}
            placeholder="Luz de patio en Centro"
            className="border border-line bg-transparent px-4 py-3 text-[15px] outline-none focus:border-ink"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="meta-label">Texto — qué muestra la foto</span>
          <textarea
            name="caption"
            required
            rows={5}
            maxLength={2000}
            placeholder="Casa, barrio, material, luz… Cuéntalo como lo contarías en persona."
            className="border border-line bg-transparent px-4 py-3 text-[15px] leading-7 outline-none focus:border-ink"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="meta-label">Foto — JPEG, máx. 8 MB</span>
          <input
            name="photo"
            type="file"
            required
            accept="image/jpeg,.jpg,.jpeg"
            className="text-sm text-charcoal/85 file:mr-4 file:border file:border-ink file:bg-transparent file:px-4 file:py-2 file:text-[13px] hover:file:bg-ink hover:file:text-paper file:transition-colors"
          />
        </label>

        <label className="flex items-start gap-3 text-sm leading-6 text-charcoal/85">
          <input name="rights" value="true" type="checkbox" required className="mt-1.5" />
          <span>
            Cedo a Dwell Havana el derecho de publicar esta foto con mi
            crédito en la web y sus redes. Confirmo que es de mi autoría.
          </span>
        </label>

        <button
          type="submit"
          disabled={state.kind === "sending"}
          className="inline-flex w-fit text-sm bg-ink text-paper px-7 py-3 hover:opacity-80 transition disabled:opacity-50"
        >
          {state.kind === "sending" ? "Enviando…" : "Enviar a revisión"}
        </button>

        {state.kind === "done" && (
          <p className="border border-ink p-4 text-sm leading-6">
            Recibido. Lo revisaremos y te avisaremos si se publica.{" "}
            <Link href="/" className="underline underline-offset-4">
              Volver a la portada
            </Link>
          </p>
        )}
        {state.kind === "error" && (
          <p className="border border-red-800/60 p-4 text-sm leading-6">
            {state.message}
          </p>
        )}
      </form>
    </div>
  );
}
