import { tool } from "ai";
import { z } from "zod";
import { calculateSafeToSpend, type FinancialEvent } from "@/core/finance";
import type {
  ExtractedDecision,
  FinancialProfile,
  MoneyConstitution,
  SafeToSpend,
} from "@/features/types";
import { runFullAnalysis, profileToEvents } from "@/server/bridge";
import { db } from "@/server/db";

interface ChatToolsInput {
  profile: FinancialProfile;
  constitution: MoneyConstitution;
  rememberBehavior: boolean;
  sourceMessageId?: string;
}

export function createChatTools(input: ChatToolsInput) {
  return {
    calculatePurchase: tool({
      description:
        "Runs deterministic cash-flow projections for a purchase the user has not made. " +
        "Requires explicit price and, for EMI plans, the user-provided down payment, monthly EMI, " +
        "tenure and processing fee. Never invent or assume these values — ask if missing.",
      inputSchema: z.object({
        productName: z.string().describe("The product the user wants to buy."),
        pricePaise: z
          .number()
          .int()
          .positive()
          .describe("Total listed price in paise. Multiply INR by 100."),
        isEmiPlan: z
          .boolean()
          .describe("True when the user explicitly wants EMI financing."),
        downPaymentPaise: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe(
            "Down payment in paise as stated by the user. Required for EMI plans.",
          ),
        monthlyEmiPaise: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe(
            "Monthly EMI in paise as stated by the user. Required for EMI plans.",
          ),
        tenureMonths: z
          .number()
          .int()
          .positive()
          .optional()
          .describe(
            "Loan tenure in months as stated by the user. Required for EMI plans.",
          ),
        processingFeePaise: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe(
            "Processing fee in paise as stated by the user or lender. 0 when not applicable.",
          ),
        asOfDate: z
          .string()
          .optional()
          .describe("ISO YYYY-MM-DD date for the simulation start. Defaults to today."),
      }),
      execute: async ({
        productName,
        pricePaise,
        isEmiPlan,
        downPaymentPaise,
        monthlyEmiPaise,
        tenureMonths,
        processingFeePaise,
        asOfDate,
      }) => {
        // Require explicit terms for EMI plans — never invent them.
        if (isEmiPlan) {
          const missing: string[] = [];
          if (downPaymentPaise === undefined || downPaymentPaise === null)
            missing.push("down payment");
          if (monthlyEmiPaise === undefined || monthlyEmiPaise === null)
            missing.push("monthly EMI");
          if (!tenureMonths) missing.push("tenure in months");
          if (processingFeePaise === undefined || processingFeePaise === null)
            missing.push("processing fee (0 if none)");
          if (missing.length > 0) {
            return {
              status: "INCOMPLETE",
              missingFields: missing,
              message: `Please share the ${missing[0]} for the ${productName} EMI plan so I can run the calculation accurately.`,
            };
          }
        }

        const resolvedDownPayment = isEmiPlan
          ? (downPaymentPaise ?? 0)
          : pricePaise;
        const resolvedEmi = isEmiPlan ? (monthlyEmiPaise ?? 0) : 0;
        const resolvedTenure = isEmiPlan ? (tenureMonths ?? 0) : 0;
        const resolvedFee = isEmiPlan ? (processingFeePaise ?? 0) : 0;
        const today = asOfDate ?? new Date().toISOString().split("T")[0];

        const decision: ExtractedDecision = {
          id: `decision-${Date.now()}`,
          decisionInputId: `input-${Date.now()}`,
          productName,
          pricePaise,
          downPaymentPaise: resolvedDownPayment,
          emiAmountPaise: resolvedEmi,
          tenureMonths: resolvedTenure,
          processingFeePaise: resolvedFee,
          confidence: 1,
          missingFields: [],
          createdAt: today + "T00:00:00.000Z",
        };
        const freshProfile = db.getProfile() ?? input.profile;
        const analysis = runFullAnalysis(
          freshProfile,
          input.constitution,
          decision,
        );

        db.setLastDecision(analysis.decision);
        db.setLastComparison(analysis.comparison);
        db.setLastReceipt(analysis.receipt);
        db.setLastPlan(analysis.plan);
        db.setSafeToSpend(analysis.safeToSpend);

        // ── Add to history so the History panel tracks every analysis ──
        db.addHistoryEntry({
          id: `hist-${Date.now()}`,
          type: "receipt",
          title: `${productName} — ₹${Math.floor(pricePaise / 100).toLocaleString("en-IN")}`,
          status: analysis.receipt.status,
          receipt: analysis.receipt,
          plan: analysis.plan,
          createdAt: new Date().toISOString(),
        });
        if (input.rememberBehavior) {
          db.remember(
            input.profile.id,
            {
              kind: "behavior",
              key: `behavior.considered.${productName.toLowerCase()}`,
              content: `Considered buying ${productName} for ₹${Math.floor(pricePaise / 100).toLocaleString("en-IN")}.`,
              confidence: 1,
            },
            "calculatePurchase",
            input.sourceMessageId,
          );
        }

        return {
          status: "OK",
          receipt: analysis.receipt,
          comparison: analysis.comparison,
          plan: analysis.plan,
          safeToSpend: analysis.safeToSpend,
        };
      },
    }),


    recordPurchase: tool({
      description:
        "Records a purchase the user already made and recalculates safe-to-spend.",
      inputSchema: z.object({
        productName: z.string().describe("The item that was purchased."),
        amountPaise: z
          .number()
          .int()
          .positive()
          .describe("Full amount already paid in paise."),
      }),
      execute: async ({ productName, amountPaise }) => {
        const freshProfile = db.getProfile() ?? input.profile;
        const newBalancePaise = Math.max(
          0,
          freshProfile.currentBalancePaise - amountPaise,
        );
        db.patchProfile({ currentBalancePaise: newBalancePaise });

        const today = new Date().toISOString().split("T")[0];
        const events = profileToEvents(freshProfile);
        const stsResult = calculateSafeToSpend({
          startDate: today,
          currentBalancePaise: newBalancePaise,
          protectedBalanceFloorPaise: freshProfile.protectedBalanceFloorPaise,
          events,
          protectedEventIds: events.filter((e) => e.protected).map((e) => e.id),
        });

        const bufferRatio = stsResult.safeToSpendPaise / freshProfile.monthlySalaryPaise;
        let bufferQuality: SafeToSpend["bufferQuality"] = "excellent";
        if (bufferRatio < 0.1) bufferQuality = "critical";
        else if (bufferRatio < 0.2) bufferQuality = "tight";
        else if (bufferRatio < 0.4) bufferQuality = "good";

        const safeToSpend: SafeToSpend = {
          safeAmountPaise: stsResult.safeToSpendPaise,
          protectedAmountPaise: stsResult.protectedCommitmentsPaise,
          upcomingCommitmentPaise: stsResult.protectedCommitmentsPaise,
          bufferQuality,
          confidence: 0.95,
          lastCalculatedAt: new Date().toISOString(),
        };
        db.setSafeToSpend(safeToSpend);

        // ── Record purchase in history ──
        db.addHistoryEntry({
          id: `hist-purchase-${Date.now()}`,
          type: "plan_approved",
          title: `Purchased ${productName} — ₹${Math.floor(amountPaise / 100).toLocaleString("en-IN")}`,
          status: safeToSpend.bufferQuality === "critical"
            ? "BREACH"
            : safeToSpend.bufferQuality === "tight"
            ? "CAUTION"
            : "SAFE",
          createdAt: new Date().toISOString(),
        });
        if (input.rememberBehavior) {
          db.remember(
            input.profile.id,
            {
              kind: "behavior",
              key: `behavior.purchased.${productName.toLowerCase()}`,
              content: `Purchased ${productName} for ₹${Math.floor(amountPaise / 100).toLocaleString("en-IN")}.`,
              confidence: 1,
            },
            "recordPurchase",
            input.sourceMessageId,
          );
        }

        return {
          productName,
          amountPaise,
          newBalancePaise,
          safeToSpend,
          recommendations: buildRecommendations(
            safeToSpend,
            freshProfile.monthlySalaryPaise,
          ),
        };
      },
    }),
  };
}

