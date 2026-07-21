"use client";

// ── Screen 2: Emergency Amount and Timing ──
// Collects totalNeeded, alreadyAvailable, requiredByDate.
// No defaults — every value must be entered explicitly.

import React, { useState } from "react";

interface Props {
  onSubmit: (data: {
    totalNeededPaise: number;
    alreadyAvailablePaise: number;
    requiredByDate: string;
  }) => void;
  onBack: () => void;
}

function parseInr(value: string): number | null {
  const num = parseFloat(value.replace(/,/g, ""));
  if (isNaN(num) || num < 0) return null;
  return Math.round(num * 100); // INR to paise
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function EmergencyAmountForm({ onSubmit, onBack }: Props) {
  const [totalNeeded, setTotalNeeded] = useState("");
  const [alreadyHave, setAlreadyHave] = useState("");
  const [byDate, setByDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const totalPaise = parseInr(totalNeeded);
    const availablePaise = parseInr(alreadyHave);

    if (totalPaise === null || totalPaise <= 0) {
      newErrors.totalNeeded = "Please enter the total amount needed (in ₹).";
    }
    if (availablePaise === null) {
      newErrors.alreadyHave = "Please enter how much you already have (₹ 0 if none).";
    }
    if (!byDate) {
      newErrors.byDate = "Please enter the date by which you need the money.";
    } else if (byDate < today()) {
      newErrors.byDate = "The required-by date cannot be in the past.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      totalNeededPaise: totalPaise!,
      alreadyAvailablePaise: availablePaise!,
      requiredByDate: byDate,
    });
  }

  return (
    <form className="emergency-amount-form" onSubmit={handleSubmit} noValidate>
      <h2 className="emergency-amount-form__heading">
        How much do you need?
      </h2>
      <p className="emergency-amount-form__subheading">
        Please share the exact amounts — I will use only what you provide here.
      </p>

      <div className="form-group">
        <label htmlFor="total-needed" className="form-label">
          Total amount needed (₹)
        </label>
        <input
          id="total-needed"
          type="text"
          inputMode="decimal"
          className={`form-input ${errors.totalNeeded ? "form-input--error" : ""}`}
          placeholder="e.g. 1,20,000"
          value={totalNeeded}
          onChange={(e) => { setTotalNeeded(e.target.value); setErrors((prev) => ({ ...prev, totalNeeded: "" })); }}
        />
        {errors.totalNeeded && (
          <span className="form-error" role="alert">{errors.totalNeeded}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="already-have" className="form-label">
          Amount you already have available (₹)
        </label>
        <input
          id="already-have"
          type="text"
          inputMode="decimal"
          className={`form-input ${errors.alreadyHave ? "form-input--error" : ""}`}
          placeholder="e.g. 20,000 (enter 0 if none)"
          value={alreadyHave}
          onChange={(e) => { setAlreadyHave(e.target.value); setErrors((prev) => ({ ...prev, alreadyHave: "" })); }}
        />
        {errors.alreadyHave && (
          <span className="form-error" role="alert">{errors.alreadyHave}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="required-by" className="form-label">
          Date by which you need the money
        </label>
        <input
          id="required-by"
          type="date"
          className={`form-input ${errors.byDate ? "form-input--error" : ""}`}
          min={today()}
          value={byDate}
          onChange={(e) => { setByDate(e.target.value); setErrors((prev) => ({ ...prev, byDate: "" })); }}
        />
        {errors.byDate && (
          <span className="form-error" role="alert">{errors.byDate}</span>
        )}
      </div>

      <div className="emergency-amount-form__actions">
        <button type="button" className="btn btn--ghost" id="emergency-amount-back" onClick={onBack}>
          Back
        </button>
        <button type="submit" className="btn btn--primary" id="emergency-amount-submit">
          Continue
        </button>
      </div>
    </form>
  );
}
