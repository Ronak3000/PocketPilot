"use client";

import React, { useState, useEffect } from "react";
import { pocketPilotClient } from "@/mocks/adapter";
import type { HistoryEntry } from "@/features/types";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Shimmer from "@/components/ui/Shimmer";

interface HistoryPanelProps {
  /** Increment this value each time the panel is shown to force a data refresh */
  refreshKey?: number;
}

export default function HistoryPanel({ refreshKey = 0 }: HistoryPanelProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    async function load() {
      try {
        const history = await pocketPilotClient.getHistory();
        setEntries(history);
      } finally {
        setLoading(false);
      }
    }
    load();
  // refreshKey changes every time the user navigates to this panel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const typeLabels: Record<string, string> = {
    receipt: "Future Receipt",
    plan_approved: "Purchase Recorded",
    abandoned: "Abandoned",
    goal_delay_avoided: "Goal Delay Avoided",
    breach_prevented: "Breach Prevented",
  };

  const typeIcons: Record<string, string> = {
    receipt: "🧾",
    plan_approved: "✅",
    abandoned: "❌",
    goal_delay_avoided: "🎯",
    breach_prevented: "🛡️",
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 lg:py-12">
        <Shimmer lines={4} lineHeight="h-20" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Decision History</h1>
        <p className="text-[var(--color-text-secondary)] mt-1.5 text-[14px]">
          Your past financial decisions and their outcomes.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 animate-fade-up">
          <p className="text-4xl mb-4">📋</p>
          <h3 className="text-lg font-medium text-[var(--color-text-secondary)]">No decisions yet</h3>
          <p className="text-[14px] text-[var(--color-text-muted)] mt-1">
            Ask PocketPilot about a purchase to see your first Future Receipt here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <Card key={entry.id} hover className={`animate-fade-up stagger-${Math.min(i + 1, 6)}`}>
              <div className="flex items-start gap-4">
                <span className="text-2xl">{typeIcons[entry.type] || "📄"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider">
                      {typeLabels[entry.type] || entry.type}
                    </span>
                    <Badge status={entry.status} size="sm" />
                  </div>
                  <h3 className="text-[14px] font-medium truncate">{entry.title}</h3>
                  <p className="text-[12px] text-[var(--color-text-muted)] mt-1">
                    {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
