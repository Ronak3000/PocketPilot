import { expect, test } from "@playwright/test";

async function seedDemo(page: import("@playwright/test").Page) {
  const response = await page.request.post("/api/reset");
  expect(response.ok()).toBe(true);
  await page.addInitScript(() => {
    localStorage.setItem(
      "pocket-pilot-state",
      JSON.stringify({ view: "chat", isOnboarded: true }),
    );
  });
}

function dateAfter(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

test.describe("Emergency Assist", () => {
  test("opens from chat without making an LLM request", async ({ page }) => {
    await seedDemo(page);
    await page.goto("/");
    await page.getByPlaceholder("Ask anything about money...").fill(
      "I need ₹1,20,000 urgently for a hospital emergency",
    );
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(page.getByRole("dialog", { name: "Emergency Assist" })).toBeVisible();
    await expect(page.getByText("Medical Emergency Support")).toBeVisible();
    await expect(page.getByText("Serious Mode Active")).toBeVisible();
    await expect(page.getByText(/API key is not configured/i)).toHaveCount(0);
  });

  test("requires consent and completes the simulated funding flow", async ({ page }) => {
    await seedDemo(page);
    await page.goto("/?emergency=medical");
    await expect(page.getByText("Medical Emergency Support")).toBeVisible();
    await page.locator("#emergency-continue-btn").click();

    await page.locator("#total-needed").fill("1,20,000");
    await page.locator("#already-have").fill("20,000");
    await page.locator("#required-by").fill(dateAfter(5));
    await page.locator("#existing-insurance").check();
    await page.locator("#emergency-amount-submit").click();

    await expect(page.locator(".consent-gate__field-list")).toBeVisible();
    await expect(page.getByText(/not shared with any lender/i)).toBeVisible();
    await page.locator("#consent-allow-once").click();

    await expect(page.getByText("Your Funding Summary")).toBeVisible();
    await expect(page.getByText("₹1,00,000")).toBeVisible();
    await page.locator("#funding-gap-continue").click();
    await expect(page.getByText(/new insurance policy cannot cover/i)).toBeVisible();
    await expect(page.getByText(/Review your existing health/i)).toBeVisible();
    await page.locator("#alternatives-continue").click();

    await expect(page.locator(".loan-offer-comparison__disclaimer-banner")).toContainText("Simulation only");
    await expect(page.locator(".offer-card")).toHaveCount(3);
    await expect(page.locator(".offer-card").first()).toContainText("Safest of shown");
    await page.locator('[id^="select-offer-"]').first().click();

    await expect(page.getByText("Why this offer looks this way")).toBeVisible();
    await expect(page.getByText(/not a credit score or lender decision/i)).toBeVisible();
    await page.locator("#explanation-handoff").click();

    await expect(page.locator(".lender-handoff__simulation-banner")).toContainText("NOT A REAL LOAN APPLICATION");
    await expect(page.locator(".lender-handoff__disclaimer-box")).toContainText("PAN");
    await expect(page.locator(".lender-handoff__disclaimer-box")).toContainText("Aadhaar");
  });

  test("manual entry never substitutes missing values with zero", async ({ page }) => {
    await seedDemo(page);
    await page.goto("/?emergency=medical");
    await page.locator("#emergency-continue-btn").click();
    await page.locator("#total-needed").fill("1,20,000");
    await page.locator("#already-have").fill("20,000");
    await page.locator("#required-by").fill(dateAfter(5));
    await page.locator("#emergency-amount-submit").click();
    await page.locator("#consent-manual-entry").click();
    await page.locator("#manual-context-submit").click();
    await expect(page.locator(".manual-context-form .form-error")).toContainText(
      "Enter every amount explicitly",
    );
    await expect(page.getByText("Your Funding Summary")).toHaveCount(0);
  });
});
