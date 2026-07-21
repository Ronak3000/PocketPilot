"use client";

import { useState } from "react";
import { parseInrToPaise } from "../money-input";

export interface ManualFinancialContext {
  currentBalancePaise: number;
  monthlyIncomePaise: number;
  nextIncomeDate: string;
  protectedBalanceFloorPaise: number;
  protectedMonthlyExpensesPaise: number;
  existingMonthlyEmiPaise: number;
  activeGoalMonthlyContributionPaise: number;
}

interface Props {
  asOfDate: string;
  onSubmit: (context: ManualFinancialContext) => void;
  onBack: () => void;
}

const MONEY_FIELDS = [
  ["currentBalancePaise", "Current account balance (₹)"],
  ["monthlyIncomePaise", "Monthly income (₹, enter 0 if none)"],
  ["protectedBalanceFloorPaise", "Protected minimum balance (₹)"],
  ["protectedMonthlyExpensesPaise", "Essential monthly expenses (₹)"],
  ["existingMonthlyEmiPaise", "Existing monthly EMIs (₹, enter 0 if none)"],
  ["activeGoalMonthlyContributionPaise", "Savings-goal contribution (₹, enter 0 if none)"],
] as const;

type MoneyField = (typeof MONEY_FIELDS)[number][0];

export function ManualFinancialContextForm({ asOfDate, onSubmit, onBack }: Props) {
  const [values, setValues] = useState<Record<MoneyField, string>>({
    currentBalancePaise: "",
    monthlyIncomePaise: "",
    protectedBalanceFloorPaise: "",
    protectedMonthlyExpensesPaise: "",
    existingMonthlyEmiPaise: "",
    activeGoalMonthlyContributionPaise: "",
  });
  const [nextIncomeDate, setNextIncomeDate] = useState("");
  const [error, setError] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = Object.fromEntries(
      MONEY_FIELDS.map(([field]) => [field, parseInrToPaise(values[field])]),
    ) as Record<MoneyField, number | null>;
    if (Object.values(parsed).some((value) => value === null)) {
      setError("Enter every amount explicitly. Use 0 only when zero is correct.");
      return;
    }
    if (!nextIncomeDate || nextIncomeDate < asOfDate) {
      setError("Enter your next income date. It cannot be in the past.");
      return;
    }
    onSubmit({
      currentBalancePaise: parsed.currentBalancePaise!,
      monthlyIncomePaise: parsed.monthlyIncomePaise!,
      nextIncomeDate,
      protectedBalanceFloorPaise: parsed.protectedBalanceFloorPaise!,
      protectedMonthlyExpensesPaise: parsed.protectedMonthlyExpensesPaise!,
      existingMonthlyEmiPaise: parsed.existingMonthlyEmiPaise!,
      activeGoalMonthlyContributionPaise: parsed.activeGoalMonthlyContributionPaise!,
    });
  }

  return (
    <form className="manual-context-form" onSubmit={submit} noValidate>
      <h2>Enter financial details</h2>
      <p>Nothing is guessed. These values are used only for this simulation.</p>
      {MONEY_FIELDS.map(([field, label]) => (
        <div className="form-group" key={field}>
          <label className="form-label" htmlFor={`manual-${field}`}>{label}</label>
          <input
            className="form-input"
            id={`manual-${field}`}
            inputMode="decimal"
            value={values[field]}
            onChange={(event) => {
              setValues((current) => ({ ...current, [field]: event.target.value }));
              setError("");
            }}
          />
        </div>
      ))}
      <div className="form-group">
        <label className="form-label" htmlFor="manual-next-income">Next income date</label>
        <input
          className="form-input"
          id="manual-next-income"
          type="date"
          min={asOfDate}
          value={nextIncomeDate}
          onChange={(event) => { setNextIncomeDate(event.target.value); setError(""); }}
        />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="emergency-actions">
        <button className="btn btn--ghost" type="button" onClick={onBack}>Back</button>
        <button className="btn btn--primary" id="manual-context-submit" type="submit">Run assessment</button>
      </div>
    </form>
  );
}
