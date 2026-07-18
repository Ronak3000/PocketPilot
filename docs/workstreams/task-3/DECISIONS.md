# Technical Decisions

## Decision log

### Decision
- Date: 2026-07-18
- Context: Need to create shared contracts as per MVP scope.
- Decision: Use Zod for validation and infer TypeScript types, separating schemas into domain-specific files (`profile.ts`, `decision.ts`, etc.) and exporting them from `index.ts`.
- Alternatives considered: Keep all schemas in one large file. Rejected for maintainability.
- Consequences: Easier imports and cleaner code structure.
- Files affected: `src/contracts/**`
