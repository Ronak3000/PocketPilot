import { buildDailyLedger } from "../cashflow/build-daily-ledger";
import { addDays, addMonthsClamped, dateParts } from "../dates/date-utils";
import { addPaise } from "../money/money";
import type { DailyLedgerEntry, FinancialEvent, IsoDate, Paise } from "../types";
import type { EmergencyContext, ExplicitLoanOffer } from "./types";

function monthlyEvent(
  id: string,
  title: string,
  amountPaise: Paise,
  kind: FinancialEvent["kind"],
  startDate: IsoDate,
  endDate: IsoDate,
  protectedExpense: boolean,
): FinancialEvent | null {
  if (amountPaise === 0) return null;
  return {
    id,
    title,
    amountPaise,
    direction: "outflow",
    kind,
    protected: protectedExpense,
    schedule: "recurring",
    startDate,
    endDate,
    frequency: "monthly",
    dayOfMonth: dateParts(startDate).day,
  };
}

export function buildEmergencyLedger(params: {
  context: EmergencyContext;
  offer: ExplicitLoanOffer;
  monthlyEmiPaise: Paise;
  disbursalDate: IsoDate;
  finalRepaymentDate: IsoDate;
}): DailyLedgerEntry[] {
  const { context, offer, monthlyEmiPaise, disbursalDate, finalRepaymentDate } = params;
  const events: Array<FinancialEvent | null> = [
    {
      id: `emergency-loan-${offer.id}`,
      title: "Simulated emergency funding disbursal",
      amountPaise: offer.principalPaise,
      direction: "inflow",
      kind: "income",
      schedule: "once",
      date: disbursalDate,
    },
    {
      id: `emergency-payment-${offer.id}`,
      title: "Emergency payment",
      amountPaise: context.totalNeededPaise,
      direction: "outflow",
      kind: "purchase",
      protected: true,
      schedule: "once",
      date: disbursalDate,
    },
    {
      id: `emergency-fees-${offer.id}`,
      title: "Loan processing and other fees",
      amountPaise: addPaise(offer.processingFeePaise, offer.otherChargesPaise),
      direction: "outflow",
      kind: "processing_fee",
      schedule: "once",
      date: disbursalDate,
    },
    {
      id: "monthly-income",
      title: "Monthly income",
      amountPaise: context.monthlyIncomePaise,
      direction: "inflow",
      kind: "salary",
      schedule: "recurring",
      startDate: context.nextIncomeDate,
      endDate: finalRepaymentDate,
      frequency: "monthly",
      dayOfMonth: dateParts(context.nextIncomeDate).day,
    },
  ];

  // ponytail: aggregate obligations follow income because exact bill dates are not in the profile.
  const obligationDate = addDays(context.nextIncomeDate, 1);
  events.push(
    monthlyEvent("protected-expenses", "Protected monthly expenses", context.protectedMonthlyExpensesPaise, "bill", obligationDate, finalRepaymentDate, true),
    monthlyEvent("existing-emis", "Existing monthly EMIs", context.existingMonthlyEmiPaise, "existing_emi", addDays(obligationDate, 1), finalRepaymentDate, true),
    monthlyEvent("goal-contribution", "Savings goal contribution", context.activeGoalMonthlyContributionPaise, "goal_contribution", addDays(obligationDate, 2), finalRepaymentDate, true),
    monthlyEvent(`new-emi-${offer.id}`, "Emergency funding EMI", monthlyEmiPaise, "new_emi", addMonthsClamped(disbursalDate, 1), finalRepaymentDate, false),
  );

  return buildDailyLedger({
    startDate: context.asOfDate,
    endDate: finalRepaymentDate,
    startingBalancePaise: context.currentBalancePaise,
    protectedBalanceFloorPaise: context.protectedBalanceFloorPaise,
    events: events.filter((event): event is FinancialEvent => event !== null),
  });
}
