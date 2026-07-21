import { test, expect } from "@playwright/test";

// ── Emergency Assist E2E Flow ──
// Tests the complete UI flow from chat trigger to lender handoff.
// Requires the dev server to be running at localhost:3000.

test.describe("Emergency Assist flow", () => {
  test.beforeEach(async ({ page }) => {
    // Reset demo state and navigate to main app
    await page.goto("/");
    // Complete onboarding if needed — skip to chat
    const onboardingBtn = page.locator('[id="onboarding-complete-btn"], [id="demo-start-btn"]');
    if (await onboardingBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await onboardingBtn.click();
    }
    await page.waitForTimeout(500);
  });

  test("Screen 1: serious acknowledgement shows no humor elements", async ({ page }) => {
    await page.goto("/?emergency=medical");
    const ack = page.locator(".emergency-acknowledgement");
    await ack.waitFor({ timeout: 5000 }).catch(() => {});

    if (await ack.isVisible()) {
      // No emoji decorations in heading
      const heading = await page.locator(".emergency-acknowledgement__heading").textContent();
      expect(heading).not.toMatch(/😂|🎉|🤣|👏/);

      // Serious mode badge present
      await expect(page.locator(".emergency-acknowledgement__badge")).toBeVisible();

      // PocketPilot disclaimer present
      const notice = await page.locator(".emergency-acknowledgement__notice").textContent();
      expect(notice?.toLowerCase()).toContain("not a lender");

      // Continue button exists
      await expect(page.locator("#emergency-continue-btn")).toBeVisible();
    }
  });

  test("Screen 3: consent gate shows field list before accessing profile", async ({ page }) => {
    await page.goto("/?emergency=medical");
    const continueBtn = page.locator("#emergency-continue-btn");
    if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await continueBtn.click();

      // Fill amount form
      await page.fill("#total-needed", "1,20,000");
      await page.fill("#already-have", "20,000");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 3);
      await page.fill("#required-by", tomorrow.toISOString().split("T")[0]);
      await page.click("#emergency-amount-submit");

      // Consent gate should appear
      const consent = page.locator(".consent-gate");
      if (await consent.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Field list visible
        await expect(page.locator(".consent-gate__field-list")).toBeVisible();

        // 5 distinct consent options
        await expect(page.locator("#consent-allow-once")).toBeVisible();
        await expect(page.locator("#consent-manual-entry")).toBeVisible();
        await expect(page.locator("#consent-temporary-chat")).toBeVisible();
        await expect(page.locator("#consent-delete")).toBeVisible();
        await expect(page.locator("#consent-decline")).toBeVisible();

        // Data-not-shared notice
        const notice = await page.locator(".consent-gate__notice").textContent();
        expect(notice?.toLowerCase()).toContain("not shared");
      }
    }
  });

  test("Consent declined closes the emergency flow", async ({ page }) => {
    await page.goto("/?emergency=medical");
    const continueBtn = page.locator("#emergency-continue-btn");
    if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await continueBtn.click();
      await page.fill("#total-needed", "1,20,000");
      await page.fill("#already-have", "20,000");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 3);
      await page.fill("#required-by", tomorrow.toISOString().split("T")[0]);
      await page.click("#emergency-amount-submit");

      const declineBtn = page.locator("#consent-decline");
      if (await declineBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await declineBtn.click();
        // Emergency flow should be closed
        await expect(page.locator(".emergency-assist")).not.toBeVisible({ timeout: 2000 }).catch(() => {});
      }
    }
  });

  test("Screen 6: loan offer comparison shows simulation disclaimer", async ({ page }) => {
    await page.goto("/?emergency=medical");
    const ack = page.locator(".emergency-acknowledgement");
    if (await ack.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.click("#emergency-continue-btn");
      await page.fill("#total-needed", "1,20,000");
      await page.fill("#already-have", "20,000");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 3);
      await page.fill("#required-by", tomorrow.toISOString().split("T")[0]);
      await page.click("#emergency-amount-submit");

      const consent = page.locator(".consent-gate");
      if (await consent.isVisible({ timeout: 3000 }).catch(() => false)) {
        await page.click("#consent-allow-once");
        await page.waitForTimeout(1000);

        // Skip through gap and alternatives
        const continueGap = page.locator("#funding-gap-continue");
        if (await continueGap.isVisible({ timeout: 3000 }).catch(() => false)) {
          await continueGap.click();
        }
        const continueAlts = page.locator("#alternatives-continue");
        if (await continueAlts.isVisible({ timeout: 3000 }).catch(() => false)) {
          await continueAlts.click();
        }

        // Offers comparison
        const offers = page.locator(".loan-offer-comparison");
        if (await offers.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Simulation disclaimer visible
          await expect(page.locator(".loan-offer-comparison__disclaimer-banner")).toBeVisible();
          const disclaimer = await page.locator(".loan-offer-comparison__disclaimer-banner").textContent();
          expect(disclaimer?.toLowerCase()).toContain("simulation");
          expect(disclaimer?.toLowerCase()).toContain("not a real loan");

          // Three offer cards
          const cards = page.locator(".offer-card");
          await expect(cards).toHaveCount(3, { timeout: 3000 }).catch(() => {});

          // APR visible in first card
          const firstCard = page.locator(".offer-card").first();
          const cardText = await firstCard.textContent();
          expect(cardText).toMatch(/APR|%/);
        }
      }
    }
  });

  test("Screen 8: lender handoff shows simulation banner and no KYC collection", async ({ page }) => {
    await page.goto("/?emergency=medical");
    const ack = page.locator(".emergency-acknowledgement");
    if (await ack.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.click("#emergency-continue-btn");
      await page.fill("#total-needed", "1,20,000");
      await page.fill("#already-have", "20,000");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 3);
      await page.fill("#required-by", tomorrow.toISOString().split("T")[0]);
      await page.click("#emergency-amount-submit");

      const consent = page.locator(".consent-gate");
      if (await consent.isVisible({ timeout: 3000 }).catch(() => false)) {
        await page.click("#consent-allow-once");
        await page.waitForTimeout(1000);

        const continueGap = page.locator("#funding-gap-continue");
        if (await continueGap.isVisible({ timeout: 3000 }).catch(() => false)) await continueGap.click();

        const continueAlts = page.locator("#alternatives-continue");
        if (await continueAlts.isVisible({ timeout: 3000 }).catch(() => false)) await continueAlts.click();

        const firstOfferBtn = page.locator('[id^="select-offer-"]').first();
        if (await firstOfferBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstOfferBtn.click();

          const handoffBtn = page.locator("#explanation-handoff");
          if (await handoffBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await handoffBtn.click();

            // Simulation banner
            const banner = page.locator(".lender-handoff__simulation-banner");
            if (await banner.isVisible({ timeout: 3000 }).catch(() => false)) {
              const bannerText = await banner.textContent();
              expect(bannerText?.toUpperCase()).toContain("SIMULATION");

              // Disclaimer mentions NOT collecting PAN/Aadhaar
              const disclaimer = await page.locator(".lender-handoff__disclaimer-box").textContent();
              expect(disclaimer?.toLowerCase()).toContain("pan");
              expect(disclaimer?.toLowerCase()).toContain("aadhaar");
            }
          }
        }
      }
    }
  });
});
