"use client";

import React, { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { pocketPilotClient } from "@/mocks/adapter";
import type {
  ActionPlan,
  FutureReceipt,
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
          {messages.map((m) => (
            <div key={m.id} className="space-y-4">
              {m.parts.map((part, index) => {
                if (part.type === "text" && part.text) {
                  return (
                    <MessageBubble
                      key={`${m.id}-text-${index}`}
                      message={{
                        id: m.id,
                        role: m.role,
                        type: "text",
                        content: part.text,
                        timestamp: "",
                      }}
                      receipt={null}
                      comparison={null}
                      plan={null}
                      safeToSpend={null}
                      onQuickFill={handleQuickFill}
                    />
                  );
                }

                if (part.type === "tool-calculatePurchase") {
                  if (part.state === "output-available") {
                    const { receipt, comparison, plan, safeToSpend } =
                      part.output;
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
                  } else {
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
                }
                return null;
              })}
            </div>
          ))}

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
