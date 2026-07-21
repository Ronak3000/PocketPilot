import { FinanceError } from "../errors";
import type { DailyLedgerEntry, IsoDate, Paise } from "../types";

export interface MinimumBalanceResult {
  minimumBalancePaise: Paise;
  date: IsoDate;
}

export function calculateMinimumBalance(
  ledger: DailyLedgerEntry[],
): MinimumBalanceResult {
  if (!ledger.length) {
    throw new FinanceError("INVALID_INPUT", "ledger must contain at least one day");
  }
  return ledger.reduce<MinimumBalanceResult>(
    (minimum, day) =>
      day.closingBalancePaise < minimum.minimumBalancePaise
        ? { minimumBalancePaise: day.closingBalancePaise, date: day.date }
        : minimum,
    {
      minimumBalancePaise: ledger[0].closingBalancePaise,
      date: ledger[0].date,
    },
  );
}
