# Task 3 Integration Requests

Requests from Task 3 to other workstreams.

## IR-3-001 — Add the Memory Center UI

- Requested change: Task 1 should add a settings screen that displays saved
  memories and controls memory, humor and light roasting.
- Reason: Users must be able to inspect, disable and delete personalization
  data without relying only on chat commands.
- API: `GET`, `PATCH` and `DELETE /api/memory`.
- Affected workstream: Task 1.
- Blocks Task 3: No. The backend and chat controls work without the screen.

## IR-3-002 — Support feature branches in ownership checks

- Requested change: Allow Task 3 feature branches such as
  `feature/task3-user-memory` to map to Task 3 ownership paths.
- Reason: `scripts/check-ownership.mjs` currently recognizes only the exact
  branch name `task-3-platform-ai`.
- Affected files: `scripts/check-ownership.mjs` and ownership CI.
- Blocks Task 3: It blocks a clean ownership check and PR workflow.

## IR-3-003 — Add authenticated production persistence

- Requested change: Introduce authentication and a per-user
  Supabase/Postgres memory adapter before onboarding real users.
- Reason: The current JSON file represents one hackathon demo profile and
  cannot provide cross-user isolation.
- Affected workstream: Task 3/platform integration.
- Blocks Task 3: It does not block the single-user demo; it blocks production.
