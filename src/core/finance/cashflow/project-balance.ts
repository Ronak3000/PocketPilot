import type { LedgerInput } from "../types";
import { buildDailyLedger } from "./build-daily-ledger";

export interface BalanceProjection {
  date: string;
  balancePaise: number;
}

export function projectBalance(input: LedgerInput): BalanceProjection[] {
  return buildDailyLedger(input).map((day) => ({
    date: day.date,
    balancePaise: day.closingBalancePaise,
  }));
}
