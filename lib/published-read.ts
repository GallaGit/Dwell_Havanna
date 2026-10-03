export type ReadResult<T> = { ok: true; rows: T[] } | { ok: false };
export type RowRead<T> = { ok: true; row: T | null } | { ok: false };

/**
 * La lectura anónima (policy `published_read`) manda cuando devuelve filas.
 * Una lista vacía puede ser un catálogo vacío o una policy que todavía no
 * está aplicada: en ese caso se repite la misma consulta, ya filtrada por
 * `status = published`, con `service_role`. Si la anónima falla (sin GRANT),
 * también. Cuando la policy responde filas, `service_role` no se usa.
 * Si ese segundo intento no responde, el resultado es `null` (dataset
 * estático). Un `[]` solo sale cuando el segundo intento confirma que no
 * hay filas publicadas.
 */
export function choosePublishedRows<T>(
  anon: ReadResult<T> | null,
  service: ReadResult<T> | null,
): T[] | null {
  if (anon?.ok && anon.rows.length > 0) return anon.rows;
  if (service?.ok) return service.rows;
  return null;
}

/** `undefined` pide el dataset estático. `null` es un slug que no está publicado. */
export function choosePublishedRow<T>(
  anon: RowRead<T> | null,
  service: RowRead<T> | null,
): T | null | undefined {
  if (anon?.ok && anon.row) return anon.row;
  if (service?.ok) return service.row;
  return undefined;
}