function recalculateSafeToSpend(
  profile: FinancialProfile,
  currentBalancePaise: number,
): SafeToSpend {
  const events = buildBasicEvents(profile);
  try {
    const result = calculateSafeToSpend({
      startDate: isoToday(),
      currentBalancePaise,
      protectedBalanceFloorPaise: profile.protectedBalanceFloorPaise,
      events,
      protectedEventIds: events
        .filter((event) => event.protected)
        .map((event) => event.id),
    });
    return {
      safeAmountPaise: result.safeToSpendPaise,
      protectedAmountPaise: result.protectedCommitmentsPaise,
      upcomingCommitmentPaise: result.protectedCommitmentsPaise,
      bufferQuality: bufferQuality(
        result.safeToSpendPaise,
        profile.monthlySalaryPaise,
      ),
      confidence: 0.95,
      lastCalculatedAt: new Date().toISOString(),
    };
  } catch {
    const safeAmountPaise = Math.max(
      0,
      currentBalancePaise -
        profile.protectedBalanceFloorPaise -
        profile.rentPaise -
        profile.familyTransferPaise,
    );
    return {
      safeAmountPaise,
      protectedAmountPaise: profile.rentPaise + profile.familyTransferPaise,
      upcomingCommitmentPaise:
        profile.rentPaise +
        profile.familyTransferPaise +
        profile.existingEmiPaise,
      bufferQuality: bufferQuality(
        safeAmountPaise,
        profile.monthlySalaryPaise,
      ),
      confidence: 0.8,
      lastCalculatedAt: new Date().toISOString(),
    };
  }
}

