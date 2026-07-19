// ─────────────────────────────────────────────
// PocketPilot Shared Types
// Mirrors CONTRACT_SPEC.md naming conventions:
//   - Money values end in `Paise` (integers)
//   - Dates use ISO YYYY-MM-DD
//   - Date-times use ISO 8601
//   - Identifiers are strings
//   - AI confidence: 0–1
// ─────────────────────────────────────────────

// ── Core Financial Profile ──

export interface FinancialProfile {
  id: string;
  name: string;
  currentBalancePaise: number;
  monthlySalaryPaise: number;
  salaryDay: number;
  rentPaise: number;
  familyTransferPaise: number;
  existingEmiPaise: number;
  monthlySavingsTargetPaise: number;
  protectedBalanceFloorPaise: number;
  emergencyFundGoalPaise: number;
  emergencyFundCurrentPaise: number;
  personaMode?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Money Constitution ──

export type RuleCategory =
  | "floor"
  | "ceiling"
  | "ratio"
  | "protection"
  | "goal";

export type ThresholdType =
  | "amount_paise"
  | "percentage"
  | "months"
  | "days";

export interface ConstitutionRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  enabled: boolean;
  locked: boolean;
  thresholdType: ThresholdType;
  thresholdValue: number;
  reasonCode: string;
  icon?: string;
  createdAt: string;
}

export interface MoneyConstitution {
  id: string;
  profileId: string;
  rules: ConstitutionRule[];
  createdAt: string;
  updatedAt: string;
}

// ── Financial Events ──

export type EventType =
  | "income"
  | "expense"
  | "emi"
  | "transfer"
  | "savings";

export interface FinancialEvent {
  id: string;
  type: EventType;
  label: string;
  amountPaise: number;
  date: string;
  recurring: boolean;
  dayOfMonth?: number;
}

// ── Decision Input ──

export type DecisionInputType =
  | "text"
  | "screenshot"
  | "link"
  | "manual"
  | "demo";

export interface DecisionInput {
  id: string;
  type: DecisionInputType;
  rawText?: string;
  imageUrl?: string;
  productUrl?: string;
  manualEntry?: {
    productName: string;
    pricePaise: number;
    downPaymentPaise?: number;
    emiAmountPaise?: number;
    tenureMonths?: number;
    processingFeePaise?: number;
  };
  createdAt: string;
}

// ── Extracted Decision ──

export interface ExtractedDecision {
  id: string;
  decisionInputId: string;
  productName: string;
  pricePaise: number;
  downPaymentPaise?: number;
  emiAmountPaise?: number;
  tenureMonths?: number;
  processingFeePaise?: number;
  confidence: number;
  missingFields: string[];
  createdAt: string;
}

// ── Scenario ──

export type ScenarioType =
  | "buy_now"
  | "wait"
  | "cheaper_alternative"
  | "custom";

export interface ScenarioInput {
  id: string;
  profileId: string;
  extractedDecisionId: string;
  scenarioType: ScenarioType;
  label: string;
  waitDays?: number;
  alternativePricePaise?: number;
  alternativeDownPaymentPaise?: number;
  alternativeEmiPaise?: number;
  alternativeTenureMonths?: number;
}

// ── Daily Ledger ──

export interface DailyLedgerEntry {
  date: string;
  label: string;
  amountPaise: number;
  balancePaise: number;
  isIncome: boolean;
  isCommitment: boolean;
  breachesFloor: boolean;
}

export interface ProjectedBalance {
  date: string;
  balancePaise: number;
}

// ── Constitution Evaluation ──

export type EvaluationSeverity = "info" | "warning" | "breach";

export interface ConstitutionEvaluation {
  ruleId: string;
  ruleName: string;
  reasonCode: string;
  severity: EvaluationSeverity;
  message: string;
  currentValue: number;
  thresholdValue: number;
}

// ── Scenario Result ──

export type ReceiptStatus = "SAFE" | "CAUTION" | "WARNING" | "BREACH";

export interface ScenarioResult {
  id: string;
  scenarioInputId: string;
  scenarioType: ScenarioType;
  label: string;
  status: ReceiptStatus;
  lowestBalancePaise: number;
  lowestBalanceDate: string;
  lowBalanceDays: number;
  negativeBalanceDays: number;
  goalDelayDays: number;
  totalCommittedPaise: number;
  emiToIncomeRatio: number;
  constitutionConflicts: ConstitutionEvaluation[];
  recommendation: string;
  dailyLedger: DailyLedgerEntry[];
  projectedBalances: ProjectedBalance[];
}

