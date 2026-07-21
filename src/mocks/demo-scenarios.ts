import type {
  ScenarioComparison,
  ScenarioResult,
  DailyLedgerEntry,
  ProjectedBalance,
  ConstitutionEvaluation,
} from "@/features/types";

// ── Helper: generate daily projected balances ──

function generateProjectedBalances(
  startPaise: number,
  months: number,
  monthlyNetPaise: number,
  initialDropPaise: number
): ProjectedBalance[] {
  const balances: ProjectedBalance[] = [];
  const startDate = new Date("2025-07-15");
  let balance = startPaise - initialDropPaise;

  for (let day = 0; day < months * 30; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().split("T")[0];

    if (day > 0 && date.getDate() === 1) {
      balance += 4_800_000; // salary
    }
    if (day > 0 && date.getDate() === 5) {
      balance -= 1_400_000; // rent
      balance -= 500_000;   // family
      balance -= 350_000;   // existing EMI
      balance -= 800_000;   // savings
      balance += monthlyNetPaise; // adjustment for scenario
    }

    balances.push({ date: dateStr, balancePaise: balance });
  }
  return balances;
}

// ── Helper: sample daily ledger entries ──

function generateSampleLedger(startBalancePaise: number, dropPaise: number): DailyLedgerEntry[] {
  const start = startBalancePaise - dropPaise;
  return [
    { date: "2025-07-15", label: "Phone purchase (down payment + fee)", amountPaise: -dropPaise, balancePaise: start, isIncome: false, isCommitment: true, breachesFloor: false },
    { date: "2025-08-01", label: "Salary credited", amountPaise: 4_800_000, balancePaise: start + 4_800_000, isIncome: true, isCommitment: false, breachesFloor: false },
    { date: "2025-08-05", label: "Rent", amountPaise: -1_400_000, balancePaise: start + 4_800_000 - 1_400_000, isIncome: false, isCommitment: true, breachesFloor: false },
    { date: "2025-08-05", label: "Family transfer", amountPaise: -500_000, balancePaise: start + 4_800_000 - 1_900_000, isIncome: false, isCommitment: true, breachesFloor: false },
    { date: "2025-08-05", label: "Existing EMI", amountPaise: -350_000, balancePaise: start + 4_800_000 - 2_250_000, isIncome: false, isCommitment: true, breachesFloor: false },
    { date: "2025-08-05", label: "New phone EMI", amountPaise: -450_000, balancePaise: start + 4_800_000 - 2_700_000, isIncome: false, isCommitment: true, breachesFloor: false },
    { date: "2025-08-05", label: "Savings transfer", amountPaise: -800_000, balancePaise: start + 4_800_000 - 3_500_000, isIncome: false, isCommitment: true, breachesFloor: false },
  ];
}

// ── Scenario 1: Buy Now ──

const buyNowConflicts: ConstitutionEvaluation[] = [
  {
    ruleId: "rule-emi-ratio",
    ruleName: "EMI-to-Income Cap",
    reasonCode: "EMI_RATIO_EXCEEDED",
    severity: "warning",
    message: "Total EMI rises to 16.7% of income (₹3,500 + ₹4,500 = ₹8,000 of ₹48,000). Within limit but approaching threshold.",
    currentValue: 16.7,
    thresholdValue: 30,
  },
  {
    ruleId: "rule-emergency-fund",
    ruleName: "Emergency Fund Goal",
    reasonCode: "EMERGENCY_FUND_DELAYED",
    severity: "warning",
    message: "Emergency fund goal delayed by approximately 45 days due to reduced monthly savings capacity.",
    currentValue: 45,
    thresholdValue: 30,
  },
];

const scenarioBuyNow: ScenarioResult = {
  id: "scenario-buy-now-001",
  scenarioInputId: "input-buy-now-001",
  scenarioType: "buy_now",
  label: "Buy Now",
  status: "CAUTION",
  lowestBalancePaise: 850_000,        // ₹8,500 — below savings target comfort
  lowestBalanceDate: "2025-07-28",
  lowBalanceDays: 4,
  negativeBalanceDays: 0,
  goalDelayDays: 45,
  totalCommittedPaise: 6_749_900,     // ₹67,499 (price + fee)
  emiToIncomeRatio: 16.7,
  constitutionConflicts: buyNowConflicts,
  recommendation: "Affordable but tight. Your emergency fund goal will be delayed by ~45 days. Consider waiting or choosing a cheaper option.",
  dailyLedger: generateSampleLedger(7_200_000, 1_349_900),
  projectedBalances: generateProjectedBalances(7_200_000, 14, -450_000, 1_349_900),
};

// ── Scenario 2: Wait 45 Days ──

const scenarioWait: ScenarioResult = {
  id: "scenario-wait-45-001",
  scenarioInputId: "input-wait-45-001",
  scenarioType: "wait",
  label: "Wait 45 Days",
  status: "SAFE",
  lowestBalancePaise: 2_150_000,      // ₹21,500
  lowestBalanceDate: "2025-09-28",
  lowBalanceDays: 0,
  negativeBalanceDays: 0,
  goalDelayDays: 15,
  totalCommittedPaise: 6_749_900,
  emiToIncomeRatio: 16.7,
  constitutionConflicts: [
    {
      ruleId: "rule-emergency-fund",
      ruleName: "Emergency Fund Goal",
      reasonCode: "EMERGENCY_FUND_DELAYED",
      severity: "info",
      message: "Emergency fund delayed by ~15 days. Well within acceptable range.",
      currentValue: 15,
      thresholdValue: 30,
    },
  ],
  recommendation: "Safe. Waiting allows you to save ₹17,500 more, creating a comfortable buffer. Emergency fund impact is minimal.",
  dailyLedger: generateSampleLedger(8_950_000, 1_349_900),
  projectedBalances: generateProjectedBalances(8_950_000, 14, -450_000, 1_349_900),
};

// ── Scenario 3: Cheaper Alternative ₹39,999 ──

const scenarioCheaper: ScenarioResult = {
  id: "scenario-cheaper-001",
  scenarioInputId: "input-cheaper-001",
  scenarioType: "cheaper_alternative",
  label: "₹39,999 Alternative",
  status: "SAFE",
  lowestBalancePaise: 3_200_000,      // ₹32,000
  lowestBalanceDate: "2025-07-28",
  lowBalanceDays: 0,
  negativeBalanceDays: 0,
  goalDelayDays: 8,
  totalCommittedPaise: 4_149_900,     // ₹41,499 (₹39,999 + ₹1,500 fee)
  emiToIncomeRatio: 11.5,
  constitutionConflicts: [],
  recommendation: "Very safe. Lower price means smaller EMI (₹3,000), keeping your finances comfortable. No constitution conflicts.",
  dailyLedger: generateSampleLedger(7_200_000, 949_900),
  projectedBalances: generateProjectedBalances(7_200_000, 14, -300_000, 949_900),
};

// ── Combined Comparison ──

export const demoScenarioComparison: ScenarioComparison = {
  id: "comparison-001",
  scenarios: [scenarioBuyNow, scenarioWait, scenarioCheaper],
  recommendedScenarioId: "scenario-wait-45-001",
  comparisonSummary:
    "Waiting 45 days is recommended. It maintains a safe balance, causes minimal goal delay, and lets you buy the phone you want without financial stress.",
};

export const demoScenarios = {
  buyNow: scenarioBuyNow,
  wait45: scenarioWait,
  cheaper: scenarioCheaper,
};
