// ── Mock Funding Provider Adapter ──
// SIMULATION ONLY — not affiliated with any real lender or NBFC.
// No real logos, affiliate links, or partnership claims.
// Final approval belongs to the regulated lender.

import type { FundingOffer, FundingProviderAdapter } from "./types";

const DISCLAIMER =
  "This is a simulation for illustrative purposes only. " +
  "PocketPilot is not a lender, NBFC, or financial intermediary. " +
  "Final loan approval and disbursement belong to an RBI-regulated bank or NBFC. " +
  "Interest rates, fees and eligibility shown are indicative and not guaranteed.";

function buildKeyFactStatement(params: {
  providerName: string;
  principalPaise: number;
  annualRateBasisPoints: number;
  tenureMonths: number;
  processingFeePaise: number;
  totalRepaymentPaise: number;
  monthlyEmiPaise: number;
}): string {
  const inr = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;
  const pct = (bp: number) => `${(bp / 100).toFixed(2)}%`;
  return [
    `[DEMO KEY FACT STATEMENT — ${params.providerName}]`,
    `Loan Amount: ${inr(params.principalPaise)}`,
    `Annual Interest Rate (APR): ${pct(params.annualRateBasisPoints)} p.a.`,
    `Tenure: ${params.tenureMonths} months`,
    `Monthly EMI: ${inr(params.monthlyEmiPaise)}`,
    `Processing Fee: ${inr(params.processingFeePaise)}`,
    `Total Repayment: ${inr(params.totalRepaymentPaise)}`,
    `Disbursal: typically within 2–5 business days (indicative)`,
    `Final approval: Belongs to the regulated lender. This is not a loan offer.`,
  ].join("\n");
}

/**
 * Returns 3 deterministic mock loan offers based on the principal.
 * Offers cover low-rate / mid-rate / high-rate scenarios.
 * Ranked by total cost (ascending) in the comparison view.
 */
export class MockFundingProviderAdapter implements FundingProviderAdapter {
  async listOffers(params: {
    principalPaise: number;
    asOfDate: string;
  }): Promise<FundingOffer[]> {
    const { principalPaise } = params;

    // ── Offer 1: Low Rate, Longer Tenure ──
    // 14% APR, 18 months
    const offer1Emi = calcEmiApprox(principalPaise, 1400, 18);
    const offer1ProcessingFee = Math.round(principalPaise * 0.01); // 1%
    const offer1Total = offer1Emi * 18 + offer1ProcessingFee;

    // ── Offer 2: Mid Rate, Standard Tenure ──
    // 18% APR, 12 months
    const offer2Emi = calcEmiApprox(principalPaise, 1800, 12);
    const offer2ProcessingFee = Math.round(principalPaise * 0.015); // 1.5%
    const offer2Total = offer2Emi * 12 + offer2ProcessingFee;

    // ── Offer 3: Higher Rate, Shorter Tenure ──
    // 24% APR, 6 months
    const offer3Emi = calcEmiApprox(principalPaise, 2400, 6);
    const offer3ProcessingFee = Math.round(principalPaise * 0.02); // 2%
    const offer3Total = offer3Emi * 6 + offer3ProcessingFee;

    const offers: FundingOffer[] = [
      {
        id: "mock-offer-alpha",
        providerDisplayName: "Demo Provider Alpha (Simulation)",
        principalPaise,
        annualRateBasisPoints: 1400,
        tenureMonths: 18,
        processingFeePaise: offer1ProcessingFee,
        otherChargesPaise: 0,
        disbursalWindowDays: 3,
        eligibilityCriteria: [
          "Income above ₹25,000/month",
          "No existing defaults",
          "Subject to regulated lender verification",
        ],
        keyFactStatement: buildKeyFactStatement({
          providerName: "Demo Provider Alpha",
          principalPaise,
          annualRateBasisPoints: 1400,
          tenureMonths: 18,
          processingFeePaise: offer1ProcessingFee,
          totalRepaymentPaise: offer1Total,
          monthlyEmiPaise: offer1Emi,
        }),
        disclaimer: DISCLAIMER,
      },
      {
        id: "mock-offer-beta",
        providerDisplayName: "Demo Provider Beta (Simulation)",
        principalPaise,
        annualRateBasisPoints: 1800,
        tenureMonths: 12,
        processingFeePaise: offer2ProcessingFee,
        otherChargesPaise: 0,
        disbursalWindowDays: 2,
        eligibilityCriteria: [
          "Income above ₹20,000/month",
          "Credit score check required",
          "Subject to regulated lender verification",
        ],
        keyFactStatement: buildKeyFactStatement({
          providerName: "Demo Provider Beta",
          principalPaise,
          annualRateBasisPoints: 1800,
          tenureMonths: 12,
          processingFeePaise: offer2ProcessingFee,
          totalRepaymentPaise: offer2Total,
          monthlyEmiPaise: offer2Emi,
        }),
        disclaimer: DISCLAIMER,
      },
      {
        id: "mock-offer-gamma",
        providerDisplayName: "Demo Provider Gamma (Simulation)",
        principalPaise,
        annualRateBasisPoints: 2400,
        tenureMonths: 6,
        processingFeePaise: offer3ProcessingFee,
        otherChargesPaise: 0,
        disbursalWindowDays: 1,
        eligibilityCriteria: [
          "Income above ₹15,000/month",
          "Faster disbursal, higher rate",
          "Subject to regulated lender verification",
        ],
        keyFactStatement: buildKeyFactStatement({
          providerName: "Demo Provider Gamma",
          principalPaise,
          annualRateBasisPoints: 2400,
          tenureMonths: 6,
          processingFeePaise: offer3ProcessingFee,
          totalRepaymentPaise: offer3Total,
          monthlyEmiPaise: offer3Emi,
        }),
        disclaimer: DISCLAIMER,
      },
    ];

    return offers;
  }
}

/**
 * Approximate EMI for display purposes in the Key Fact Statement.
 * Exact value is calculated by the finance engine in assessEmergencyAffordability.
 */
function calcEmiApprox(
  principalPaise: number,
  annualRateBasisPoints: number,
  tenureMonths: number,
): number {
  if (annualRateBasisPoints === 0) {
    return Math.ceil(principalPaise / tenureMonths);
  }
  const r = annualRateBasisPoints / (12 * 10_000);
  const power = Math.pow(1 + r, tenureMonths);
  return Math.round((principalPaise * r * power) / (power - 1));
}

export const mockFundingProviderAdapter = new MockFundingProviderAdapter();
