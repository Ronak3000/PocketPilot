import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { db } from "@/server/db";
import { runFullAnalysis } from "@/server/bridge";
import { calculateSafeToSpend, type FinancialEvent } from "@/core/finance";
import type { ExtractedDecision, SafeToSpend } from "@/features/types";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          error:
            "Google Generative AI is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local.",
        },
        { status: 503 },
      );
    }

    const body: unknown = await req.json();
    if (
      typeof body !== "object" ||
      body === null ||
      !("messages" in body) ||
      !Array.isArray(body.messages)
    ) {
      return Response.json(
        { error: "The request must include a messages array." },
        { status: 400 },
      );
    }

    const messages = body.messages as UIMessage[];

    const profile = db.getProfile();
    const constitution = db.getConstitution();

    if (!profile || !constitution) {
      return Response.json(
        {
          error:
            "Profile or Constitution not found. Please complete onboarding.",
        },
        { status: 400 },
      );
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const result = streamText({
      model: google("gemini-3.5-flash"),
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(3),
      onError: ({ error }) => {
        console.error("Gemini chat stream failed:", error);
      },
      system: `You are PocketPilot — the most unhinged, real, no-cap financial co-pilot on the planet. You're that one friend who went to business school but still texts in pure Gen Z slang and will NOT let your bestie fumble their bag.
Your user's name is ${profile.name}.

YOUR VIBE:
- Talk like a Gen Z bestie. Use words like: no cap, lowkey, slay, fr fr, bussin, mid, based, rent free, understood the assignment, W, L, not it, on god, periodt, we move, ngl, hits different, era, delulu, it's giving, main character energy, we're cooked, bestie, bro, fam.
- Be SHORT and punchy. Max 2-3 sentences after the tool result. No walls of text.
- Match the energy to the financial situation. Reckless spending → call them out aggressively (lovingly). Smart spending → HYPE THEM UP.
- NEVER output markdown tables or bullet lists in your text response — the UI renders the cards automatically. Just drop your vibe check.

AGGRESSION LEVEL based on financial safety:
- "safe_now" / "excellent" / "good" buffer → Hype mode: e.g. "bestie you UNDERSTOOD THE ASSIGNMENT no cap, this is a W purchase fr fr 🔥 go get it!"
- "safe_with_caution" / "tight" buffer → Real talk: e.g. "okay lowkey you CAN swing this but don't go unhinged on me, budget era is now activated 👀"
- "not_safe" / "critical" buffer → Full roast (lovingly): e.g. "bro are you actually cooked rn?? this is giving broke era, your bank account called and it's crying 😭 we are NOT doing this today bestie"

TWO TOOLS — know which one to use:

1. 'calculatePurchase' → Use when user is CONSIDERING a future purchase ("can I buy X?", "should I get Y?"). Runs projections BEFORE they spend.

2. 'recordPurchase' → Use when user has ALREADY spent money ("I bought X", "I just paid ₹Y for Z", "I made a payment of ₹Y", "where does that leave me?"). This deducts from their real balance and updates the account state.

WORKFLOW for pre-spend (calculatePurchase):
1. Collect productName AND price. If price is missing, ask for it.
2. Call 'calculatePurchase' IMMEDIATELY once you have both.
3. After the tool returns, give ONE punchy Gen Z reaction (2-3 sentences MAX). The UI shows the numbers.

WORKFLOW for post-spend (recordPurchase):
1. Extract the productName and amount from what the user said. If amount is unclear, ask.
2. Call 'recordPurchase' IMMEDIATELY — this is a done deal, no projections needed.
3. After the tool returns, react to their new financial reality with appropriate energy. Tell them how they're doing and whether to chill on spending. 2-3 sentences max.

You are chaotic good. You care about ${profile.name}'s bag but you will absolutely drag them if they're being financially delulu. Tough love era, periodt.`,
      tools: {
        calculatePurchase: tool({
          description:
            "Runs deterministic cash-flow projections to see if a user CAN AFFORD a future purchase. Call this ONLY for purchases they have NOT yet made.",
          inputSchema: z.object({
            productName: z
              .string()
              .describe("The name of the product the user wants to buy."),
            pricePaise: z
              .number()
              .int()
              .positive()
              .describe("The total price of the product in Paise. YOU MUST MULTIPLY INR BY 100. (e.g., 50k INR = 50,000 INR = 5000000 Paise). Do not pass raw INR."),
            emiMonths: z
              .number()
              .int()
              .positive()
              .optional()
              .describe(
                "The preferred EMI tenure in months. Default to 12 if not provided.",
              ),
          }),
          execute: async ({ productName, pricePaise, emiMonths }) => {
            const tenureMonths = emiMonths || 12;
            const downPaymentPaise = Math.floor(pricePaise * 0.2);
            const principalPaise = pricePaise - downPaymentPaise;
            const emiAmountPaise = Math.floor(principalPaise / tenureMonths);
            const processingFeePaise = Math.floor(pricePaise * 0.02);

            const decision: ExtractedDecision = {
              id: `decision-${Date.now()}`,
              decisionInputId: `input-${Date.now()}`,
              productName,
              pricePaise,
              downPaymentPaise,
              emiAmountPaise,
              tenureMonths,
              processingFeePaise,
              confidence: 1.0,
              missingFields: [],
              createdAt: new Date().toISOString(),
            };

            // Re-read profile from DB in case a previous recordPurchase updated the balance
            const freshProfile = db.getProfile() ?? profile;
            const analysis = runFullAnalysis(freshProfile, constitution, decision);

            db.setLastDecision(analysis.decision);
            db.setLastComparison(analysis.comparison);
            db.setLastReceipt(analysis.receipt);
            db.setLastPlan(analysis.plan);
            db.setSafeToSpend(analysis.safeToSpend);

            return {
              receipt: analysis.receipt,
              comparison: analysis.comparison,
              plan: analysis.plan,
              safeToSpend: analysis.safeToSpend,
            };
          },
        }),

        recordPurchase: tool({
          description:
            "Records a purchase the user has ALREADY made. Deducts the amount from their live balance, recalculates their safe-to-spend, and returns spending recommendations. Call this when the user says they bought/paid/spent something.",
          inputSchema: z.object({
            productName: z
              .string()
              .describe("The name of what was purchased."),
            amountPaise: z
              .number()
              .int()
              .positive()
              .describe(
                "The total amount already paid in Paise. YOU MUST MULTIPLY INR BY 100. (e.g., 50k INR = 50,000 INR = 5000000 Paise). Use the full purchase price, not an EMI amount.",
              ),
          }),
          execute: async ({ productName, amountPaise }) => {
            // Re-read the freshest profile (handles multiple purchases in a session)
            const freshProfile = db.getProfile() ?? profile;

            const newBalancePaise = Math.max(
              0,
              freshProfile.currentBalancePaise - amountPaise,
            );

            // Persist the updated balance to DB so future calculatePurchase uses it
            db.patchProfile({ currentBalancePaise: newBalancePaise });

            // Recalculate safe-to-spend with the new balance
            const today = new Date().toISOString().split("T")[0] as string;
            const events = buildBasicEvents(freshProfile);

            let safeToSpend: SafeToSpend;
            try {
              const stsResult = calculateSafeToSpend({
                startDate: today,
                currentBalancePaise: newBalancePaise,
                protectedBalanceFloorPaise:
                  freshProfile.protectedBalanceFloorPaise,
                events,
                protectedEventIds: events
                  .filter((e) => e.protected)
                  .map((e) => e.id),
              });

              const bufferRatio =
                stsResult.safeToSpendPaise / freshProfile.monthlySalaryPaise;
              let bufferQuality: SafeToSpend["bufferQuality"] = "excellent";
              if (bufferRatio < 0.1) bufferQuality = "critical";
              else if (bufferRatio < 0.2) bufferQuality = "tight";
              else if (bufferRatio < 0.4) bufferQuality = "good";

              safeToSpend = {
                safeAmountPaise: stsResult.safeToSpendPaise,
                protectedAmountPaise: stsResult.protectedCommitmentsPaise,
                upcomingCommitmentPaise: stsResult.protectedCommitmentsPaise,
                bufferQuality,
                confidence: 0.95,
                lastCalculatedAt: new Date().toISOString(),
              };
            } catch {
              const fallbackSafe = Math.max(
                0,
                newBalancePaise -
                  freshProfile.protectedBalanceFloorPaise -
                  freshProfile.rentPaise -
                  freshProfile.familyTransferPaise,
              );
              const bufferRatio = fallbackSafe / freshProfile.monthlySalaryPaise;
              let bufferQuality: SafeToSpend["bufferQuality"] = "excellent";
              if (bufferRatio < 0.1) bufferQuality = "critical";
              else if (bufferRatio < 0.2) bufferQuality = "tight";
              else if (bufferRatio < 0.4) bufferQuality = "good";

              safeToSpend = {
                safeAmountPaise: fallbackSafe,
                protectedAmountPaise:
                  freshProfile.rentPaise + freshProfile.familyTransferPaise,
                upcomingCommitmentPaise:
                  freshProfile.rentPaise +
                  freshProfile.familyTransferPaise +
                  freshProfile.existingEmiPaise,
                bufferQuality,
                confidence: 0.8,
                lastCalculatedAt: new Date().toISOString(),
              };
            }

            db.setSafeToSpend(safeToSpend);

            // Build spending recommendations
            const recommendations = buildRecommendations(
              safeToSpend,
              freshProfile.monthlySalaryPaise,
            );

            return {
              productName,
              amountPaise,
              newBalancePaise,
              safeToSpend,
              recommendations,
            };
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API request failed:", error);
    const message =
      error instanceof Error ? error.message : "Unknown chat API error";
    return Response.json({ error: message }, { status: 500 });
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function buildBasicEvents(
  p: NonNullable<ReturnType<typeof db.getProfile>>,
): FinancialEvent[] {
  const today = new Date().toISOString().split("T")[0] as string;
  const events: FinancialEvent[] = [
    {
      id: "evt-salary",
      title: "Monthly Salary",
      amountPaise: p.monthlySalaryPaise,
      direction: "inflow",
      kind: "salary",
      schedule: "recurring",
      startDate: today,
      frequency: "monthly",
      dayOfMonth: p.salaryDay,
    },
  ];
  if (p.rentPaise > 0)
    events.push({
      id: "evt-rent",
      title: "Rent",
      amountPaise: p.rentPaise,
      direction: "outflow",
      kind: "rent",
      protected: true,
      schedule: "recurring",
      startDate: today,
      frequency: "monthly",
      dayOfMonth: 1,
    });
  if (p.familyTransferPaise > 0)
    events.push({
      id: "evt-family",
      title: "Family Transfer",
      amountPaise: p.familyTransferPaise,
      direction: "outflow",
      kind: "family_transfer",
      protected: true,
      schedule: "recurring",
      startDate: today,
      frequency: "monthly",
      dayOfMonth: 5,
    });
  if (p.existingEmiPaise > 0)
    events.push({
      id: "evt-emi",
      title: "Existing EMI",
      amountPaise: p.existingEmiPaise,
      direction: "outflow",
      kind: "existing_emi",
      schedule: "recurring",
      startDate: today,
      frequency: "monthly",
      dayOfMonth: 5,
    });
  return events;
}


function buildRecommendations(
  sts: SafeToSpend,
  monthlySalaryPaise: number,
): string[] {
  const recs: string[] = [];
  const safeK = Math.floor(sts.safeAmountPaise / 100);

  if (sts.bufferQuality === "critical") {
    recs.push(
      `🚨 Keep all discretionary spending under ₹${Math.floor(safeK * 0.3).toLocaleString("en-IN")} until your next salary hits`,
    );
    recs.push(
      "❌ No new EMIs or subscriptions for at least 2 months",
    );
    recs.push(
      "💸 Focus on rebuilding your buffer — you're running thin, bestie",
    );
  } else if (sts.bufferQuality === "tight") {
    const monthlyBudget = Math.floor(safeK * 0.4);
    recs.push(
      `⚠️ Limit discretionary spends to ₹${monthlyBudget.toLocaleString("en-IN")}/month for the next 2 months`,
    );
    recs.push(
      "🛑 Avoid any purchases above ₹" +
        Math.floor(safeK * 0.3).toLocaleString("en-IN") +
        " until you've rebuilt a buffer",
    );
  } else if (sts.bufferQuality === "good") {
    const monthlyBudget = Math.floor(
      Math.min(safeK * 0.5, monthlySalaryPaise * 0.15) / 100,
    );
    recs.push(
      `✅ You can still spend up to ₹${monthlyBudget.toLocaleString("en-IN")}/month on non-essentials`,
    );
    recs.push(
      "💡 Consider holding off on any big purchases (>₹10,000) for 1 month to rebuild cushion",
    );
  } else {
    // excellent
    recs.push(
      `🔥 Your buffer is healthy — safe to spend up to ₹${Math.floor(safeK * 0.4).toLocaleString("en-IN")} on discretionary stuff`,
    );
    recs.push("✅ Just keep your monthly savings target on track and you're golden");
  }

  return recs;
}
