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
import { demoProfile } from "./demo-profile";
import { demoConstitution } from "./demo-constitution";
import { demoScenarioComparison } from "./demo-scenarios";
import { demoReceipt } from "./demo-receipt";
import { demoSafePlan } from "./demo-safe-plan";
import { demoSafeToSpend } from "./demo-chat-flow";

/** Simulate network delay */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** In-memory mutable state for demo */
let currentProfile = { ...demoProfile };
let currentConstitution = {
  ...demoConstitution,
  rules: demoConstitution.rules.map((r) => ({ ...r })),
};
let currentPlan = { ...demoSafePlan };
let historyEntries: HistoryEntry[] = [
  {
    id: "hist-001",
    type: "breach_prevented",
    title: "Laptop impulse buy — ₹89,999",
    status: "WARNING",
    createdAt: "2025-06-20T11:00:00Z",
  },
  {
    id: "hist-002",
    type: "goal_delay_avoided",
    title: "Switched to ₹35,999 phone instead of ₹52,999",
    status: "SAFE",
    createdAt: "2025-05-10T16:00:00Z",
  },
];

export const mockPocketPilotClient: PocketPilotClient = {
  async getProfile(): Promise<FinancialProfile> {
    await delay(300);
    return { ...currentProfile };
  },

  async updateProfile(updates: Partial<FinancialProfile>): Promise<FinancialProfile> {
    await delay(400);
    currentProfile = { ...currentProfile, ...updates, updatedAt: new Date().toISOString() };
    return { ...currentProfile };
  },

  async getConstitution(): Promise<MoneyConstitution> {
    await delay(300);
    return {
      ...currentConstitution,
      rules: currentConstitution.rules.map((r) => ({ ...r })),
    };
  },

  async updateConstitution(updates: { rules: ConstitutionRule[] }): Promise<MoneyConstitution> {
    await delay(400);
    currentConstitution = {
      ...currentConstitution,
      rules: updates.rules.map((r) => ({ ...r })),
      updatedAt: new Date().toISOString(),
    };
    return {
      ...currentConstitution,
      rules: currentConstitution.rules.map((r) => ({ ...r })),
    };
  },

  async submitDecision(input: DecisionInput): Promise<ExtractedDecision> {
    await delay(800);
    return {
      id: "extracted-001",
      decisionInputId: input.id,
      productName: "Samsung Galaxy S25 Ultra",
      pricePaise: 5_999_900,
      downPaymentPaise: 1_200_000,
      emiAmountPaise: 450_000,
      tenureMonths: 12,
      processingFeePaise: 149_900,
      confidence: 0.94,
      missingFields: [],
      createdAt: new Date().toISOString(),
    };
  },

  async getScenarios(): Promise<ScenarioComparison> {
    await delay(1500);
    return { ...demoScenarioComparison };
  },

  async getReceipt(): Promise<FutureReceipt> {
    await delay(600);
    return { ...demoReceipt };
  },

  async getSafePlan(): Promise<ActionPlan> {
    await delay(500);
    return { ...currentPlan };
  },

  async getSafeToSpend(): Promise<SafeToSpend> {
    await delay(300);
    return { ...demoSafeToSpend };
  },

  async approvePlan(): Promise<ActionPlan> {
    await delay(600);
    currentPlan = { ...currentPlan, status: "approved" };
    historyEntries = [
      {
        id: `hist-${Date.now()}`,
        type: "plan_approved",
        title: "Samsung Galaxy S25 Ultra — Safe Plan Approved",
        status: "SAFE",
        plan: { ...currentPlan },
        createdAt: new Date().toISOString(),
      },
      ...historyEntries,
    ];
    return { ...currentPlan };
  },

  async getHistory(): Promise<HistoryEntry[]> {
    await delay(300);
    return historyEntries.map((h) => ({ ...h }));
  },

  async resetDemo(): Promise<void> {
    await delay(200);
    currentProfile = { ...demoProfile };
    currentConstitution = {
      ...demoConstitution,
      rules: demoConstitution.rules.map((r) => ({ ...r })),
    };
    currentPlan = { ...demoSafePlan };
    historyEntries = [
      {
        id: "hist-001",
        type: "breach_prevented",
        title: "Laptop impulse buy — ₹89,999",
        status: "WARNING",
        createdAt: "2025-06-20T11:00:00Z",
      },
      {
        id: "hist-002",
        type: "goal_delay_avoided",
        title: "Switched to ₹35,999 phone instead of ₹52,999",
        status: "SAFE",
        createdAt: "2025-05-10T16:00:00Z",
      },
    ];
  },
};
