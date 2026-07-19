# Workstream Handoff

## What currently works
The entire PocketPilot frontend demo flow using mock data. Users can go through onboarding, define their constitution, interact in the chat, view a Future Receipt for a simulated Galaxy S25 purchase, compare scenarios, and approve a Safe Purchase Plan.

## What was completed most recently
Finished Task 1: Product Experience and Frontend by implementing the UI components and Playwright E2E tests.

## Exact next task
Move to the next task in the workstreams (e.g., Task 2 for backend/integration or next steps as decided by product specs).

## Files to read first
- `src/mocks/client.ts`: The simulated data flows.
- `src/features/app-state.tsx`: The global UI state manager.
- `src/features/types.ts`: The core data interfaces.
- `tests/e2e/demo-flow.spec.ts`: The E2E tests validating the core flow.

## Important implementation details
- The UI uses Tailwind CSS v4 and vanilla CSS tokens (`src/styles/tokens.css`).
- State is managed purely with React Context (`useReducer`) - no Redux or external libs.
- The `adapter.ts` currently points to `mockPocketPilotClient` for the UI shell. This needs to be swapped when the real API client is ready.

## Commands to run
- `pnpm dev` to run the UI.
- `pnpm test:e2e` to verify the frontend functionality.

## Tests to run
- Playwright E2E tests: `pnpm test:e2e`

## Known issues
None.

## External requests
None.

## Do not change
The mock client (`src/mocks/client.ts`) and data structures should remain stable until the real API is ready to preserve the demo flow for stakeholders.

## Last verified commit
Pending final commit.
