# Emergency Funding Assist — Decisions

## 2026-07-21 — Keep lending simulated

- **Context:** PocketPilot is not a lender or regulated loan marketplace.
- **Decision:** Use fictional providers, explicit simulation labels, neutral
  eligibility language, and no real application or disbursal claim.
- **Alternatives:** Integrate a lender sandbox or invent partner offers.
- **Consequence:** The demo is honest and safe; production lending requires a
  regulated partner, legal review, KYC, consent, and audit controls.
- **Files:** `src/features/emergency/providers/**`, emergency UI components.

## 2026-07-21 — Assess terms on the server

- **Context:** Browser-created loan terms could be tampered with.
- **Decision:** One validated endpoint creates mock terms and runs the pure
  finance engine. The browser only sends context the user consented to use.
- **Alternatives:** Client-only assessment or a multi-service architecture.
- **Consequence:** A trustworthy demo boundary without a new dependency or
  unnecessary service layer.
- **Files:** `src/app/api/emergency/assess/route.ts`,
  `src/features/emergency/api.ts`.

## 2026-07-21 — Money and dates stay deterministic

- **Context:** Financial projections must reproduce exactly.
- **Decision:** Store money as integer paise, reuse Task 2 EMI/date/ledger
  primitives, require explicit ISO dates, and use stable safety-first sorting.
- **Alternatives:** Floating-point rupees, browser locale dates, or LLM math.
- **Consequence:** Same input produces the same reviewed output in every run.
- **Files:** `src/core/finance/emergency/**`, finance tests and fixture.

## 2026-07-21 — Never invent missing context or unnecessary credit

- **Context:** Missing financial data and zero are not equivalent.
- **Decision:** Require explicit inputs, allow explicit zero, and return no loan
  comparison when available funds fully cover the emergency.
- **Alternatives:** Default absent fields to zero or always show offers.
- **Consequence:** The flow may ask more questions but avoids unsafe results.
- **Files:** context validator, manual form, assessment endpoint.

## 2026-07-21 — Aggregate obligation scheduling

- **Context:** The profile has monthly totals but no dates for rent, family
  transfers, existing EMIs, or goal contributions.
- **Decision:** Forecast them deterministically on consecutive days immediately
  after monthly income and document the assumption.
- **Alternatives:** Invent dates or ignore obligations.
- **Consequence:** The forecast protects all totals but must be upgraded when
  dated transactions become available.
- **Files:** `src/core/finance/emergency/build-emergency-ledger.ts`.

## 2026-07-21 — Emergency tone overrides humor

- **Context:** Gen-Z humor is harmful during medical or financial distress.
- **Decision:** Deterministic emergency detection opens a serious flow before an
  LLM request. “Emergency fund planning” is not treated as a crisis.
- **Alternatives:** Let the LLM decide tone for every message.
- **Consequence:** Critical flows do not depend on model availability or mood.
- **Files:** personalization, chat workspace, emergency hook.
