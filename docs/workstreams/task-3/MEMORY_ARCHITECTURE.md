# PocketPilot Memory and Personality Architecture

## Product purpose

PocketPilot should feel familiar without becoming careless. Memory may change
language, brevity and humor, but it must never change a financial calculation,
hide a Constitution warning or weaken a payment-risk response.

The hackathon experience stays inside the existing chat. There is no separate
memory screen. Judges can observe the behavior and inspect the backend,
tests, API and production schema in the repository.

## Runtime flow

1. Read the latest user message.
2. Apply explicit memory and personality commands.
3. Detect hard emergency, financial-risk and payment signals.
4. Select one deterministic response mode.
5. Retrieve at most eight relevant active memories.
6. Run Task 2 calculations and tools.
7. Let Gemini phrase the verified result within the selected mode.
8. Persist trusted user preferences, goals and purchase behavior.

Finance is upstream of personality. The model cannot promote a serious result
back into a playful mode.

## Response modes

| Mode | When used | Humor |
| --- | --- | --- |
| `EMERGENCY` | Fraud, medical issue, job loss, urgent rent or distress | Never |
| `SERIOUS` | Critical buffer or protected-floor risk | Never |
| `SUPPORTIVE` | Tight buffer or completed/payment context | No roasting |
| `NEUTRAL` | Humor disabled | None |
| `PLAYFUL` | Low-risk conversation with humor enabled | Light |
| `ROAST_LIGHT` | Low-risk conversation after explicit opt-in | Light only |

Roasting income, debt, health, identity, family obligations or financial
hardship is prohibited in every mode.

## Memory model

Each memory contains:

- owner identifier;
- kind: fact, preference, goal or behavior;
- stable key;
- short content;
- confidence;
- source and optional source message;
- creation and validity timestamps;
- optional superseded-memory link.

Only one memory for a stable key is active at a time. A correction closes the
old validity range and links the replacement to it. A user deletion removes
matching records instead of merely hiding them.

Current demo persistence lives in `src/server/db.json`. The production schema
is executable at
`supabase/migrations/20260720044831_user_memory.sql` and includes per-user row
level security.

## Trust boundaries

- Memory content is length-limited and validated before persistence.
- OTPs, PINs, passwords, card/account numbers and instruction-like content are
  rejected.
- Retrieved memories are serialized as data and explicitly marked untrusted
  in the system prompt.
- Temporary chat performs no memory reads or writes.
- Memory and humor can be disabled independently.
- The production schema isolates rows with `auth.uid()` policies.

## Retrieval

The demo uses deterministic scoring:

- active memories for the current profile only;
- preference boost;
- token overlap with the current message;
- recency and stable ID tie-breaking;
- maximum eight memories.

This is intentionally measurable. Add embeddings only when evaluation shows
that keyword retrieval misses real user memories at a meaningful rate. Add a
temporal graph service only when relationships exceed what stable keys and
validity ranges can represent.

## Judge demo

1. Say: `Speak to me in Hinglish`.
2. Say: `Roast me lightly`.
3. Ask about a low-risk purchase and observe the playful response.
4. Say: `My salary is delayed and rent is due`.
5. Observe that the same assistant becomes calm and serious.
6. Ask: `What do you remember about me?`
7. Say: `Forget that I prefer Hinglish`, then ask again.

This demonstrates persistence, correction, user control and safety without a
special frontend.

## Evaluation gates

- Same input and financial state select the same tone.
- Emergency and critical-risk cases never select a playful or roast mode.
- Payment completion never selects roast mode.
- Roast mode is impossible without opt-in.
- Memory-off and temporary-chat requests perform zero reads and writes.
- Corrected facts supersede the previous active value.
- Cross-user retrieval and deletion return no foreign records.
- Secret and prompt-injection candidates are not persisted.
- The model receives no more than eight retrieved memories.

## Production path

1. Add authentication and make `auth.uid()` the memory owner.
2. Replace JSON method bodies with Supabase queries matching the included
   schema; keep the pure policy and memory functions unchanged.
3. Add encrypted backups, retention rules and audit events.
4. Evaluate retrieval against real consented conversations.
5. Introduce pgvector, Mem0 or Graphiti only if the evaluation proves that the
   simpler store is insufficient.
