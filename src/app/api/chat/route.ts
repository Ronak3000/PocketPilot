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
import type { ExtractedDecision } from "@/features/types";

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
      model: google("gemini-2.5-flash"),
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(3),
      onError: ({ error }) => {
        console.error("Gemini chat stream failed:", error);
      },
      system: `You are PocketPilot, a friendly, hyper-intelligent financial pre-spend AI assistant.
Your user's name is ${profile.name}.
Your job is to help the user figure out if they can afford a purchase.
Before making a decision, you must collect the productName and price from the user. 
If they ask 'can I buy a gaming laptop', ask them what the price is.
Once you have the price and product name, you must use the 'calculatePurchase' tool to run the deterministic cash-flow analysis. 
You will receive the financial results from the tool. 
Once you have the results, summarize them in a helpful, conversational, and direct way. Keep it natural and concise. Do NOT output large markdown tables—just a brief conversational summary, as the UI will render the visual receipt card automatically when you call the tool.`,
      tools: {
        calculatePurchase: tool({
          description: "Runs deterministic cash-flow calculations to see if a user can afford a purchase. Call this ONLY when you have extracted the productName and price from the user.",
          inputSchema: z.object({
            productName: z.string().describe("The name of the product the user wants to buy."),
            pricePaise: z.number().int().positive().describe("The total price of the product in Paise (INR * 100)."),
            emiMonths: z.number().int().positive().optional().describe("The preferred EMI tenure in months. Default to 12 if not provided."),
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

            const analysis = runFullAnalysis(profile, constitution, decision);

            // Save to DB so other endpoints can access if needed
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
