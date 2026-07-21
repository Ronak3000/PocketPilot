"use client";

import { useEffect, useState } from "react";
import { detectEmergencyCategory } from "@/core/ai/personalization";
import type { EmergencyCategory } from "@/core/finance/emergency";
import type { FinancialProfile, MoneyConstitution } from "@/features/types";
import { pocketPilotClient } from "@/mocks/adapter";
import { EmergencyAssistFlow } from "./EmergencyAssistFlow";

const CATEGORIES: EmergencyCategory[] = [
  "medical", "family", "housing", "education", "income_disruption", "other",
];

function nextMonthlyDate(asOfDate: string, dayOfMonth: number): string {
  const [year, month, day] = asOfDate.split("-").map(Number);
  const inMonth = (y: number, monthIndex: number) => {
    const lastDay = new Date(Date.UTC(y, monthIndex + 1, 0)).getUTCDate();
    return new Date(Date.UTC(y, monthIndex, Math.min(dayOfMonth, lastDay)))
      .toISOString()
      .slice(0, 10);
  };
  const candidate = inMonth(year, month - 1);
  return day <= Number(candidate.slice(8)) ? candidate : inMonth(year, month);
}

function savedContext(
  profile: FinancialProfile | null,
  constitution: MoneyConstitution | null,
  asOfDate: string,
) {
  if (!profile) return undefined;
  const ratioRule = constitution?.rules.find(
    (rule) => rule.enabled && rule.thresholdType === "percentage" && rule.reasonCode === "EMI_RATIO_EXCEEDED",
  );
  const tenureRule = constitution?.rules.find(
    (rule) => rule.enabled && rule.thresholdType === "months",
  );
  return {
    name: profile.name,
    currentBalancePaise: profile.currentBalancePaise,
    monthlyIncomePaise: profile.monthlySalaryPaise,
    nextIncomeDate: nextMonthlyDate(asOfDate, profile.salaryDay),
    protectedBalanceFloorPaise: profile.protectedBalanceFloorPaise,
    protectedMonthlyExpensesPaise: profile.rentPaise + profile.familyTransferPaise,
    existingMonthlyEmiPaise: profile.existingEmiPaise,
    activeGoalMonthlyContributionPaise: profile.monthlySavingsTargetPaise,
    activeGoal:
      profile.monthlySavingsTargetPaise > 0 &&
      profile.emergencyFundCurrentPaise < profile.emergencyFundGoalPaise
        ? {
            id: "emergency-fund",
            targetAmountPaise: profile.emergencyFundGoalPaise,
            currentAmountPaise: profile.emergencyFundCurrentPaise,
            contributionDayOfMonth: profile.salaryDay,
          }
        : undefined,
    maximumEmiRatioBasisPoints: ratioRule ? ratioRule.thresholdValue * 100 : undefined,
    maximumTenureMonths: tenureRule?.thresholdValue,
  };
}

export function useEmergencyAssist() {
  const [category, setCategory] = useState<EmergencyCategory | null>(null);
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [constitution, setConstitution] = useState<MoneyConstitution | null>(null);
  const [asOfDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    void Promise.all([pocketPilotClient.getProfile(), pocketPilotClient.getConstitution()])
      .then(([loadedProfile, loadedConstitution]) => {
        setProfile(loadedProfile);
        setConstitution(loadedConstitution);
      })
      .catch(() => undefined);
    const requested = new URLSearchParams(window.location.search).get("emergency");
    if (requested && CATEGORIES.includes(requested as EmergencyCategory)) {
      const timer = window.setTimeout(
        () => setCategory(requested as EmergencyCategory),
        0,
      );
      return () => window.clearTimeout(timer);
    }
  }, []);

  function close() {
    setCategory(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("emergency");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }

  return {
    openForText(text: string): boolean {
      const detected = detectEmergencyCategory(text);
      if (!detected) return false;
      setCategory(detected);
      return true;
    },
    emergencyDialog: category ? (
      <EmergencyAssistFlow
        category={category}
        asOfDate={asOfDate}
        savedProfile={savedContext(profile, constitution, asOfDate)}
        onClose={close}
      />
    ) : null,
  };
}
