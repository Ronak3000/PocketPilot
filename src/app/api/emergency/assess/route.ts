import { NextResponse } from "next/server";
import { z } from "zod";
import {
  compareEmergencyFundingOffers,
  validateEmergencyContext,
  type EmergencyContext,
} from "@/core/finance/emergency";
import { mockFundingProviderAdapter } from "@/features/emergency/providers/mock-adapter";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const paise = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);

const contextSchema = z.object({
  category: z.enum([
    "medical",
    "family",
    "housing",
    "education",
    "income_disruption",
    "other",
  ]),
  totalNeededPaise: paise,
  alreadyAvailablePaise: paise,
  requiredByDate: isoDate,
  currentBalancePaise: paise,
  monthlyIncomePaise: paise,
  nextIncomeDate: isoDate,
  protectedBalanceFloorPaise: paise,
  protectedMonthlyExpensesPaise: paise,
  existingMonthlyEmiPaise: paise,
  activeGoalMonthlyContributionPaise: paise,
  activeGoal: z
    .object({
      id: z.string().min(1),
      targetAmountPaise: paise,
      currentAmountPaise: paise,
      contributionDayOfMonth: z.number().int().min(1).max(31),
    })
    .optional(),
  maximumEmiRatioBasisPoints: z.number().int().min(0).max(10_000).optional(),
  maximumTenureMonths: z.number().int().positive().optional(),
  asOfDate: isoDate,
});
const requestSchema = z.object({ context: contextSchema });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON request is required." }, { status: 400 });
  }

  try {
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Complete, valid financial context is required." },
        { status: 400 },
      );
    }

    const validation = validateEmergencyContext(parsed.data.context as EmergencyContext);
    if (validation.status !== "COMPLETE" || !validation.context) {
      return NextResponse.json(
        { error: validation.missingFieldQuestion ?? "Financial context is incomplete." },
        { status: 400 },
      );
    }

    const fundingGapPaise = Math.max(
      0,
      validation.context.totalNeededPaise - validation.context.alreadyAvailablePaise,
    );
    if (fundingGapPaise === 0) {
      return NextResponse.json({
        offers: [],
        comparison: { offers: [], fundingGapPaise: 0 },
      });
    }
    const offers = await mockFundingProviderAdapter.listOffers({
      principalPaise: fundingGapPaise,
      asOfDate: validation.context.asOfDate,
    });
    const comparison = compareEmergencyFundingOffers({
      context: validation.context,
      offers,
    });

    return NextResponse.json({ offers, comparison });
  } catch {
    return NextResponse.json(
      { error: "The emergency assessment could not be completed." },
      { status: 500 },
    );
  }
}
