"use client";

import React, { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { pocketPilotClient } from "@/mocks/adapter";
import type {
  ActionPlan,
  FutureReceipt,
  PostPurchaseStatus,
  SafeToSpend,
  ScenarioComparison,
} from "@/features/types";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

interface PurchaseAnalysisOutput {
  receipt: FutureReceipt;
  comparison: ScenarioComparison;
  plan: ActionPlan;
  safeToSpend: SafeToSpend;
}

type PocketPilotMessage = UIMessage<
  unknown,
  never,
  {
    calculatePurchase: {
      input: {
        productName: string;
        pricePaise: number;
        emiMonths?: number;
      };
      output: PurchaseAnalysisOutput;
    };
    recordPurchase: {
      input: { productName: string; amountPaise: number };
      output: PostPurchaseStatus;
    };
  }
>;

function getChatErrorMessage(error: Error): string {
  try {
    const payload: unknown = JSON.parse(error.message);
    if (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
    ) {
      return payload.error;
    }
  } catch {
    // The SDK can also provide a normal plain-text error message.
  }

  return error.message;
}

export default function ChatWorkspace() {
  const [userName, setUserName] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch the user's name on mount
  useEffect(() => {
    pocketPilotClient.getProfile().then((profile) => {
      setUserName(profile?.name || "there");
    }).catch(() => {
      setUserName("Aarav");
    });
  }, []);

  const { messages, status, sendMessage, setMessages, error } =
    useChat<PocketPilotMessage>({
      transport: new DefaultChatTransport({ api: "/api/chat" }),
    });

  // Inject greeting once we have the username
  useEffect(() => {
    if (userName && messages.length === 0) {
      setMessages([{
        id: "greeting",
        role: "assistant",
        parts: [{
          type: "text",
          text: `Hi ${userName}! I'm your pre-spend pilot. What are you thinking of buying today?`,
        }],
      }]);
    }
  }, [userName, messages.length, setMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleDemoPurchase() {
    sendMessage({
      text: "Can I afford a Samsung Galaxy S25 Ultra for ₹59,999 on 12-month EMI?",
    });
  }

  function handleQuickFill() {
    handleDemoPurchase();
  }

  // A custom submit handler that adapts to our ChatInput
  const handleSend = (text: string) => {
    sendMessage({ text });
  };

  return (
    <div className="flex flex-col h-screen lg:h-screen">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 space-y-4"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((m) => {
              // Split parts: text first, then tool results — so the vibe-check text
              // always renders ABOVE the receipt/comparison/plan cards.
              const textParts = m.parts.filter((p) => p.type === "text" && p.text);
              const toolParts = m.parts.filter(
                (p) => p.type === "tool-calculatePurchase" || p.type === "tool-recordPurchase",
              );

              return (
                <div key={m.id} className="space-y-4">
                  {/* 1️⃣ Text (LLM vibe check) */}
                  {textParts.map((part, index) => (
                    <MessageBubble
                      key={`${m.id}-text-${index}`}
                      message={{
                        id: m.id,
                        role: m.role,
                        type: "text",
                        content: (part as { type: "text"; text: string }).text,
                        timestamp: "",
                      }}
                      receipt={null}
                      comparison={null}
                      plan={null}
                      safeToSpend={null}
                      onQuickFill={handleQuickFill}
                    />
                  ))}

                  {/* 2️⃣ Tool result cards — always below the text */}
                  {toolParts.map((part) => {
                    // ── calculatePurchase ──────────────────────────────────
                    if (part.type === "tool-calculatePurchase") {
                      if (part.state === "output-available") {
                        const { receipt, comparison, plan, safeToSpend } = part.output;
                        return (
                          <div key={part.toolCallId} className="space-y-4">
                            <MessageBubble
                              message={{ id: `${part.toolCallId}-rcpt`, role: "assistant", type: "receipt", content: "", timestamp: "" }}
                              receipt={receipt}
                              comparison={null}
                              plan={null}
                              safeToSpend={safeToSpend}
                              onQuickFill={handleQuickFill}
                            />
                            {comparison && comparison.scenarios.length > 0 && (
                              <MessageBubble
                                message={{ id: `${part.toolCallId}-scen`, role: "assistant", type: "scenarios", content: "", timestamp: "" }}
                                receipt={null}
                                comparison={comparison}
                                plan={null}
                                safeToSpend={null}
                                onQuickFill={handleQuickFill}
                              />
                            )}
                            {plan && (
                              <MessageBubble
                                message={{ id: `${part.toolCallId}-plan`, role: "assistant", type: "safe-plan", content: "", timestamp: "" }}
                                receipt={null}
                                comparison={null}
                                plan={plan}
                                safeToSpend={null}
                                onQuickFill={handleQuickFill}
                              />
                            )}
                          </div>
                        );
                      }
                      // Still running
                      return (
                        <div key={part.toolCallId} className="flex items-center gap-1.5 px-4 py-3 animate-fade-in">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" style={{ animation: "pp-dot-bounce 1.4s ease-in-out 0s infinite" }} />
                            <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" style={{ animation: "pp-dot-bounce 1.4s ease-in-out 0.2s infinite" }} />
                            <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" style={{ animation: "pp-dot-bounce 1.4s ease-in-out 0.4s infinite" }} />
                          </div>
                          <span className="text-[13px] text-[var(--color-text-muted)] ml-1">Running cash-flow engine…</span>
                        </div>
                      );
                    }

                    // ── recordPurchase ─────────────────────────────────────
                    if (part.type === "tool-recordPurchase") {
                      if (part.state === "output-available") {
                        return (
                          <AccountStatusCard key={part.toolCallId} status={part.output} />
                        );
                      }
                      return (
                        <div key={part.toolCallId} className="flex items-center gap-1.5 px-4 py-3 animate-fade-in">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" style={{ animation: "pp-dot-bounce 1.4s ease-in-out 0s infinite" }} />
                            <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" style={{ animation: "pp-dot-bounce 1.4s ease-in-out 0.2s infinite" }} />
                            <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" style={{ animation: "pp-dot-bounce 1.4s ease-in-out 0.4s infinite" }} />
                          </div>
                          <span className="text-[13px] text-[var(--color-text-muted)] ml-1">Updating your account…</span>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              );
            })}

          {error && (
            <p className="px-4 py-3 text-[13px] text-red-600" role="alert">
              {getChatErrorMessage(error)}
            </p>
          )}

          {/* Fallback general loading state if waiting for response but not in tool invocation */}
          {(status === "submitted" || status === "streaming") && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="flex items-center gap-1.5 px-4 py-3 animate-fade-in">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" style={{ animation: "pp-dot-bounce 1.4s ease-in-out 0s infinite" }} />
                <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" style={{ animation: "pp-dot-bounce 1.4s ease-in-out 0.2s infinite" }} />
                <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" style={{ animation: "pp-dot-bounce 1.4s ease-in-out 0.4s infinite" }} />
              </div>
              <span className="text-[13px] text-[var(--color-text-muted)] ml-1">PocketPilot is thinking…</span>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onDemoPurchase={handleDemoPurchase}
        showDemoButton={messages.length <= 1}
      />
    </div>
  );
}

// ─── Account Status Card ──────────────────────────────────────────────────────
// Rendered when the user reports a completed purchase (recordPurchase tool).

const BUFFER_META: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  excellent: { label: "Excellent", color: "#22c55e", bg: "rgba(34,197,94,0.1)",  icon: "🟢" },
  good:      { label: "Good",      color: "#84cc16", bg: "rgba(132,204,22,0.1)", icon: "🟡" },
  tight:     { label: "Tight",     color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: "🟠" },
  critical:  { label: "Critical",  color: "#ef4444", bg: "rgba(239,68,68,0.1)",  icon: "🔴" },
};

function fmt(paise: number): string {
  return "₹" + Math.floor(paise / 100).toLocaleString("en-IN");
}

function AccountStatusCard({ status }: { status: PostPurchaseStatus }) {
  const { productName, amountPaise, newBalancePaise, safeToSpend, recommendations } = status;
  const meta = BUFFER_META[safeToSpend.bufferQuality] ?? BUFFER_META.good;

  return (
    <div
      style={{
        background: "var(--color-surface, #1e1e2e)",
        border: `1px solid ${meta.color}44`,
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "22px" }}>🧾</span>
        <div>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted, #888)", margin: 0 }}>
            Purchase recorded
          </p>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text, #fff)", margin: 0 }}>
            {productName} · {fmt(amountPaise)}
          </p>
        </div>
      </div>

      {/* Balance row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div
          style={{
            background: "var(--color-surface-alt, rgba(255,255,255,0.04))",
            borderRadius: "12px",
            padding: "14px",
          }}
        >
          <p style={{ fontSize: "11px", color: "var(--color-text-muted, #888)", margin: "0 0 4px" }}>
            New Balance
          </p>
          <p style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-text, #fff)", margin: 0 }}>
            {fmt(newBalancePaise)}
          </p>
        </div>

        <div
          style={{
            background: meta.bg,
            borderRadius: "12px",
            padding: "14px",
            border: `1px solid ${meta.color}33`,
          }}
        >
          <p style={{ fontSize: "11px", color: "var(--color-text-muted, #888)", margin: "0 0 4px" }}>
            Safe to Spend
          </p>
          <p style={{ fontSize: "20px", fontWeight: 800, color: meta.color, margin: 0 }}>
            {fmt(safeToSpend.safeAmountPaise)}
          </p>
          <p style={{ fontSize: "11px", color: meta.color, margin: "4px 0 0", opacity: 0.85 }}>
            {meta.icon} Buffer: {meta.label}
          </p>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--color-text-muted, #888)",
              margin: "0 0 8px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Recommendations
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
            {recommendations.map((rec, i) => (
              <li
                key={i}
                style={{
                  fontSize: "13px",
                  color: "var(--color-text, #fff)",
                  background: "var(--color-surface-alt, rgba(255,255,255,0.04))",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  lineHeight: 1.5,
                }}
              >
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
