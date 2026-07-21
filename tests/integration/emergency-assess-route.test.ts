import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/emergency/assess/route";
import type { EmergencyContext } from "@/core/finance/emergency";

const CONTEXT: EmergencyContext = {
  category: "medical",
  totalNeededPaise: 12_000_000,
  alreadyAvailablePaise: 2_000_000,
  requiredByDate: "2026-08-25",
  currentBalancePaise: 7_200_000,
  monthlyIncomePaise: 4_800_000,
  nextIncomeDate: "2026-09-01",
  protectedBalanceFloorPaise: 1_000_000,
  protectedMonthlyExpensesPaise: 1_900_000,
  existingMonthlyEmiPaise: 350_000,
  activeGoalMonthlyContributionPaise: 800_000,
  maximumEmiRatioBasisPoints: 4_000,
  maximumTenureMonths: 24,
  asOfDate: "2026-08-15",
};

function post(context: unknown) {
  return POST(new Request("http://localhost/api/emergency/assess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context }),
  }));
}

describe("POST /api/emergency/assess", () => {
  it("returns deterministic mock offers assessed on the server", async () => {
    const response = await post(CONTEXT);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.comparison.fundingGapPaise).toBe(10_000_000);
    expect(body.comparison.offers.map((offer: { offerId: string }) => offer.offerId))
      .toEqual(["mock-offer-beta", "mock-offer-alpha", "mock-offer-gamma"]);
    expect(body.offers).toHaveLength(3);
  });

  it("returns no credit offers when the verified gap is zero", async () => {
    const response = await post({ ...CONTEXT, alreadyAvailablePaise: 12_000_000 });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      offers: [],
      comparison: { offers: [], fundingGapPaise: 0 },
    });
  });

  it("rejects incomplete, invalid, and unsafe money inputs", async () => {
    const missing = await post({ category: "medical", asOfDate: "2026-08-15" });
    const fractional = await post({ ...CONTEXT, totalNeededPaise: 1.5 });
    const negative = await post({ ...CONTEXT, monthlyIncomePaise: -1 });

    expect(missing.status).toBe(400);
    expect(fractional.status).toBe(400);
    expect(negative.status).toBe(400);
  });

  it("rejects malformed JSON as a client error", async () => {
    const response = await POST(new Request("http://localhost/api/emergency/assess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    }));

    expect(response.status).toBe(400);
  });
});
