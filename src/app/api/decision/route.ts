import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { runFullAnalysis } from "@/server/bridge";
import type { ExtractedDecision } from "@/features/types";

/**
 * POST /api/decision
 * Receives a DecisionInput (text/screenshot/manual), extracts the purchase details,
 * runs the finance engine, and returns the full analysis results.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const profile = db.getProfile();
    const constitution = db.getConstitution();

    if (!profile || !constitution) {
      return NextResponse.json(
        { error: "Profile and constitution are required. Call POST /api/reset first." },
        { status: 400 }
      );
    }

    // ── AI Extraction (mock for MVP — extracts purchase from text) ──
    const now = new Date().toISOString();
    let decision: ExtractedDecision;

    if (body.manualEntry) {
      // Manual entry — user provided structured data
      decision = {
        id: `decision-${Date.now()}`,
        decisionInputId: body.id ?? `input-${Date.now()}`,
        productName: body.manualEntry.productName,
        pricePaise: body.manualEntry.pricePaise,
        downPaymentPaise: body.manualEntry.downPaymentPaise,
        emiAmountPaise: body.manualEntry.emiAmountPaise,
        tenureMonths: body.manualEntry.tenureMonths,
        processingFeePaise: body.manualEntry.processingFeePaise,
        confidence: 1.0,
        missingFields: [],
        createdAt: now,
      };
    } else {
      // Text-based AI extraction (mock — pattern matching for MVP)
      const text = body.rawText ?? body.text ?? "";
      
      // Match EMI tenure (e.g. 12-month or 6 months)
      const tenureMatch = text.match(/(\d+)\s*-?\s*month/i);
      const tenureMonths = tenureMatch ? parseInt(tenureMatch[1], 10) : 12;

      // Match price (e.g. ₹59,999, 1.75 lakhs, 50k, 1.5L)
      let pricePaise = 0;
      let priceFound = false;

      const lakhMatch = text.match(/([\d.]+)\s*(?:lakhs?|l|lac)\b/i);
      if (lakhMatch) {
         pricePaise = Math.round(parseFloat(lakhMatch[1]) * 100000) * 100;
         priceFound = true;
      } else {
         const kMatch = text.match(/([\d.]+)\s*k\b/i);
         if (kMatch) {
            pricePaise = Math.round(parseFloat(kMatch[1]) * 1000) * 100;
            priceFound = true;
         } else {
            const numMatch = text.match(/₹?\s?([\d,]+)/);
            if (numMatch) {
               pricePaise = parseInt(numMatch[1].replace(/,/g, ""), 10) * 100;
               priceFound = true;
            }
         }
      }

      // Guess product name (look for common keywords, or use part of the text)
      let productName = "Purchase";
      if (/phone|mobile|samsung|iphone|galaxy|pixel/i.test(text)) {
        productName = text.match(/(samsung|iphone|galaxy|pixel)\s+([a-z0-9\s]+)/i)?.[0] ?? "Smartphone";
      } else if (/laptop|macbook|thinkpad/i.test(text)) {
        productName = text.match(/(macbook|thinkpad)\s+([a-z0-9\s]+)/i)?.[0] ?? "Laptop";
      } else {
        // Fallback: take a snippet before 'for' or '₹'
        const productMatch = text.match(/(?:buy|afford|get|about)\s+a?\s+([^?]+?)(?:\s+for|\s+₹|\s+on|$)/i);
        if (productMatch && productMatch[1]) {
           productName = productMatch[1].trim();
        }
      }

      productName = productName.charAt(0).toUpperCase() + productName.slice(1);

      if (!priceFound) {
         return NextResponse.json({
            id: `decision-${Date.now()}`,
            decisionInputId: body.id ?? `input-${Date.now()}`,
            productName,
            pricePaise: 0,
            confidence: 0,
            missingFields: ["price"],
            createdAt: now,
         });
      }

      // Default down payment is 20%, processing fee is 2%
      const downPaymentPaise = Math.floor(pricePaise * 0.2);
      const principalPaise = pricePaise - downPaymentPaise;
      const emiAmountPaise = Math.floor(principalPaise / tenureMonths);
      const processingFeePaise = Math.floor(pricePaise * 0.02);

      decision = {
        id: `decision-${Date.now()}`,
        decisionInputId: body.id ?? `input-${Date.now()}`,
        productName,
        pricePaise,
        downPaymentPaise,
        emiAmountPaise,
        tenureMonths,
        processingFeePaise,
        confidence: 0.92,
        missingFields: [],
        createdAt: now,
      };
    }

    // ── Run Finance Engine + Constitution Evaluation ──
    const analysis = runFullAnalysis(profile, constitution, decision);

    // ── Persist results ──
    db.setLastDecision(analysis.decision);
    db.setLastComparison(analysis.comparison);
    db.setLastReceipt(analysis.receipt);
    db.setLastPlan(analysis.plan);
    db.setSafeToSpend(analysis.safeToSpend);

    return NextResponse.json(analysis.decision);
  } catch (error) {
    console.error("Decision analysis failed:", error);
    return NextResponse.json(
      { error: "Analysis failed", details: String(error) },
      { status: 500 }
    );
  }
}
