# Workstream Handoff

## What currently works

- The framework-free deterministic finance engine is implemented under `src/core/finance/`.
- All money is integer paise with explicit validation and rounding.
- UTC ISO dates, recurrence, daily ledgers, risk metrics, EMI, goals, Constitution rules,
  safe-to-spend, scenarios, comparison, and stable warnings work independently.
- The Aarav golden fixture covers buy now, wait 45 days, and the ₹39,999 alternative over 730 days.

## What was completed most recently

- Added explicit invalid-input boundaries and tests.
- Replaced the remaining floating division of money values in goal-period calculation with exact
  integer arithmetic.
- Verified 10 finance test files / 42 tests, finance typecheck, and finance lint.

## Current public API

- `simulateScenario(input: ScenarioInput): ScenarioResult`
- `compareScenarios(inputs: ScenarioInput[]): ScenarioComparison`
- `evaluateConstitution(result, constitution): ConstitutionEvaluation`
- `calculateSafeToSpend(input: SafeToSpendInput): SafeToSpendResult`
- `calculateGoalDelay(input: GoalDelayInput): GoalDelayResult`

## Verified calculations

- Buy now: minimum balance ₹58,501; total commitment ₹67,499; EMI ratio 16.67%; goal delay
  274 days; first/final EMI 2026-09-15 / 2027-08-15.
- Wait 45 days: minimum balance ₹72,000; total commitment ₹67,499; EMI ratio 16.67%; goal delay
  245 days; first/final EMI 2026-10-29 / 2027-09-29.
- ₹39,999 alternative: minimum balance ₹32,001; total commitment ₹39,999; existing-only EMI ratio
  7.29%; goal delay 153 days; no new EMI.
- All three have zero negative- and low-balance days with the fixture's ₹10,000 floor.

## Exact next unfinished function

None inside Task 2. The next integration step is mapping Task 3's future shared finance contracts to
the public boundary without changing the calculation modules.

## Files to read first

1. `docs/workstreams/task-2/DECISIONS.md`
2. `src/core/finance/index.ts`
3. `src/core/finance/types.ts`
4. `src/core/finance/scenarios/simulate-buy-now.ts`
5. `tests/fixtures/aarav-phone-purchase.json`
6. `docs/integration-requests/task-2-requests.md`

## Important implementation details

- Ranges are inclusive; a 730-day horizon contains exactly 730 ledger rows.
- Same-day inflows precede outflows; each group is sorted by event id.
- Day 29–31 recurrence clamps to month end.
- Down payment and processing fee occur on purchase day; first EMI is one month later.
- Warning order is severity, date, code, then rule id.
- Safe-to-spend requires named protected events and the next scheduled income.
- Inputs are not mutated.

## Commands and tests to run

```bash
pnpm exec tsc -p tests/finance/tsconfig.json
pnpm exec eslint src/core/finance tests/finance
pnpm exec vitest run --config tests/finance/vitest.config.ts
pnpm check:ownership
```

Passing: finance typecheck, finance lint, 10 files / 42 tests.

Failing shared gates:

- `pnpm typecheck`, `pnpm test`, and `pnpm build`: missing `@vitejs/plugin-react`.
- `pnpm lint`: obsolete `next lint` script.
- PR ownership check: detached pull-request merge checkout is identified as branch `HEAD`.
- PR quality check: `pnpm install` rejects the workspace config before tests run.

## Known assumptions

- See D-007 for the exact Aarav calendar and cash-alternative assumptions.
- Annual interest is nominal basis points; monthly basis points are annual divided by 12, half-up.
- Goal impact is an explicit scenario input and is never inferred.

## Known issues and contract mismatches

- `src/contracts/` has no Task 3 finance contracts. Internal Task 2 types are intentionally isolated.
- Root verification defects are outside Task 2 ownership and documented as integration requests.

## External requests

- IR-2-001 through IR-2-006 in `docs/integration-requests/task-2-requests.md`.

## Golden fixture status

Verified and passing. Expected values include commitment breakdown, EMI dates, minimum/risk days,
goal delay, ratio, and Constitution warning codes for all three scenarios.

## Do not change

- Do not change money units from paise or date units from ISO calendar dates.
- Do not infer missing rates, alternative terms, protected commitments, or goal impact.
- Do not shift unrelated commitments in delayed scenarios.
- Do not expose internal helpers from `index.ts`.

## Last verified commit

Task 2 source and tests: `edbe216d6978d9f2a0753af760a2c2edd12111b6`.
