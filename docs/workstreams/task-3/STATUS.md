# Task 3 Status

## Current milestone

User memory and safe personality foundation implemented on
`feature/task3-user-memory`.

## Completed

- Deterministic tone modes with emergency, serious and payment overrides.
- Explicit opt-in for light roasting and user-controlled humor settings.
- JSON-backed memories with provenance, correction and deletion.
- Automatic extraction for simple preferences, goals and repeated behavior.
- Trusted purchase behavior memories from finance tool executions.
- Memory poisoning and secret filters.
- `GET`, `PATCH` and `DELETE /api/memory`.
- Temporary chats that neither retrieve nor write memories.
- Focused memory, policy and persistence tests.

## In progress

- Task 1 Memory Center UI integration.

## Blocked

- Multi-user isolation requires authentication and a production database.
- Feature branches are not recognized by `scripts/check-ownership.mjs`.

## Tests currently passing

- `tests/ai/chat-route.test.ts`
- `tests/ai/personalization.test.ts`
- Task 3/finance verification: 12 files, 54 tests.
- Typecheck, changed-file lint and production build.

## Known repository failures

- Root `pnpm test` incorrectly collects `tests/e2e/demo-flow.spec.ts` with
  Vitest instead of Playwright.
- Root `pnpm lint` fails in Task 1's `OnboardingFlow.tsx`; changed Task 3 files
  pass ESLint.
- Ownership check rejects `feature/task3-user-memory` because only exact
  workstream branch names are recognized.

## Known limitations

- The current JSON store is appropriate only for the single-user hackathon demo.
- Memory extraction intentionally supports a small set of explicit phrases.
- No vector search or knowledge-graph service is used.

## Last verified base commit

`8e05dc1`
