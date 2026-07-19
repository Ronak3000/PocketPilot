import type { PocketPilotClient } from "@/features/types";
import { mockPocketPilotClient } from "./client";
import { apiPocketPilotClient } from "./api-client";

/**
 * Adapter switch — reads NEXT_PUBLIC_USE_MOCKS to decide which client to use.
 * Default: mock client (demo mode).
 */
const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

export const pocketPilotClient: PocketPilotClient = useMocks
  ? mockPocketPilotClient
  : apiPocketPilotClient;
