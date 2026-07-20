# Task 3 Handoff

## What works

- Chat chooses a deterministic response mode before calling Gemini.
- Emergency, critical-buffer and payment contexts cannot be roasted.
- Users can say `remember`, `forget`, `forget everything`, or ask what is
  remembered.
- Users can enable or disable memory, humor and light roasting.
- Preferences, goals and trusted purchase behavior persist in `db.json`.
- Memories are treated as untrusted data in the system prompt.
- `/api/memory` exposes backend inspection and control without a dedicated
  frontend.

## Files to read first

- `src/core/ai/memory.ts`
- `src/core/ai/personalization.ts`
- `src/app/api/chat/route.ts`
- `src/app/api/memory/route.ts`
- `src/server/db.ts`
- `supabase/migrations/20260720044831_user_memory.sql`
- `docs/workstreams/task-3/MEMORY_ARCHITECTURE.md`
- `tests/ai/personalization.test.ts`

## Important behavior

- Task 2 finance results remain the source of truth.
- Roasting is off by default and requires explicit user permission.
- Current-turn seriousness is not stored as a permanent personality label.
- Secrets and instruction-like memories are rejected.
- `temporaryChat: true` disables memory reads and writes for that request.

## Commands

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Last verification

- `pnpm typecheck`: pass.
- Changed Task 3 files under ESLint: pass.
- `vitest run tests/ai tests/integration tests/finance`: 54 tests pass.
- `pnpm build`: pass.
- Root test, lint and ownership limitations are recorded in `STATUS.md` and
  `docs/integration-requests/task-3-requests.md`.

## Exact next task

Keep the hackathon experience in the existing chat. Before supporting real
users, add authentication and replace JSON persistence with Supabase queries
using the included migration.

## Do not change

- Do not let memory override finance results or Constitution warnings.
- Do not allow humor when the deterministic policy selects serious mode.
- Do not persist passwords, OTPs, PINs, card numbers or account numbers.
- Do not add a graph database until the current retrieval is measurably
  insufficient.

## Known limitation

There is no authentication. The current database represents one demo profile.
