# Contract Specification

Initial shared conceptual contracts for PocketPilot.

## Contracts
- FinancialProfile
- MoneyConstitution
- ConstitutionRule
- FinancialEvent
- DecisionInput
- ExtractedDecision
- ScenarioInput
- ScenarioResult
- ScenarioComparison
- ConstitutionEvaluation
- FutureReceipt
- ActionPlan

## Principles
- Money values end in `Paise` (integers).
- Dates use ISO `YYYY-MM-DD`.
- Date-times use ISO 8601.
- Identifiers are strings.
- Existing fields cannot be renamed or removed without approval.
- New fields should be optional unless jointly approved.
- Every calculated warning uses a stable reason code.
- AI confidence ranges from 0 to 1.
