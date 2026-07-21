export type IsoDate = string;
export type Paise = number;
export type BasisPoints = number;

export type FinancialEventKind =
  | "income"
  | "salary"
  | "rent"
  | "bill"
  | "family_transfer"
  | "existing_emi"
  | "new_emi"
  | "goal_contribution"
  | "subscription"
  | "purchase"
  | "processing_fee"
  | "other";

interface EventBase {
  id: string;
  title: string;
  amountPaise: Paise;
  direction: "inflow" | "outflow";
  kind: FinancialEventKind;
  protected?: boolean;
}

export type FinancialEvent =
  | (EventBase & { schedule: "once"; date: IsoDate })
  | (EventBase & {
      schedule: "recurring";
      startDate: IsoDate;
      endDate?: IsoDate;
      frequency: "weekly" | "monthly";
      interval?: number;
      dayOfMonth?: number;
    });

export interface AppliedFinancialEvent {
  id: string;
  title: string;
  amountPaise: Paise;
  direction: "inflow" | "outflow";
  kind: FinancialEventKind;
  protected: boolean;
}

export type DailyRiskIndicator = "BELOW_PROTECTED_FLOOR" | "NEGATIVE_BALANCE";

export interface DailyLedgerEntry {
  date: IsoDate;
  openingBalancePaise: Paise;
  inflowsPaise: Paise;
  outflowsPaise: Paise;
  closingBalancePaise: Paise;
  appliedEvents: AppliedFinancialEvent[];
  riskIndicators: DailyRiskIndicator[];
}

export interface LedgerInput {
  startDate: IsoDate;
  endDate?: IsoDate;
  horizonDays?: number;
  startingBalancePaise: Paise;
  events: FinancialEvent[];
  protectedBalanceFloorPaise?: Paise;
  lowBalanceThresholdPaise?: Paise;
}

export interface PurchaseProposal {
  id: string;
  title: string;
  listedPricePaise: Paise;
  purchaseDate: IsoDate;
  downPaymentPaise: Paise;
  processingFeePaise: Paise;
  monthlyEmiPaise?: Paise;
  tenureMonths?: number;
  annualInterestBasisPoints?: BasisPoints;
  monthlyInterestBasisPoints?: BasisPoints;
}

export interface EmiCalculationInput {
  principalPaise: Paise;
  tenureMonths: number;
  annualInterestBasisPoints?: BasisPoints;
  monthlyInterestBasisPoints?: BasisPoints;
}

export interface EmiCalculationResult {
  monthlyEmiPaise: Paise;
  monthlyInterestBasisPoints: BasisPoints;
  rounding: "half-up";
}

export interface EmiCommitmentResult {
  principalFinancedPaise: Paise;
  monthlyEmiPaise: Paise;
  installmentCount: number;
  totalInstallmentCommitmentPaise: Paise;
  downPaymentPaise: Paise;
  processingFeePaise: Paise;
  totalCommittedCostPaise: Paise;
  firstEmiDate: IsoDate | null;
  commitmentEndingDate: IsoDate | null;
}

export interface GoalInput {
  id: string;
  targetAmountPaise: Paise;
  currentAmountPaise: Paise;
  monthlyContributionPaise: Paise;
  contributionDayOfMonth: number;
  startDate: IsoDate;
}

export interface GoalDateResult {
  completed: boolean;
  completionDate: IsoDate | null;
  contributionPeriods: number | null;
}

export interface GoalDelayInput {
  goal: GoalInput;
  impactPaise?: Paise;
  missedContributionPeriods?: number;
}

export interface GoalDelayResult {
  originalCompletionDate: IsoDate | null;
  newCompletionDate: IsoDate | null;
  goalDelayDays: number | null;
  missedContributionPeriods: number;
  requiredCatchUpContributionPaise: Paise;
  goalProtectionBreached: boolean;
}

export type ScenarioWarningCode =
  | "MINIMUM_BALANCE_BREACH"
  | "EMI_RATIO_EXCEEDED"
  | "EMI_DURATION_EXCEEDED"
  | "GOAL_DELAYED"
  | "INCOME_DEPENDENCY"
  | "NEGATIVE_BALANCE"
  | "LOW_CONFIDENCE_INCOME"
  | "PROTECTED_EXPENSE_AT_RISK"
  | "SAVINGS_TARGET_MISSED"
  | "RECURRING_COST_UNSUSTAINABLE"
  | "GUILT_FREE_ALLOWANCE_EXCEEDED";

