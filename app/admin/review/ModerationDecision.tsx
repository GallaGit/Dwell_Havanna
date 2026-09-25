"use client";

import { useState } from "react";

type Decision = "approve" | "reject";

export function ModerationDecision({
  action,
  submissionId,
  formAction,
}: {
  action: Decision;
  submissionId: string;
  formAction: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const isApproval = action === "approve";
  const title = isApproval ? "Publicar este envío?" : "Rechazar este envío?";
  const description = isApproval
    ? "Se publicará ahora en el Journal y aparecerá en el frontend."
    : "El envío dejará de estar en la cola pendiente y no aparecerá en el frontend.";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-sm px-6 py-2.5 transition-colors ${
          isApproval
            ? "bg-ink text-paper hover:opacity-80"
            : "border border-ink hover:bg-ink hover:text-paper"
        }`}
      >
        {isApproval ? "Aceptar y publicar" : "Rechazar"}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`decision-title-${submissionId}`}
            className="w-full max-w-md border border-line bg-paper p-6 shadow-xl"
          >
            <p className="meta-label mb-3">Confirmación editorial</p>
            <h2 id={`decision-title-${submissionId}`} className="font-display text-3xl leading-tight">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-charcoal/85">{description}</p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="border border-line px-4 py-2 text-sm hover:border-ink transition-colors"
              >
                Cancelar
              </button>
              <form action={formAction}>
                <input type="hidden" name="id" value={submissionId} />
                <input type="hidden" name="action" value={action} />
                <button
                  type="submit"
                  className="bg-ink px-4 py-2 text-sm text-paper hover:opacity-80 transition-opacity"
                >
                  {isApproval ? "Confirmar publicación" : "Confirmar rechazo"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
