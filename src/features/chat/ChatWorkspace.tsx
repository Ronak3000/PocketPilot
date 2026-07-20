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

import DashboardHeader from "../dashboard/DashboardHeader";
import DashboardWidgets from "../dashboard/DashboardWidgets";

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
      text: "Can I afford an iPhone 15 for ₹79,900?",
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
    <div className="flex flex-col h-screen lg:h-[100dvh]">
      {/* Scrollable Main Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-10 lg:px-12"
      >
        <div className="max-w-[1200px] mx-auto">
          {/* Static Dashboard Elements */}
          <DashboardHeader />
          {messages.length <= 1 && <DashboardWidgets />}
          
          {/* Chat Messages */}
          <div className="mt-8 space-y-6">
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
                      onQuickFill={handleQuickFill}
                    />
                  ))}

                  {/* 2️⃣ Tool result cards — always below the text */}
                  {toolParts.map((part) => {
                    // ── calculatePurchase ──────────────────────────────────
                    if (part.type === "tool-calculatePurchase") {
                      if (part.state === "output-available" || (part as any).state === "result") {
                        const output = part.output || (part as any).result;
                        if (!output) {
                           return <div key={part.toolCallId} className="text-red-500 px-4 py-2">Error: Tool completed but no output received.</div>;
                        }
                        const { receipt, comparison, plan } = output;
                        return (
                          <div key={part.toolCallId} className="space-y-4">
                            <MessageBubble
                              message={{ id: `${part.toolCallId}-rcpt`, role: "assistant", type: "receipt", content: "", timestamp: "" }}
                              receipt={receipt}
                              comparison={null}
                              plan={null}
                              onQuickFill={handleQuickFill}
                            />
                            {comparison && comparison.scenarios.length > 0 && (
                              <MessageBubble
                                message={{ id: `${part.toolCallId}-scen`, role: "assistant", type: "scenarios", content: "", timestamp: "" }}
                                receipt={null}
                                comparison={comparison}
                                plan={null}
                                onQuickFill={handleQuickFill}
                              />
                            )}
                            {plan && (
                              <MessageBubble
                                message={{ id: `${part.toolCallId}-plan`, role: "assistant", type: "safe-plan", content: "", timestamp: "" }}
                                receipt={null}
                                comparison={null}
                                plan={plan}
                                onQuickFill={handleQuickFill}
                              />
                            )}
                          </div>
                        );
                      }
                      
                      if ((part as any).errorText || (part as any).error) {
                        return (
                          <div key={part.toolCallId} className="text-red-500 px-4 py-2">
                            Engine Error: {(part as any).errorText || (part as any).error}
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
                      if (part.state === "output-available" || (part as any).state === "result") {
                        const output = part.output || (part as any).result;
                        if (!output) {
                           return <div key={part.toolCallId} className="text-red-500 px-4 py-2">Error: Tool completed but no output received.</div>;
                        }
                        return (
                          <AccountStatusCard key={part.toolCallId} status={output} />
                        );
                      }
                      
                      if ((part as any).errorText || (part as any).error) {
                        return (
                          <div key={part.toolCallId} className="text-red-500 px-4 py-2">
                            Engine Error: {(part as any).errorText || (part as any).error}
                          </div>
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

          </div>
          {/* Fallback general loading state if waiting for response but not in tool invocation */}
          {(status === "submitted" || status === "streaming") && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="flex items-center gap-1.5 px-4 py-3 animate-fade-in mt-4">
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

function fmt(paise: number): string {
  return "₹" + Math.floor(paise / 100).toLocaleString("en-IN");
}

function AccountStatusCard({ status }: { status: PostPurchaseStatus }) {
  const { productName, amountPaise, newBalancePaise, recommendations } = status;

  return (
    <div
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
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
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
            Purchase recorded
          </p>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
            {productName} · {fmt(amountPaise)}
          </p>
        </div>
      </div>

      {/* New Balance */}
      <div
        style={{
          background: "var(--color-bg-secondary)",
          borderRadius: "12px",
          padding: "14px",
        }}
      >
        <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: "0 0 4px" }}>
          New Balance
        </p>
        <p style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
          {fmt(newBalancePaise)}
        </p>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              margin: "0 0 8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            RECOMMENDATIONS
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {recommendations.map((rec, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  background: "var(--color-bg-secondary)",
                  padding: "10px",
                  borderRadius: "8px",
                }}
              >
                <span style={{ fontSize: "14px" }}>💡</span>
                <p style={{ fontSize: "13px", margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                  {rec}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
