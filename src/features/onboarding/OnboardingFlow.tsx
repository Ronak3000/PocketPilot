"use client";

import React, { useState } from "react";
import { useAppDispatch } from "@/features/app-state";
import { pocketPilotClient } from "@/mocks/adapter";
import { demoProfile } from "@/mocks/demo-profile";
import type { FinancialProfile } from "@/features/types";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import CurrencyInput from "@/components/ui/CurrencyInput";

const TOTAL_STEPS = 6;

type OnboardingData = Omit<FinancialProfile, "id" | "createdAt" | "updatedAt">;

export default function OnboardingFlow() {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    name: demoProfile.name,
    currentBalancePaise: demoProfile.currentBalancePaise,
    monthlySalaryPaise: demoProfile.monthlySalaryPaise,
    salaryDay: demoProfile.salaryDay,
    rentPaise: demoProfile.rentPaise,
    familyTransferPaise: demoProfile.familyTransferPaise,
    existingEmiPaise: demoProfile.existingEmiPaise,
    monthlySavingsTargetPaise: demoProfile.monthlySavingsTargetPaise,
    protectedBalanceFloorPaise: demoProfile.protectedBalanceFloorPaise,
    emergencyFundGoalPaise: demoProfile.emergencyFundGoalPaise,
    emergencyFundCurrentPaise: demoProfile.emergencyFundCurrentPaise,
  });

  function update<K extends keyof OnboardingData>(key: K, val: OnboardingData[K]) {
    setData((prev) => ({ ...prev, [key]: val }));
  }

  function next() {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  }
  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  async function complete() {
    setLoading(true);
    try {
      const profile = await pocketPilotClient.updateProfile(data);
      const constitution = await pocketPilotClient.getConstitution();
      const safeToSpend = await pocketPilotClient.getSafeToSpend();
      dispatch({ type: "SET_PROFILE", profile });
      dispatch({ type: "SET_CONSTITUTION", constitution });
      dispatch({ type: "SET_SAFE_TO_SPEND", safeToSpend });
      dispatch({ type: "COMPLETE_ONBOARDING" });
    } catch {
      setLoading(false);
    }
  }

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="space-y-6 animate-fade-up">
      <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center text-white text-2xl font-bold">
        P
      </div>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Welcome to PocketPilot</h2>
        <p className="text-[var(--color-text-secondary)] mt-2 leading-relaxed">
          Before we help you make smarter spending decisions, let&apos;s understand your financial picture. This takes about 2 minutes.
        </p>
      </div>
      <div className="space-y-3">
        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">
          What should we call you?
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Your name"
          className="
            w-full px-4 py-2.5 bg-[var(--color-input-bg)] border border-[var(--color-input-border)]
            rounded-[var(--radius-md)] text-[15px] text-[var(--color-text-primary)]
            placeholder:text-[var(--color-text-disabled)]
            focus:outline-none focus:border-[var(--color-input-focus)] focus:ring-1 focus:ring-[var(--color-input-focus)]
            transition-colors
          "
        />
      </div>
    </div>,

    // Step 1: Balance + Income
    <div key="income" className="space-y-5 animate-fade-up">
      <div>
        <h2 className="text-xl font-semibold">Your money right now</h2>
        <p className="text-[var(--color-text-secondary)] mt-1 text-[14px]">
          We use this to calculate what you can safely spend today.
        </p>
      </div>
      <CurrencyInput
        label="Current bank balance"
        value={data.currentBalancePaise}
        onChange={(v) => update("currentBalancePaise", v)}
        placeholder="72,000"
      />
      <CurrencyInput
        label="Monthly salary (take-home)"
        value={data.monthlySalaryPaise}
        onChange={(v) => update("monthlySalaryPaise", v)}
        placeholder="48,000"
      />
      <div>
        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">
          Salary credit date
        </label>
        <div className="flex gap-2 flex-wrap">
          {[1, 7, 15, 25, 28].map((day) => (
            <button
              key={day}
              onClick={() => update("salaryDay", day)}
              className={`
                px-4 py-2 rounded-[var(--radius-md)] text-[14px] font-medium
                transition-all duration-[var(--duration-fast)] cursor-pointer
                ${
                  data.salaryDay === day
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)]"
                }
              `}
            >
              {day === 28 ? "Last week" : `${day}${day === 1 ? "st" : day === 15 ? "th" : "th"}`}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // Step 2: Rent + Fixed
    <div key="rent" className="space-y-5 animate-fade-up">
      <div>
        <h2 className="text-xl font-semibold">Fixed commitments</h2>
        <p className="text-[var(--color-text-secondary)] mt-1 text-[14px]">
          These are non-negotiable monthly outflows.
        </p>
      </div>
      <CurrencyInput
        label="Monthly rent"
        value={data.rentPaise}
        onChange={(v) => update("rentPaise", v)}
        placeholder="14,000"
      />
      <CurrencyInput
        label="Family transfer"
        value={data.familyTransferPaise}
        onChange={(v) => update("familyTransferPaise", v)}
        placeholder="5,000"
      />
      <CurrencyInput
        label="Existing EMI payments"
        value={data.existingEmiPaise}
        onChange={(v) => update("existingEmiPaise", v)}
        placeholder="3,500"
      />
    </div>,

    // Step 3: Savings + Goals
    <div key="goals" className="space-y-5 animate-fade-up">
      <div>
        <h2 className="text-xl font-semibold">Savings & goals</h2>
        <p className="text-[var(--color-text-secondary)] mt-1 text-[14px]">
          We&apos;ll protect these when evaluating purchases.
        </p>
      </div>
      <CurrencyInput
        label="Monthly savings target"
        value={data.monthlySavingsTargetPaise}
        onChange={(v) => update("monthlySavingsTargetPaise", v)}
        placeholder="8,000"
      />
      <CurrencyInput
        label="Emergency fund goal"
        value={data.emergencyFundGoalPaise}
        onChange={(v) => update("emergencyFundGoalPaise", v)}
        placeholder="1,50,000"
      />
      <CurrencyInput
        label="Emergency fund saved so far"
        value={data.emergencyFundCurrentPaise}
        onChange={(v) => update("emergencyFundCurrentPaise", v)}
        placeholder="24,000"
      />
    </div>,

    // Step 4: Protection rules
    <div key="protection" className="space-y-5 animate-fade-up">
      <div>
        <h2 className="text-xl font-semibold">Your money floor</h2>
        <p className="text-[var(--color-text-secondary)] mt-1 text-[14px]">
          The minimum balance you never want to go below. We&apos;ll warn you if a purchase would breach this.
        </p>
      </div>
      <CurrencyInput
        label="Protected balance floor"
        value={data.protectedBalanceFloorPaise}
        onChange={(v) => update("protectedBalanceFloorPaise", v)}
        placeholder="10,000"
      />
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/20">
        <p className="text-[13px] text-[var(--color-accent-text)] leading-relaxed">
          💡 We&apos;ll set up your full Money Constitution — personal spending rules — after onboarding. You can always adjust them later.
        </p>
      </div>
    </div>,

    // Step 5: Review
    <div key="review" className="space-y-5 animate-fade-up">
      <div>
        <h2 className="text-xl font-semibold">Looking good, {data.name}!</h2>
        <p className="text-[var(--color-text-secondary)] mt-1 text-[14px]">
          Here&apos;s a quick summary. You can change anything later.
        </p>
      </div>
      <div className="space-y-3">
        {[
          { label: "Balance", value: data.currentBalancePaise },
          { label: "Salary", value: data.monthlySalaryPaise },
          { label: "Rent", value: data.rentPaise },
          { label: "Family", value: data.familyTransferPaise },
          { label: "Existing EMI", value: data.existingEmiPaise },
          { label: "Savings target", value: data.monthlySavingsTargetPaise },
          { label: "Balance floor", value: data.protectedBalanceFloorPaise },
          { label: "Emergency goal", value: data.emergencyFundGoalPaise },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between py-2 border-b border-[var(--color-border-subtle)] last:border-0"
          >
            <span className="text-[14px] text-[var(--color-text-secondary)]">{item.label}</span>
            <span className="text-[14px] font-medium font-mono-numbers">
              ₹{(item.value / 100).toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <ProgressBar current={step + 1} total={TOTAL_STEPS} className="mb-8" />

        <div className="min-h-[360px]">{steps[step]}</div>

        <div className="flex items-center justify-between mt-8 gap-3">
          {step > 0 ? (
            <Button variant="ghost" onClick={back}>
              ← Back
            </Button>
          ) : (
            <div />
          )}
          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={next}>Continue →</Button>
          ) : (
            <Button onClick={complete} loading={loading}>
              Start Using PocketPilot
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
