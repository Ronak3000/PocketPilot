"use client";

import type { ChatMessage, FutureReceipt, ScenarioComparison, ActionPlan } from "@/features/types";
import FutureReceiptCard from "@/features/receipt/FutureReceiptCard";
import ScenarioComparisonView from "@/features/scenarios/ScenarioComparison";
import SafePurchasePlan from "@/features/plan/SafePurchasePlan";
import QuickFillChips from "./QuickFillChips";

interface MessageBubbleProps {
  message: ChatMessage;
  receipt: FutureReceipt | null;
  comparison: ScenarioComparison | null;
  plan: ActionPlan | null;
  onQuickFill: (value: string) => void;
}

export default function MessageBubble({
  message,
  receipt,
  comparison,
  plan,
  onQuickFill,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  // Loading message
  if (message.type === "loading") {
    return (
      <div className="flex items-start gap-3 animate-fade-up">
        <div className="w-7 h-7 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
          P
        </div>
        <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] max-w-[85%]">
          <p className="text-[14px] text-[var(--color-text-secondary)] animate-pulse-soft">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  // Rich content: Receipt
  if (message.type === "receipt" && receipt) {
    return (
      <div className="animate-fade-up">
        <FutureReceiptCard receipt={receipt} />
      </div>
    );
  }

  // Rich content: Scenarios
  if (message.type === "scenarios" && comparison) {
    return (
      <div className="animate-fade-up">
        <ScenarioComparisonView comparison={comparison} />
      </div>
    );
  }

  // Rich content: Safe Plan
  if (message.type === "safe-plan" && plan) {
    return (
      <div className="animate-fade-up">
        <SafePurchasePlan plan={plan} />
      </div>
    );
  }

  // Text messages
  return (
    <div
      className={`flex items-start gap-4 animate-fade-up ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      {!isUser ? (
        <div className="relative w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[16px] shadow-sm flex-shrink-0 mt-1">
          🤖
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
            <span className="text-[#3b82f6] text-[10px]">✨</span>
          </div>
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[14px] shadow-sm flex-shrink-0 mt-1">
          👤
        </div>
      )}

      <div className={`max-w-[85%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`
            px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm
            ${
              isUser
                ? "bg-slate-100 text-slate-800 rounded-tr-sm"
                : "bg-white border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-tl-sm"
            }
          `}
        >
          {message.content}
        </div>

        {/* Quick-fill chips */}
        {message.type === "missing-context" && message.quickFillOptions && (
          <div className="mt-3">
            <QuickFillChips
              options={message.quickFillOptions}
              onSelect={onQuickFill}
            />
          </div>
        )}
      </div>
    </div>
  );
}
