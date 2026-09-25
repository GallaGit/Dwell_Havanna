"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done" }
  | { kind: "error"; message: string };

const FRIENDLY: Record<string, string> = {
  handle_and_caption_required: "Your handle and story are required.",
  rights_required: "You must grant publishing rights before sending.",
  photo_required: "Attach a photo.",
  photo_must_be_jpeg: "JPEG files only (.jpg). Convert the photo and try again.",
  photo_too_large_8mb: "The photo is larger than 8 MB. Reduce its size and try again.",
  unknown_contributor:
    "Your account is not linked to that contributor. Contact us to review your invitation.",
  authentication_required: "Sign in with your invitation before sending.",
  auth_not_configured: "Contributor access is not configured yet.",
  db_not_configured: "The submission inbox is not available yet. Try again later.",
  upload_failed: "The upload failed. Check your connection and try again.",
  save_failed: "We could not save your submission. Try again.",
  bad_form: "Invalid form.",
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
          "Something went wrong. Try again.",
      });
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 md:px-10 pt-10 md:pt-16 pb-16">
      <p className="meta-label mb-3">Contribute — Verified contributors only</p>
      <h1 className="font-display text-5xl md:text-7xl leading-[0.95] max-w-4xl">
        Send a <span className="italic font-normal">photo and its story</span>.
      </h1>
      <p className="mt-5 max-w-xl text-[15px] leading-7 text-charcoal/85">
        Your submission enters an editorial review queue. Nothing is published
        automatically: if approved, it appears on the site first and may later
        be shared on our networks with your credit.
      </p>
      <p className="mt-4 max-w-xl text-[15px] leading-7 text-charcoal/85">
        Only invited contributors can send work. If you do not have access yet, contact the editorial team.
      </p>
      <Link href="/iniciar-sesion" className="inline-block mt-4 text-sm underline underline-offset-4">
        Sign in with my invitation
      </Link>

      <form
        onSubmit={onSubmit}
        className="mt-10 max-w-xl border-t rule pt-8 flex flex-col gap-6"
      >
        <label className="flex flex-col gap-2">
           <span className="meta-label">Your verified handle</span>
          <input
            name="handle"
            required
            placeholder="@arq.habana"
            autoComplete="off"
            className="border border-line bg-transparent px-4 py-3 text-[15px] outline-none focus:border-ink"
          />
        </label>

        <label className="flex flex-col gap-2">
           <span className="meta-label">Title (optional)</span>
          <input
            name="title"
            maxLength={140}
            placeholder="Luz de patio en Centro"
            className="border border-line bg-transparent px-4 py-3 text-[15px] outline-none focus:border-ink"
          />
        </label>

        <label className="flex flex-col gap-2">
           <span className="meta-label">Story — what the photo shows</span>
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
           <span className="meta-label">Photo — JPEG, max. 8 MB</span>
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
             I grant Dwell Havana the right to publish this photo with my
             credit on the site and its networks. I confirm that I created it.
          </span>
        </label>

        <button
          type="submit"
          disabled={state.kind === "sending"}
          className="inline-flex w-fit text-sm bg-ink text-paper px-7 py-3 hover:opacity-80 transition disabled:opacity-50"
        >
          {state.kind === "sending" ? "Sending…" : "Send for review"}
        </button>

        {state.kind === "done" && (
          <p className="border border-ink p-4 text-sm leading-6">
            Received. We will review it and let you know if it is published.{" "}
            <Link href="/" className="underline underline-offset-4">
              Back to the home page
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
