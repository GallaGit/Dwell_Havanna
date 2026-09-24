# Handoff - 21 September 2026

## Current branch

`cursor/editorial-permissions-onto-main-f82b`

This branch merges `origin/main` (`68bf651`) into the editorial permissions work
and opens one pull request against `main`. Do not force-push `main`.

## Supabase projects

- Testing: `Dwell_Havanna_Testing` (`ypeizxnafipvojpntsaw`)
- Production: `Dwell_Havanna_DB` (`sfujmwumtzuzwwhfmyxa`)

## Database status

Testing has the base schema and seed data, plus these migrations applied:

- `20260921000100_contributor_auth.sql`
- `20260921000200_editorial_permissions.sql`
- `20260921000300_editorial_member_management.sql`

Verified in testing:

- `verified_contributors.auth_user_id` exists.
- `editorial_members` exists.
- `moderation_events` exists.
- The testing account `ociel.galla@gmail.com` is linked to `@ociel.galla` and has the active `owner` role.
- The E2E contributor remains a separate account and must not be promoted to `owner`.

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
- `supabase/migrations/20260921000300_editorial_member_management.sql` extends audit actions for owner-managed editorial members.
- `20260921000300_editorial_member_management.sql` is applied in `Dwell_Havanna_Testing`; production has not been modified.
- `supabase/03-contributor-auth.sql` and `supabase/04-editorial-permissions.sql` remain readable SQL references.
- The E2E runner uses the Node executable to start Next on Windows.
- Supabase CLI `2.117.0` is a pinned dev dependency.
- `/admin/review` now asks for confirmation before approving or rejecting a submission.
- Approval creates `journal_posts.status='published'` and revalidates `/`, `/journal`, and the approved journal detail route.
- Approved community posts therefore appear in the public Journal after the editorial decision.
- `app/admin/review/ModerationDecision.tsx` contains the client-side confirmation dialog; authorization and mutations remain server-side.

## Next session

1. Run a manual browser check of `/admin/review` with the testing owner account.
2. Submit a test contribution, confirm the approval dialog, and verify the post at `/journal`.
3. Confirm rejection removes the submission from the pending queue and creates its audit event.
4. Add a moderator test user and verify that the moderator cannot manage editorial members.
5. Review the mobile navigation in a real mobile viewport.
6. Apply the migrations to production only after the testing flow passes.

## Verification already completed

- `npm run lint`
- `npm run build`
- `npm test`: 9 passing tests and 1 skipped opt-in HTTP E2E test because its `E2E_*` variables are not configured in this session.
- `npm run test:editorial-auth` runs the role policy tests without starting Next.js or reusing development-server state. It covers owner, moderator, inactive/malformed members, null access, and the temporary legacy fallback.
- Editorial member management is owner-only: owners can invite, change roles, and activate/deactivate other members; moderators and the legacy token cannot manage permissions. The server rejects self-management and removing the final active owner.
- Contributor corrections and withdrawal requests are documented as a future phase only. The current app does not let contributors edit, withdraw, or delete submissions.
- `node --env-file=.env.local --test tests/submissions-http.e2e.test.mjs`: 1 passing authenticated HTTP E2E test.
- Testing REST checks for the new column and tables: successful.
- Testing has a separate active owner account linked to `@ociel.galla`; the E2E contributor remains separate.
- After a successful Auth callback, `/auth/callback` adds `welcome=1`. `/admin/review` renders that welcome status. Other destinations receive the query parameter and do not render a welcome message yet.
- The owner account reached `/admin/review` and displayed the editorial queue, invitation form, and member-management controls.
- Complete browser assertions for moderator and inactive-account transitions remain pending because the current dev-server harness reused stale page or session state during role transitions.
- Direct Supabase checks confirmed that `owner -> moderator -> inactive` updates work and cleanup completed for the temporary role-transition test.

Never commit `.env.local`, Supabase access tokens, database passwords, service
keys, or E2E cookies.
