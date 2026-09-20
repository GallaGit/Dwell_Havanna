# Bloqueo E2E — 2020.09.15

Te explico dónde quedó el E2E, sin tocar nada más:

## Estado del E2E

| Paso | Resultado |
|------|-----------|
| 1. Lectura service_role | ✅ Tus 2 colaboradores + las 3 propiedades seed existen en Supabase |
| 2. RLS con key pública | ✅ anon ve `[]` en ambas tablas — nadie sin permiso lee nada |
| 3. Envío real `/api/submissions` | ⚠️ Bloqueado aquí: devolvió `403 unknown_contributor` para `@gallados_lab`, aunque ese handle SÍ existe (lo confirmé con query directa) |
| 4. Aprobar en admin | ⏳ Pendiente del 3 |
| 5. Lectura DB + feed/sitemap | ⏳ Pendiente |
| 6. Limpieza | ⏳ Nada que limpiar aún (ningún dato de prueba se creó) |

## Qué pasó con el 403 (mi hipótesis)

La query idéntica funciona fuera del dev server, así que el código y la DB están bien. La causa más probable: el dev server que tenías corriendo era anterior a los últimos cambios (código o `.env`) y sirvió una versión rancia de la ruta. Por eso lo terminé (PID `17016`) y levanté uno fresco en el mismo puerto `:3000` — tu navegador sigue funcionando igual, solo recarga.

## Hallazgo importante del entorno (anótalo)

Tu red intercepta TLS: Node no confía en el certificado y falla con `UNABLE_TO_VERIFY_LEAF_SIGNATURE` (`curl` sí funciona porque usa el almacén de Windows). Para las pruebas tuve que arrancar el server con `NODE_TLS_REJECT_UNAUTHORIZED=0`. Eso es solo para test local — en producción (Vercel/Supabase) no existe ese problema. No commiteé nada con ese flag; vive solo en el proceso del dev server actual.

## Para continuar (necesito tu OK para salir de plan mode)

Reintentar el paso 3 contra el server fresco. Si el 403 persiste, el plan B es instrumentar: log temporal en la ruta para ver qué devuelve Supabase dentro del server, corregirlo y re-probar.
