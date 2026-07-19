import type {
  PocketPilotClient,
  FinancialProfile,
  MoneyConstitution,
  ConstitutionRule,
  DecisionInput,
  ExtractedDecision,
  ScenarioComparison,
  FutureReceipt,
  ActionPlan,
  SafeToSpend,
  HistoryEntry,
} from "@/features/types";

/**
 * API client stub — calls Next.js API routes.
 * Will be implemented when Task 3 creates the backend.
 * For now, all methods throw to surface accidental usage.
 */

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const apiPocketPilotClient: PocketPilotClient = {
  async getProfile(): Promise<FinancialProfile> {
    return apiFetch("/api/profile");
  },

  async updateProfile(updates: Partial<FinancialProfile>): Promise<FinancialProfile> {
    return apiFetch("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  async getConstitution(): Promise<MoneyConstitution> {
    return apiFetch("/api/constitution");
  },

  async updateConstitution(updates: { rules: ConstitutionRule[] }): Promise<MoneyConstitution> {
    return apiFetch("/api/constitution", {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  async submitDecision(input: DecisionInput): Promise<ExtractedDecision> {
    return apiFetch("/api/decision", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async getScenarios(decisionId: string): Promise<ScenarioComparison> {
    return apiFetch(`/api/scenarios?decisionId=${decisionId}`);
  },

  async getReceipt(scenarioId: string): Promise<FutureReceipt> {
    return apiFetch(`/api/receipt?scenarioId=${scenarioId}`);
  },

  async getSafePlan(receiptId: string): Promise<ActionPlan> {
    return apiFetch(`/api/plan?receiptId=${receiptId}`);
  },

  async getSafeToSpend(): Promise<SafeToSpend> {
    return apiFetch("/api/safe-to-spend");
  },

  async approvePlan(planId: string): Promise<ActionPlan> {
    return apiFetch(`/api/plan/${planId}/approve`, { method: "POST" });
  },

  async getHistory(): Promise<HistoryEntry[]> {
    return apiFetch("/api/history");
  },

  async resetDemo(): Promise<void> {
    await apiFetch("/api/reset", { method: "POST" });
  },
};
