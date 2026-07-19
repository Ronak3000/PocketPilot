import type { PocketPilotClient } from "@/features/types";
import { apiPocketPilotClient } from "./api-client";

/**
 * PocketPilot client — always uses real API routes.
 * The API routes handle all data persistence and finance calculations.
 */
export const pocketPilotClient: PocketPilotClient = apiPocketPilotClient;