export type WarningSeverity = "info" | "caution" | "warning" | "breach";

export interface ScenarioWarning {
  code: ScenarioWarningCode;
  severity: WarningSeverity;
  ruleId?: string;
  threshold?: number;
  actualValue?: number;
  date?: IsoDate;
  dateRange?: { startDate: IsoDate; endDate: IsoDate };
  data: Record<string, string | number | boolean | null>;
}

interface ConstitutionRuleBase {
  id: string;
  enabled: boolean;
  severity: WarningSeverity;
}

export type ConstitutionRule =
  | (ConstitutionRuleBase & { type: "minimum_balance"; thresholdPaise: Paise })
  | (ConstitutionRuleBase & { type: "maximum_emi_ratio"; maximumBasisPoints: BasisPoints })
  | (ConstitutionRuleBase & { type: "maximum_emi_tenure"; maximumMonths: number })
  | (ConstitutionRuleBase & { type: "savings_target"; targetPaise: Paise })
  | (ConstitutionRuleBase & { type: "protected_expense" })
  | (ConstitutionRuleBase & { type: "goal_protection"; maximumDelayDays: number })
  | (ConstitutionRuleBase & { type: "guilt_free_allowance"; maximumPurchasePaise: Paise })
  | (ConstitutionRuleBase & { type: "income_confidence"; minimumConfidence: number });

export interface MoneyConstitution {
  id: string;
  rules: ConstitutionRule[];
}

export interface ConstitutionRuleEvaluation {
  ruleId: string;
  ruleType: ConstitutionRule["type"];
  passed: boolean;
  severity: WarningSeverity;
  warning?: ScenarioWarning;
}

export interface ConstitutionEvaluation {
  passed: boolean;
  evaluations: ConstitutionRuleEvaluation[];
  warnings: ScenarioWarning[];
}

export type ScenarioType = "buy_now" | "delay" | "alternative" | "income_delay";

export interface ScenarioInput {
  id: string;
  label: string;
  scenarioType: ScenarioType;
  startDate: IsoDate;
  endDate?: IsoDate;
  horizonDays?: number;
  startingBalancePaise: Paise;
  events: FinancialEvent[];
  proposal: PurchaseProposal;
  monthlyIncomePaise: Paise;
  existingMonthlyEmiPaise: Paise;
  protectedBalanceFloorPaise: Paise;
  lowBalanceThresholdPaise?: Paise;
  monthlySavingsContributionPaise?: Paise;
  incomeConfidence?: number;
  goal?: GoalInput;
  goalImpactPaise?: Paise;
  delayDays?: number;
  alternativeProposal?: PurchaseProposal;
  incomeDelay?: { eventIds: string[]; delayDays: number };
  constitution?: MoneyConstitution;
}

export interface ScenarioSummary {
  minimumBalancePaise: Paise;
  negativeBalanceDays: number;
  lowBalanceDays: number;
  goalDelayDays: number | null;
  totalCommitmentPaise: Paise;
  emiRatioBasisPoints: BasisPoints;
  protectedExpenseRisk: boolean;
  monthlySavingsContributionPaise: Paise | null;
}

export interface ScenarioResult {
  id: string;
  label: string;
  scenarioType: ScenarioType;
  proposal: PurchaseProposal;
  ledger: DailyLedgerEntry[];
  summary: ScenarioSummary;
  commitment: EmiCommitmentResult;
  warnings: ScenarioWarning[];
  incomeConfidence: number | null;
}

export interface ScenarioComparisonItem extends ScenarioSummary {
  scenarioId: string;
  label: string;
  constitutionConflictCount: number;
}

export interface ScenarioComparison {
  scenarios: ScenarioComparisonItem[];
}

export interface FlexibleIncomeInput {
  monthlyIncomePaise: Paise;
  protectedMonthlyOutflowsPaise: Paise;
}

export interface SafeToSpendInput {
  startDate: IsoDate;
  currentBalancePaise: Paise;
  protectedBalanceFloorPaise: Paise;
  events: FinancialEvent[];
  protectedEventIds: string[];
  nextIncomeDate?: IsoDate;
  confidenceWarnings?: ScenarioWarning[];
}

export interface SafeToSpendResult {
  safeToSpendPaise: Paise;
  protectedCommitmentsPaise: Paise;
  protectedBalanceFloorPaise: Paise;
  amountAvailableUntilNextIncomePaise: Paise;
  bufferRemainingPaise: Paise;
  nextIncomeDate: IsoDate;
  warnings: ScenarioWarning[];
}
