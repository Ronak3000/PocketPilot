// ── Emergency Funding Provider Types ──
// These are simulation interfaces only.
// PocketPilot does not partner with any real lender.

import type { ExplicitLoanOffer } from "@/core/finance/emergency";

export interface FundingOffer extends ExplicitLoanOffer {
  /** Placeholder provider name (simulation only — not a real lender). */
  providerDisplayName: string;
  /** Demo Key Fact Statement text. */
  keyFactStatement: string;
  /** Mandatory disclaimer. */
  disclaimer: string;
}

export interface FundingProviderAdapter {
  /**
   * Returns a list of deterministic mock offers for the given loan amount.
   * Never uses real lender data, logos, or partner links.
   */
  listOffers(params: { principalPaise: number; asOfDate: string }): Promise<FundingOffer[]>;
}
