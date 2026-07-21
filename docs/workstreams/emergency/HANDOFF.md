# Emergency Funding Assist — Handoff

## What works

The real chat screen detects supported emergencies before calling the LLM. The
user sees a serious-mode flow, enters the amount and deadline, gives consent or
enters context manually, reviews the funding gap and non-credit alternatives,
then sees server-assessed mock offers and a clearly simulated handoff.

## Public boundary

- `POST /api/emergency/assess` accepts `{ context: EmergencyContext }`.
- It validates ISO dates, safe integer paise, category, goal data, and optional
  Constitution limits.
- It returns `{ offers, comparison }` and never accepts client-authored terms.
- `assessEmergencyAffordability` and `compareEmergencyFundingOffers` remain pure
  finance functions.

## Verified calculations

The Aarav fixture checks funding gap, exact EMI, fees, total repayment,
EMI-to-income ratio, minimum balance, negative-balance days, deadline,
repayment date, goal delay, Constitution conflicts, reason codes, safety order,
determinism, and input immutability.

For a ₹1,00,000 gap, the safety order is Demo Beta, Demo Alpha, then Demo Gamma.
This is a deterministic comparison of shown simulations, not a recommendation.

## Read first

1. `src/features/emergency/useEmergencyAssist.tsx`
2. `src/features/emergency/EmergencyAssistFlow.tsx`
3. `src/app/api/emergency/assess/route.ts`
4. `src/core/finance/emergency/assess-affordability.ts`
5. `src/core/finance/emergency/build-emergency-ledger.ts`
6. `tests/finance/emergency-affordability.test.ts`
7. `tests/e2e/emergency-flow.spec.ts`

## Commands

```text
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm test:e2e
pnpm check:ownership
pnpm verify:handoff
```

## Important assumptions

- `alreadyAvailablePaise` is part of the current account balance and is used
  toward the emergency payment.
- Loan disbursal, emergency payment, and fees occur on the simulated disbursal
  date; the first new EMI is one calendar month later, month-end clamped.
- Exact protected-obligation dates are unavailable, so monthly totals are
  placed immediately after the supplied next-income date.
- Offers are sorted by deadline, negative-balance risk, protected commitments,
  Constitution compliance, total repayment, then stable ID.

## Next production work

1. Replace the mock adapter only after selecting an RBI-regulated partner and
   completing legal, consent, KYC, bureau, audit, and grievance requirements.
2. Add authenticated server-side user identity and encrypted persistent storage.
3. Feed verified, dated bank transactions into the ledger rather than monthly
   aggregate timing assumptions.
4. Add idempotency, rate limiting, audit events, and provider timeout handling.

## Do not change

- Do not call mock offers approvals or imply a lender partnership.
- Do not use the LLM for financial arithmetic, eligibility, or emergency tone.
- Do not default missing financial context to zero.
- Do not commit `.env.local`, API keys, runtime DB contents, or reports.
- Do not merge or push directly to `main`.

## Last verified implementation commit

`2cf57cb`. Documentation is committed separately after this verified revision.