// ── Scenario Comparison ──

export interface ScenarioComparison {
  id: string;
  scenarios: ScenarioResult[];
  recommendedScenarioId: string;
  comparisonSummary: string;
}

// ── Future Receipt ──

export interface FutureReceipt {
  id: string;
  scenarioResultId: string;
  status: ReceiptStatus;
  productName: string;
  listedPricePaise: number;
  upfrontPaymentPaise: number;
  emiAmountPaise: number;
  tenureMonths: number;
  processingFeePaise: number;
  totalCommittedPaise: number;
  commitmentEndDate: string;
  lowestProjectedBalancePaise: number;
  lowestBalanceDate: string;
  lowBalanceDays: number;
  negativeBalanceDays: number;
  goalDelayDays: number;
  emiBurdenPercent: number;
  constitutionConflicts: ConstitutionEvaluation[];
  assumptions: string[];
  confidence: number;
  recommendation: string;
  dailyLedger: DailyLedgerEntry[];
  projectedBalances: ProjectedBalance[];
  createdAt: string;
}

// ── Action Plan ──

export type PlanStatus = "draft" | "approved" | "expired";

export interface ActionPlan {
  id: string;
  receiptId: string;
  recommendedDate: string;
  maxPricePaise: number;
  requiredDownPaymentPaise: number;
  maxEmiPaise: number;
  maxTenureMonths: number;
  requiredBalanceBeforePurchasePaise: number;
  invalidationConditions: string[];
  status: PlanStatus;
  createdAt: string;
}

// ── Safe To Spend ──

export type BufferQuality = "excellent" | "good" | "tight" | "critical";

export interface SafeToSpend {
  safeAmountPaise: number;
  protectedAmountPaise: number;
  upcomingCommitmentPaise: number;
  bufferQuality: BufferQuality;
  confidence: number;
  lastCalculatedAt: string;
}

// ── Chat ──

export type MessageRole = "user" | "assistant" | "system";

export type MessageType =
  | "text"
  | "receipt"
  | "scenarios"
  | "safe-to-spend"
  | "safe-plan"
  | "missing-context"
  | "loading";

export interface QuickFillOption {
  id: string;
  label: string;
  value: string;
  field: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  data?: FutureReceipt | ScenarioComparison | SafeToSpend | ActionPlan;
  quickFillOptions?: QuickFillOption[];
  timestamp: string;
}

// ── History ──

export type HistoryEntryType =
  | "receipt"
  | "plan_approved"
  | "abandoned"
  | "goal_delay_avoided"
  | "breach_prevented";

export interface HistoryEntry {
  id: string;
  type: HistoryEntryType;
  title: string;
  status: ReceiptStatus;
  receipt?: FutureReceipt;
  plan?: ActionPlan;
  createdAt: string;
}

// ── App State ──

export type AppView = "onboarding" | "chat" | "constitution" | "history";

export interface AppState {
  view: AppView;
  profile: FinancialProfile | null;
  constitution: MoneyConstitution | null;
  messages: ChatMessage[];
  activeReceipt: FutureReceipt | null;
  activeComparison: ScenarioComparison | null;
  activePlan: ActionPlan | null;
  safeToSpend: SafeToSpend | null;
  history: HistoryEntry[];
  isOnboarded: boolean;
  isDemoMode: boolean;
  isSidebarOpen: boolean;
}

// ── Client Adapter Interface ──

export interface PocketPilotClient {
  getProfile(): Promise<FinancialProfile>;
  updateProfile(profile: Partial<FinancialProfile>): Promise<FinancialProfile>;
  getConstitution(): Promise<MoneyConstitution>;
  updateConstitution(updates: { rules: ConstitutionRule[] }): Promise<MoneyConstitution>;
  submitDecision(input: DecisionInput): Promise<ExtractedDecision>;
  getScenarios(decisionId: string): Promise<ScenarioComparison>;
  getReceipt(scenarioId: string): Promise<FutureReceipt>;
  getSafePlan(receiptId: string): Promise<ActionPlan>;
  getSafeToSpend(): Promise<SafeToSpend>;
  approvePlan(planId: string): Promise<ActionPlan>;
  getHistory(): Promise<HistoryEntry[]>;
  resetDemo(): Promise<void>;
}
