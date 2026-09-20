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
- `editorial_members` currently has zero rows.

Production has the base tables, but it was missing
`verified_contributors.auth_user_id`, `editorial_members`, and
`moderation_events` when last checked. Do not apply the production migrations
until the testing flow has been validated.

## Code changes

- `lib/editorial-auth.ts` centralizes server-side editorial authorization.
- `app/admin/review/page.tsx` supports `owner` and `moderator` access, owner-only invitations, and moderation audit events.
- `app/iniciar-sesion/page.tsx` preserves a safe `next` path for editorial login.
- `supabase/migrations/` contains the formal `03` and `04` migrations.
- `supabase/03-contributor-auth.sql` and `supabase/04-editorial-permissions.sql` remain readable SQL references.
- The E2E runner uses the Node executable to start Next on Windows.
- Supabase CLI `2.117.0` is a pinned dev dependency.

## Next session

1. Create or identify the testing Auth user for the editorial owner.
2. Insert that user into `editorial_members` with role `owner`.
3. Test editorial login, review actions, invitation permissions, and audit rows.
4. Add a moderator test user if needed.
5. Only after testing passes, apply the contributor-auth and editorial-permissions migrations to production.

## Verification already completed

- `npm run lint`
- `npm run build`
- `npm test` with testing environment loaded: 6 passing tests.
- Testing REST checks for the new column and tables: successful.

Never commit `.env.local`, Supabase access tokens, database passwords, service
keys, or E2E cookies.
