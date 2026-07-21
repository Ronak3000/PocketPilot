import type {
  EmergencyContext,
  EmergencyOfferComparison,
} from "@/core/finance/emergency";
import type { FundingOffer } from "./providers/types";

interface EmergencyAssessmentResponse {
  offers: FundingOffer[];
  comparison: EmergencyOfferComparison;
}

export async function requestEmergencyAssessment(
  context: EmergencyContext,
): Promise<EmergencyAssessmentResponse> {
  const response = await fetch("/api/emergency/assess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context }),
  });
  const result = (await response.json()) as EmergencyAssessmentResponse & {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(result.error ?? "The emergency assessment could not be completed.");
  }
  return result;
}
