import type { ChatMessage, SafeToSpend } from "@/features/types";

/**
 * Scripted chat flow for the golden demo scenario.
 * Each step is a group of messages delivered together or sequentially.
 */

export const demoSafeToSpend: SafeToSpend = {
  safeAmountPaise: 1_750_000,    // ₹17,500
  protectedAmountPaise: 3_050_000, // ₹30,500 (rent + family + EMI + savings)
  upcomingCommitmentPaise: 350_000, // ₹3,500 (existing EMI due)
  bufferQuality: "good",
  confidence: 0.92,
  lastCalculatedAt: "2025-07-15T14:00:00Z",
};

export type DemoChatStep =
  | "greeting"
  | "ask-phone"
  | "missing-salary-date"
  | "fill-salary-date"
  | "missing-existing-emi"
  | "fill-existing-emi"
  | "analyzing"
  | "receipt"
  | "scenarios"
  | "safe-plan";

export const demoChatMessages: Record<DemoChatStep, ChatMessage[]> = {
  greeting: [
    {
      id: "msg-001",
      role: "assistant",
      type: "text",
      content:
        "Hey Aarav! 👋 I'm PocketPilot — your pre-spend decision companion. Tell me what you're thinking of buying, and I'll show you exactly how it fits your finances.",
      timestamp: "2025-07-15T14:00:00Z",
    },
  ],

  "ask-phone": [
    {
      id: "msg-002",
      role: "user",
      type: "text",
      content:
        "Can I afford the Samsung Galaxy S25 Ultra? It's ₹59,999 with 12 month EMI, ₹12,000 down payment, ₹4,500/month EMI, and ₹1,499 processing fee.",
      timestamp: "2025-07-15T14:01:00Z",
    },
  ],

  "missing-salary-date": [
    {
      id: "msg-003",
      role: "assistant",
      type: "missing-context",
      content: "Got it — I need a couple more details to give you an accurate picture. When does your salary usually hit your account?",
      quickFillOptions: [
        { id: "qf-1", label: "1st of month", value: "1", field: "salaryDay" },
        { id: "qf-2", label: "Last working day", value: "28", field: "salaryDay" },
        { id: "qf-3", label: "15th of month", value: "15", field: "salaryDay" },
      ],
      timestamp: "2025-07-15T14:01:05Z",
    },
  ],

  "fill-salary-date": [
    {
      id: "msg-004",
      role: "user",
      type: "text",
      content: "1st of month",
      timestamp: "2025-07-15T14:01:15Z",
    },
  ],

  "missing-existing-emi": [
    {
      id: "msg-005",
      role: "assistant",
      type: "missing-context",
      content: "Thanks! One more — do you have any existing EMI commitments?",
      quickFillOptions: [
        { id: "qf-4", label: "₹3,500/month", value: "350000", field: "existingEmiPaise" },
        { id: "qf-5", label: "No existing EMI", value: "0", field: "existingEmiPaise" },
      ],
      timestamp: "2025-07-15T14:01:20Z",
    },
  ],

  "fill-existing-emi": [
    {
      id: "msg-006",
      role: "user",
      type: "text",
      content: "₹3,500/month",
      timestamp: "2025-07-15T14:01:30Z",
    },
  ],

  analyzing: [
    {
      id: "msg-007",
      role: "assistant",
      type: "loading",
      content: "Analyzing your financial picture and simulating three possible futures…",
      timestamp: "2025-07-15T14:01:35Z",
    },
  ],

  receipt: [
    {
      id: "msg-008",
      role: "assistant",
      type: "text",
      content: "Here's your Future Receipt — a complete picture of how this purchase affects your finances:",
      timestamp: "2025-07-15T14:02:00Z",
    },
    {
      id: "msg-009",
      role: "assistant",
      type: "receipt",
      content: "",
      timestamp: "2025-07-15T14:02:01Z",
    },
  ],

  scenarios: [
    {
      id: "msg-010",
      role: "assistant",
      type: "text",
      content: "I've also simulated two alternatives. Here's how they compare:",
      timestamp: "2025-07-15T14:02:05Z",
    },
    {
      id: "msg-011",
      role: "assistant",
      type: "scenarios",
      content: "",
      timestamp: "2025-07-15T14:02:06Z",
    },
  ],

  "safe-plan": [
    {
      id: "msg-012",
      role: "assistant",
      type: "text",
      content: "Based on the analysis, here's a safer purchase plan if you'd like to wait:",
      timestamp: "2025-07-15T14:02:10Z",
    },
    {
      id: "msg-013",
      role: "assistant",
      type: "safe-plan",
      content: "",
      timestamp: "2025-07-15T14:02:11Z",
    },
  ],
};

/**
 * The ordered sequence of demo steps for auto-play
 */
export const demoChatSequence: DemoChatStep[] = [
  "greeting",
  "ask-phone",
  "missing-salary-date",
  "fill-salary-date",
  "missing-existing-emi",
  "fill-existing-emi",
  "analyzing",
  "receipt",
  "scenarios",
  "safe-plan",
];
