# Handoff - 21 September 2026

## Current branch

`feat/editorial-permissions-model`

The branch has not opened a pull request. The requested commit will be pushed
directly to the branch.

## Supabase projects

- Testing: `Dwell_Havanna_Testing` (`ypeizxnafipvojpntsaw`)
- Production: `Dwell_Havanna_DB` (`sfujmwumtzuzwwhfmyxa`)

## Database status

Testing has the base schema and seed data, plus these migrations applied:

- `20260921000100_contributor_auth.sql`
- `20260921000200_editorial_permissions.sql`

Verified in testing:

- `verified_contributors.auth_user_id` exists.
- `editorial_members` exists.
- `moderation_events` exists.
- `editorial_members` currently has zero rows. The existing Auth user is the E2E contributor and must not be promoted to `owner`.

Production has the base tables, but it was missing
`verified_contributors.auth_user_id`, `editorial_members`, and
`moderation_events` when last checked. Do not apply the production migrations
until the testing flow has been validated.

## Code changes

- `lib/editorial-auth.ts` centralizes server-side editorial authorization.
- `app/admin/review/page.tsx` supports `owner` and `moderator` access, owner-only invitations, and moderation audit events.
- `app/iniciar-sesion/page.tsx` preserves a safe `next` path for editorial login.
- `/properties` now has a functional city filter; free-text matching remains a future product decision.
- Mobile navigation uses a circular floating icon button and a horizontal pill bar that expands toward the left in 0.8s. The button uses inline `Menu` and `X` SVG icons and stays 24px from the viewport edges, with `safe-area-inset` support. The open panel keeps a 24px left margin and a 16px gap before the button, and scrolls internally on narrow screens. Its side and bottom offsets are CSS variables in `app/layout.tsx`.
- Contact CTAs use `mailto:hola@dwellhavana.example`.
- `/admin/review` is not protected by URL obscurity: the route is reachable, but the queue and actions require editorial Auth or the temporary token. The token cookie expires after seven days by default and is configurable with `ADMIN_TOKEN_TTL_SECONDS`.
- `supabase/migrations/` contains the formal `03` and `04` migrations.
- `supabase/03-contributor-auth.sql` and `supabase/04-editorial-permissions.sql` remain readable SQL references.
- The E2E runner uses the Node executable to start Next on Windows.
- Supabase CLI `2.117.0` is a pinned dev dependency.

## Next session

1. Review the mobile navigation together in a real mobile viewport and confirm the final circle size, icon weight, and spacing.
2. Create or identify a testing Auth user separate from the E2E contributor for the editorial owner.
3. Insert that user into `editorial_members` with role `owner`.
4. Test editorial login, review actions, invitation permissions, and audit rows.
5. Add a moderator test user if needed.
6. Only after testing passes, apply the contributor-auth and editorial-permissions migrations to production.

## Verification already completed

- `npm run lint`
- `npm run build`
- `npm test` with testing environment loaded: 6 passing tests.
- `node --env-file=.env.local --test tests/submissions-http.e2e.test.mjs`: 1 passing authenticated HTTP E2E test.
- Testing REST checks for the new column and tables: successful.
- Testing Auth currently has one user, linked to `@e2e-contributor`; `editorial_members` has zero rows. Do not promote that user to `owner`.
- Future Auth UX: after a user accepts an invitation, show a welcome message on the callback destination. This is documented as a follow-up and is not implemented in the current test flow.
- Temporary editorial accounts for the permissions test were removed after testing. The testing project has zero users for `ociel.galla@gmail.com` and `ociel5996@gmail.com`, and `editorial_members` has zero rows.
- The temporary `owner` request reached `/admin/review` and displayed the editorial queue and invitation form. The complete `moderator` and inactive-account HTTP assertions remain blocked by the current dev-server test harness, which reused stale page or session state during role transitions. Direct Supabase checks confirmed that `owner -> moderator -> inactive` updates work and cleanup completed.

Never commit `.env.local`, Supabase access tokens, database passwords, service
keys, or E2E cookies.
