"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch } from "@/features/app-state";
import { pocketPilotClient } from "@/mocks/adapter";
import { formatCurrency } from "@/features/format";
import type { ConstitutionRule } from "@/features/types";
import Card from "@/components/ui/Card";
import Toggle from "@/components/ui/Toggle";
import Button from "@/components/ui/Button";
import Shimmer from "@/components/ui/Shimmer";

export default function ConstitutionPanel() {
  const dispatch = useAppDispatch();
  const [rules, setRules] = useState<ConstitutionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        const constitution = await pocketPilotClient.getConstitution();
        setRules(constitution.rules);
        dispatch({ type: "SET_CONSTITUTION", constitution });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dispatch]);

  function toggleRule(ruleId: string) {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  }

  function startEdit(rule: ConstitutionRule) {
    setEditingId(rule.id);
    if (rule.thresholdType === "amount_paise") {
      setEditValue(String(rule.thresholdValue / 100));
    } else {
      setEditValue(String(rule.thresholdValue));
    }
  }

  function saveEdit(ruleId: string) {
    const numVal = parseFloat(editValue);
    if (isNaN(numVal)) return;
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        const newValue = r.thresholdType === "amount_paise" ? numVal * 100 : numVal;
        return { ...r, thresholdValue: newValue };
      })
    );
    setEditingId(null);
  }

  async function saveAll() {
    setSaving(true);
    try {
      const constitution = await pocketPilotClient.updateConstitution({ rules });
      dispatch({ type: "SET_CONSTITUTION", constitution });
    } finally {
      setSaving(false);
    }
  }

  function formatThreshold(rule: ConstitutionRule): string {
    switch (rule.thresholdType) {
      case "amount_paise":
        return formatCurrency(rule.thresholdValue);
      case "percentage":
        return `${rule.thresholdValue}%`;
      case "months":
        return `${rule.thresholdValue} months`;
      case "days":
        return `${rule.thresholdValue} days`;
      default:
        return String(rule.thresholdValue);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 lg:py-12">
        <Shimmer lines={5} lineHeight="h-16" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Money Constitution</h1>
        <p className="text-[var(--color-text-secondary)] mt-1.5 text-[14px] leading-relaxed">
          Your personal financial rules. PocketPilot checks every purchase against these.
        </p>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <Card key={rule.id} className="animate-fade-up">
            <div className="flex items-start gap-4">
              <span className="text-xl mt-0.5">{rule.icon || "📌"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-medium text-[var(--color-text-primary)]">
                    {rule.name}
                  </h3>
                  {rule.locked && (
                    <span className="text-[11px] text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] px-1.5 py-0.5 rounded">
                      🔒 Locked
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">
                  {rule.description}
                </p>

                {/* Threshold display / edit */}
                <div className="mt-2 flex items-center gap-2">
                  {editingId === rule.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="
                          w-24 px-2 py-1 bg-[var(--color-input-bg)] border border-[var(--color-input-border)]
                          rounded-[var(--radius-sm)] text-[13px] font-mono-numbers
                          focus:outline-none focus:border-[var(--color-input-focus)]
                        "
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(rule.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <Button size="sm" onClick={() => saveEdit(rule.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-[13px] font-medium font-mono-numbers text-[var(--color-accent-text)]">
                        {formatThreshold(rule)}
                      </span>
                      {!rule.locked && (
                        <button
                          onClick={() => startEdit(rule)}
                          className="text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <Toggle
                checked={rule.enabled}
                onChange={() => toggleRule(rule.id)}
                disabled={rule.locked}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <Button onClick={saveAll} loading={saving}>
          Save Constitution
        </Button>
      </div>

      {/* Empty state */}
      {rules.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📜</p>
          <p className="text-[var(--color-text-secondary)]">No rules yet. Add your first financial rule.</p>
        </div>
      )}
    </div>
  );
}
