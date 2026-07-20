"use client";

import React, { useEffect, useState } from "react";
import { pocketPilotClient } from "@/mocks/adapter";
import type { FinancialProfile } from "@/features/types";
import { useAppDispatch } from "@/features/app-state";

export default function DashboardWidgets() {
  const [safeToSpend, setSafeToSpend] = useState<number | null>(null);
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchData = () => {
      pocketPilotClient.getSafeToSpend().then((sts) => {
        setSafeToSpend(sts.safeAmountPaise);
      }).catch(() => {});

      pocketPilotClient.getProfile().then((p) => {
        setProfile(p);
      }).catch(() => {});
    };

    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const displaySts = safeToSpend !== null 
    ? `₹${Math.floor(safeToSpend / 100).toLocaleString("en-IN")}` 
    : "Loading...";

  const targetPaise = profile?.emergencyFundGoalPaise || 1; // avoid /0
  const balancePaise = profile?.emergencyFundCurrentPaise || 0;
  const progressPercent = Math.min(100, Math.round((balancePaise / targetPaise) * 100));

  return (
    <div className="mb-8 animate-fade-in">
      {/* Affordability Snapshot */}
      <div 
        onClick={() => dispatch({ type: "SET_VIEW", view: "constitution" })}
        className="bg-white border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[#3b82f6] bg-blue-50 p-1.5 rounded-lg text-sm">💼</span>
            <h3 className="font-semibold text-[14px] text-[var(--color-text-primary)]">Affordability Snapshot</h3>
          </div>
          <span className="text-[var(--color-text-muted)] text-lg">&rsaquo;</span>
        </div>
        
        <div className="mb-6">
          <p className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1">Safe to spend</p>
          <p className="text-[28px] font-bold text-[var(--color-safe)] leading-none">{displaySts}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-medium text-[var(--color-text-secondary)]">Savings Goal Progress</p>
            <p className="text-[12px] font-bold text-[var(--color-text-primary)]">{progressPercent}%</p>
          </div>
          <div className="h-2 w-full bg-[var(--color-bg-hover)] rounded-full overflow-hidden mb-2">
            <div className="h-full bg-[var(--color-safe)] rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="text-[11px] font-medium text-[var(--color-text-muted)]">
            ₹{Math.floor(balancePaise / 100).toLocaleString("en-IN")} saved of ₹{Math.floor(targetPaise / 100).toLocaleString("en-IN")} target
          </p>
        </div>
      </div>
    </div>
  );
}
