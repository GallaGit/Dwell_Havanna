const HAS_EXTENSION = /\.(?:[cm]?[jt]s|json|mjs|cjs|node)$/;

/**
 * El runner de node no resuelve imports relativos sin extensión.
 * Next sí. Este hook solo añade `.ts` cuando el archivo existe.
 */
export async function resolve(specifier, context, nextResolve) {
  const relative = specifier.startsWith("./") || specifier.startsWith("../");
  if (relative && !HAS_EXTENSION.test(specifier)) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      return nextResolve(specifier, context);
    }
  }
  return nextResolve(specifier, context);
}
