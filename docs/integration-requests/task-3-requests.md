# Task 3 Integration Requests

Requests from Task 3 to other workstreams.

## IR-3-001 — Support feature branches in ownership checks

- Requested change: Allow Task 3 feature branches such as
  `feature/task3-user-memory` to map to Task 3 ownership paths.
- Reason: `scripts/check-ownership.mjs` currently recognizes only the exact
  branch name `task-3-platform-ai`.
- Affected files: `scripts/check-ownership.mjs` and ownership CI.
- Blocks Task 3: It blocks a clean ownership check and PR workflow.

## IR-3-002 — Add authenticated production persistence

- Requested change: Introduce authentication and connect the included
  Supabase schema before onboarding real users.
- Reason: The JSON file represents one hackathon demo profile and cannot
  provide cross-user isolation.
- Affected workstream: Task 3/platform integration.
- Blocks Task 3: It does not block the single-user demo; it blocks production.

## Frontend scope

No dedicated memory UI is requested for the hackathon. Memory is demonstrated
through the existing chat and remains inspectable through `/api/memory`.
