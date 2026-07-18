# Technical Decisions

## Decision log

### D-001 — Exact integer money arithmetic

- Date: 2026-07-18
- Context: Currency must never depend on floating-point money intermediates.
- Decision: store paise as validated safe integers and use `BigInt` internally for multiplication,
  division, percentages, ratios, and compound EMI arithmetic. Currency division rounds half-up by
  default; floor and ceiling must be requested explicitly.
- Alternatives considered: decimal currency values; a new finance library.
- Consequences: calculations are exact and dependency-free; overflow becomes a typed finance error.
- Files affected: `src/core/finance/money/**`, `src/core/finance/emi/**`,
  `src/core/finance/goals/**`.

### D-002 — UTC ISO-date calendar

- Date: 2026-07-18
- Context: Results must be identical across timezones and month boundaries.
- Decision: accept only `YYYY-MM-DD`, convert with explicit UTC components, make ledger ranges
  inclusive, clamp day 29–31 to the last valid day, and schedule the first EMI one clamped calendar
  month after purchase.
- Alternatives considered: local `Date` parsing; adding a date library.
- Consequences: February, leap years, and month-end recurrence are deterministic without a new
  dependency.
- Files affected: `src/core/finance/dates/**`, `src/core/finance/cashflow/**`,
  `src/core/finance/emi/**`, `src/core/finance/goals/**`.

### D-003 — Stable daily event ordering

- Date: 2026-07-18
- Context: Same-day cash flow must not depend on input or object iteration order.
- Decision: apply inflows before outflows, then sort each group by event identifier. Reject duplicate
  event occurrences for the same date.
- Alternatives considered: preserve caller array order; introduce event priority configuration.
- Consequences: repeated inputs produce deeply equal ledgers with a small, documented rule.
- Files affected: `src/core/finance/cashflow/build-daily-ledger.ts`,
  `src/core/finance/dates/recurrence.ts`.

### D-004 — Explicit purchase and goal impact

- Date: 2026-07-18
- Context: A proposal's financing terms and its effect on a savings goal are separate facts.
- Decision: charge down payment and processing fee on the purchase date; charge supplied installments
  monthly; never infer an interest rate from supplied EMI; require `goalImpactPaise` when goal delay
  is evaluated. Catch-up contributions round upward.
- Alternatives considered: infer goal impact from total commitment; infer rates from EMI.
- Consequences: no down-payment/fee double counting and no invented goal behavior.
- Files affected: `src/core/finance/emi/**`, `src/core/finance/goals/**`,
  `src/core/finance/scenarios/**`.

### D-005 — Safe-to-spend protects named commitments

- Date: 2026-07-18
- Context: The engine cannot guess which future outflows are protected.
- Decision: require explicit protected event identifiers and a discoverable next income date. Count
  protected occurrences before that income, subtract the balance floor, clamp spendable values at
  zero, and expose the unclamped buffer.
- Alternatives considered: protect every outflow; silently assume no future income.
- Consequences: missing context fails explicitly and negative pressure remains visible.
- Files affected: `src/core/finance/safe-to-spend/**`.

### D-006 — Internal contract boundary

- Date: 2026-07-18
- Context: Task 3 has not yet published finance contracts in `src/contracts/`.
- Decision: keep structurally aligned Task 2 types in `src/core/finance/types.ts` and expose only five
  public operations. Record the future shared-contract mapping request rather than editing Task 3.
- Alternatives considered: modify `src/contracts/`; use untyped objects.
- Consequences: Task 2 remains independently testable and ownership-safe.
- Files affected: `src/core/finance/types.ts`, `src/core/finance/index.ts`,
  `docs/integration-requests/task-2-requests.md`.

### D-007 — Aarav fixture assumptions

- Date: 2026-07-18
- Context: `DEMO_SCENARIO.md` supplies the amounts but omits exact calendar dates and alternative
  financing terms needed for deterministic expected outputs.
- Decision: fix the simulation start/purchase at 2026-08-15; schedule salary on day 1, rent on day 3,
  family transfer and goal savings on day 5, existing EMI on day 10; model the ₹39,999 alternative
  as an explicitly supplied full-cash proposal with no processing fee. Waiting 45 days reduces the
  goal impact by one ₹8,000 contribution.
- Alternatives considered: invent interest/fees for the alternative; leave golden dates variable.
- Consequences: all corrections/assumptions are visible in the fixture and can be replaced by an
  approved demo contract without changing calculation code.
- Files affected: `tests/fixtures/aarav-phone-purchase.json`,
  `tests/finance/golden-fixture.test.ts`.
