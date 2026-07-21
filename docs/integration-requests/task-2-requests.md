# Task 2 Integration Requests

Requests from Task 2 to other workstreams.

## IR-2-001 — Publish shared finance contracts

- Requested change: Task 3 should publish the documented shared finance request/result contracts.
- Exact reason: `src/contracts/` contains no finance contracts, while Task 2 needs typed inputs and outputs.
- Current limitation: Task 2 currently owns structurally aligned internal types in
  `src/core/finance/types.ts`.
- Required contract or behavior: preserve integer `*Paise` values, ISO dates, stable warning codes,
  scenario discriminators, and the five public finance operations documented in `CONTRACT_SPEC.md`.
- Affected workstream: Task 3.
- Affected files: `src/contracts/**`; later, a Task 2 mapping boundary.
- Blocks Task 2: No. The deterministic engine and its tests work independently.
- Suggested backward-compatible solution: export the shared types without renaming or changing the
  units of existing Task 2 public fields, then add thin mapping at the Task 2 public boundary.
- Temporary workaround: Task 2 exports its internal result types from `src/core/finance/index.ts`.

## IR-2-002 — Repair the root Vitest dependency

- Requested change: declare the `@vitejs/plugin-react` dependency imported by `vitest.config.ts`,
  or remove the plugin import if root tests do not require it.
- Exact reason: both `pnpm typecheck` and `pnpm test` stop before evaluating Task 2.
- Current limitation: the root config imports a package absent from `package.json` and the lockfile.
- Required behavior: a clean install must resolve every root Vitest config import.
- Affected workstream: repository integration owner.
- Affected files: `package.json`, `pnpm-lock.yaml`, and possibly `vitest.config.ts`.
- Blocks Task 2: It blocks repository-wide typecheck, test, and build gates; it does not block the
  finance-only checks.
- Suggested backward-compatible solution: add the matching plugin as a dev dependency, retaining the
  existing config behavior.
- Temporary workaround: run `pnpm exec tsc -p tests/finance/tsconfig.json` and
  `pnpm exec vitest run --config tests/finance/vitest.config.ts`.

## IR-2-003 — Replace the obsolete lint command

- Requested change: replace the root `next lint` script with the repository's ESLint command.
- Exact reason: Next.js 16 no longer provides `next lint`; it interprets `lint` as a directory.
- Current limitation: `pnpm lint` always exits before linting source files.
- Required behavior: the root lint script must lint the repository and return a meaningful exit code.
- Affected workstream: repository integration owner.
- Affected files: `package.json` and, if needed, shared ESLint configuration.
- Blocks Task 2: It blocks the repository-wide lint gate only.
- Suggested backward-compatible solution: use `eslint .` with the existing configuration.
- Temporary workaround: `pnpm exec eslint src/core/finance tests/finance`.

## IR-2-004 — Root build inherits the missing Vitest plugin

- Requested change: resolve IR-2-002 or exclude tool-only configuration from the Next.js TypeScript
  build only if that matches the repository policy.
- Exact reason: with network access, `next build` compiles the app and then fails type checking at
  the undeclared `@vitejs/plugin-react` import in `vitest.config.ts`.
- Current limitation: a production build cannot complete from a clean install.
- Required behavior: the repository build should succeed without changing Task 2 source.
- Affected workstream: repository integration owner.
- Affected files: the same shared files as IR-2-002; possibly root TypeScript include policy.
- Blocks Task 2: It blocks the repository-wide build gate.
- Suggested backward-compatible solution: prefer declaring the missing dependency so tests and build
  share one valid root configuration.
- Temporary workaround: none for the repository build; Task 2 compiles independently.

## IR-2-005 — Make ownership CI aware of pull-request branches

- Requested change: make the ownership workflow pass the pull request head branch to the checker, or
  make the checker use `GITHUB_HEAD_REF` when Git is on a detached merge ref.
- Exact reason: PR #1's ownership job checks out `refs/pull/1/merge`; `git rev-parse --abbrev-ref
  HEAD` returns `HEAD`, which the script rejects as an unknown workstream.
- Current limitation: ownership CI fails even though local `pnpm check:ownership` passes and the diff
  contains only Task 2-owned paths.
- Required behavior: pull-request ownership checks must evaluate the actual head workstream.
- Affected workstream: repository integration owner.
- Affected files: `.github/workflows/ownership-check.yml`, `scripts/check-ownership.mjs`.
- Blocks Task 2: It blocks the PR ownership check, not Task 2 calculations.
- Suggested backward-compatible solution: resolve the branch from
  `process.env.GITHUB_HEAD_REF || gitBranch` and keep the existing allowlists unchanged.
- Temporary workaround: local `pnpm check:ownership` on `task-2-finance-engine`.

## IR-2-006 — Add a valid pnpm workspace package list

- Requested change: add a non-empty `packages` list to `pnpm-workspace.yaml`, or remove workspace mode
  if this repository is intentionally a single package.
- Exact reason: PR #1's quality job stops at `pnpm install` with
  `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION packages field missing or empty`.
- Current limitation: CI never reaches typecheck or tests.
- Required behavior: the clean CI install must succeed with the committed pnpm configuration.
- Affected workstream: repository integration owner.
- Affected files: `pnpm-workspace.yaml`; possibly `.github/workflows/quality.yml` if workspace mode is
  intentionally unused.
- Blocks Task 2: It blocks all GitHub quality checks, not local Task 2 verification.
- Suggested backward-compatible solution: declare the repository root package using the pnpm syntax
  supported by the selected pnpm version, then retain the existing build dependency settings.
- Temporary workaround: local dependency installation completed with the newer repository-selected
  package manager, and Task 2 checks pass locally.
