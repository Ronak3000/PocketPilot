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

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error: ${res.status} ${res.statusText} — ${text}`);
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

  async getScenarios(): Promise<ScenarioComparison> {
    return apiFetch("/api/scenarios");
  },

  async getReceipt(): Promise<FutureReceipt> {
    return apiFetch("/api/receipt");
  },

  async getSafePlan(): Promise<ActionPlan> {
    return apiFetch("/api/plan");
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
