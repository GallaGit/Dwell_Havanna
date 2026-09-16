# Skills del proyecto (leer antes de programar)

Las skills instaladas desde `skills.sh` viven en **`.agents/skills/`** (carpeta ignorada en git).
Léelas con la herramienta `skill` (OpenCode) o directamente sus `SKILL.md` antes de
empezar cualquier tarea de código, diseño, seguridad, base de datos o documentación.

Espejos de las mismas skills: `.claude/skills/` y `.opencode/skills/`.
Si `.agents/skills/` está vacía, restaura con: `npx skills experimental_install`
(manifiesto: `skills-lock.json`).

## Qué skill usar y cuándo

| Skill | Cuándo usarla |
|---|---|
| `ui-ux-pro-max` | Diseñar, construir, revisar o corregir UI: páginas, componentes, color, tipografía, layout responsive, animación |
| `accessibility` | Auditoría a11y, WCAG 2.2, soporte de lector de pantalla, navegación por teclado |
| `best-practices` | Calidad y seguridad base del desarrollo web moderno |
| `security-and-hardening` | Cualquier feature con input de usuario, auth, sesiones, datos sensibles o integraciones externas (OWASP) |
| `typescript-best-practices` | Al leer o editar cualquier `.ts` / `.tsx` |
| `supabase` | Cualquier tarea con Supabase (Auth, DB, Storage, Realtime, Edge Functions, SSR en Next.js) |
| `supabase-postgres-best-practices` | ANTES de crear/migrar tablas, RLS, índices, funciones o diagnosticar queries lentas |
| `vercel-react-best-practices` | Al escribir, revisar o refactorizar React/Next.js (performance) |
| `vercel-composition-patterns` | Al refactorizar componentes o diseñar APIs de componentes reutilizables |
| `web-design-guidelines` | Al revisar UI contra buenas prácticas (incluye chequeo de accesibilidad) |
| `performance` | Optimizar velocidad de carga y Core Web Vitals |
| `seo` | Meta tags, structured data, sitemap, visibilidad en buscadores |
| `technical-writing` | Al escribir o revisar docs, READMEs, RFCs o descripciones de PR |

Regla general: si la tarea toca UI, usa `ui-ux-pro-max` + `accessibility`;
si toca datos, usa `supabase` + `supabase-postgres-best-practices`;
si toca `.ts`/`.tsx`, usa `typescript-best-practices`.
