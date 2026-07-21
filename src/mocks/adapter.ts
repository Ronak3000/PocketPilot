import type { PocketPilotClient } from "@/features/types";
import { apiPocketPilotClient } from "./api-client";
import { mockPocketPilotClient } from "./client";

/**
 * The public flag provides a deterministic demo without changing callers.
 */
export const pocketPilotClient: PocketPilotClient =
  process.env.NEXT_PUBLIC_USE_MOCKS === "true"
    ? mockPocketPilotClient
    : apiPocketPilotClient;
