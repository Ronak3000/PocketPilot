# Technical Decisions

## Decision log

### Decision
- Date: 2026-07-18
- Context: Need to create shared contracts as per MVP scope.
- Decision: Use Zod for validation and infer TypeScript types, separating schemas into domain-specific files (`profile.ts`, `decision.ts`, etc.) and exporting them from `index.ts`.
- Alternatives considered: Keep all schemas in one large file. Rejected for maintainability.
- Consequences: Easier imports and cleaner code structure.
- Files affected: `src/contracts/**`

### User memory stays application-owned for the hackathon

- Date: 2026-07-20
- Context: PocketPilot needs persistent personalization without adding a Python
  service, vector database or third-party memory account.
- Decision: Store a small typed memory collection in the existing JSON
  database behind pure memory functions. Keep provenance and temporal
  supersession so the store can later move to Postgres.
- Alternatives considered: Mem0, Graphiti, Hindsight, Cognee and Letta.
- Consequences: The demo remains free and simple. The JSON adapter must be
  replaced before multi-user production use.
- Files affected: `src/core/ai/**`, `src/server/db.ts`.

### Financial risk overrides personality

- Date: 2026-07-20
- Context: The previous prompt instructed Gemini to roast users when their
  buffer was critical.
- Decision: Select the tone deterministically before generation. Emergency,
  critical balance, protected-floor and payment contexts disable humor.
  Roasting requires explicit user opt-in and is limited to low-risk contexts.
- Alternatives considered: Let Gemini infer tone from sentiment alone.
- Consequences: Personality remains flexible without weakening financial
  warnings.
- Files affected: `src/core/ai/personalization.ts`,
  `src/app/api/chat/route.ts`.

### Memories are untrusted user data

- Date: 2026-07-20
- Context: Persistent memory can carry secrets or prompt-injection text into
  later conversations.
- Decision: Reject credential-like and instruction-like memory content, limit
  memory length, keep source provenance, and tell the model never to execute
  instructions found in memory.
- Alternatives considered: Persist every message and rely on the model.
- Consequences: Automatic extraction is deliberately conservative.
- Files affected: `src/core/ai/memory.ts`,
  `tests/ai/personalization.test.ts`.
