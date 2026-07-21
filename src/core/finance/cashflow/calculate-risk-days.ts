import { assertNonNegativePaise } from "../money/money";
import type { DailyLedgerEntry, Paise } from "../types";

export interface RiskDayResult {
  negativeBalanceDays: number;
  lowBalanceDays: number;
}

export function calculateRiskDays(
  ledger: DailyLedgerEntry[],
  lowBalanceThresholdPaise: Paise,
): RiskDayResult {
  assertNonNegativePaise(lowBalanceThresholdPaise, "lowBalanceThresholdPaise");
  return ledger.reduce<RiskDayResult>(
    (result, day) => ({
      negativeBalanceDays:
        result.negativeBalanceDays + (day.closingBalancePaise < 0 ? 1 : 0),
      lowBalanceDays:
        result.lowBalanceDays +
        (day.closingBalancePaise < lowBalanceThresholdPaise ? 1 : 0),
    }),
    { negativeBalanceDays: 0, lowBalanceDays: 0 },
  );
}