function buildBasicEvents(profile: FinancialProfile): FinancialEvent[] {
  const startDate = isoToday();
  const events: FinancialEvent[] = [
    {
      id: "evt-salary",
      title: "Monthly Salary",
      amountPaise: profile.monthlySalaryPaise,
      direction: "inflow",
      kind: "salary",
      schedule: "recurring",
      startDate,
      frequency: "monthly",
      dayOfMonth: profile.salaryDay,
    },
  ];
  const addOutflow = (
    id: string,
    title: string,
    amountPaise: number,
    kind: FinancialEvent["kind"],
    dayOfMonth: number,
    protectedEvent = false,
  ) => {
    if (amountPaise <= 0) return;
    events.push({
      id,
      title,
      amountPaise,
      direction: "outflow",
      kind,
      protected: protectedEvent,
      schedule: "recurring",
      startDate,
      frequency: "monthly",
      dayOfMonth,
    });
  };
  addOutflow("evt-rent", "Rent", profile.rentPaise, "rent", 1, true);
  addOutflow(
    "evt-family",
    "Family Transfer",
    profile.familyTransferPaise,
    "family_transfer",
    5,
    true,
  );
  addOutflow(
    "evt-emi",
    "Existing EMI",
    profile.existingEmiPaise,
    "existing_emi",
    5,
  );
  return events;
}

function buildRecommendations(
  safeToSpend: SafeToSpend,
  monthlySalaryPaise: number,
): string[] {
  const safeRupees = Math.floor(safeToSpend.safeAmountPaise / 100);
  if (safeToSpend.bufferQuality === "critical") {
    return [
      `Keep discretionary spending under ₹${Math.floor(safeRupees * 0.3).toLocaleString("en-IN")} until the next salary.`,
      "Avoid new EMIs or subscriptions while rebuilding the buffer.",
    ];
  }
  if (safeToSpend.bufferQuality === "tight") {
    return [
      `Limit discretionary spending to ₹${Math.floor(safeRupees * 0.4).toLocaleString("en-IN")} this month.`,
      "Delay large purchases until the protected buffer is restored.",
    ];
  }
  const monthlyBudget = Math.floor(
    Math.min(
      safeToSpend.safeAmountPaise * 0.5,
      monthlySalaryPaise * 0.15,
    ) / 100,
  );
  return [
    `Keep non-essential spending within ₹${monthlyBudget.toLocaleString("en-IN")} this month.`,
    "Keep the monthly savings target on track.",
  ];
}

function bufferQuality(
  safeAmountPaise: number,
  salaryPaise: number,
): SafeToSpend["bufferQuality"] {
  const ratio = salaryPaise > 0 ? safeAmountPaise / salaryPaise : 0;
  if (ratio < 0.1) return "critical";
  if (ratio < 0.2) return "tight";
  if (ratio < 0.4) return "good";
  return "excellent";
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}
