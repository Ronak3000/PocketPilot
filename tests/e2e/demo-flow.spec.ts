import { test, expect } from "@playwright/test";

test.describe("PocketPilot Demo Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should show onboarding on first visit", async ({ page }) => {
    await expect(page.getByText("Welcome to PocketPilot")).toBeVisible();
    await expect(page.getByPlaceholder("Your name")).toBeVisible();
  });

  test("should complete onboarding and reach chat", async ({ page }) => {
    // Step 0: Welcome — name pre-filled as "Aarav"
    await expect(page.getByText("Welcome to PocketPilot")).toBeVisible();
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 1: Income
    await expect(page.getByText("Your money right now")).toBeVisible();
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 2: Commitments
    await expect(page.getByText("Fixed commitments")).toBeVisible();
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 3: Goals
    await expect(page.getByText("Savings & goals")).toBeVisible();
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 4: Floor
    await expect(page.getByText("Your money floor")).toBeVisible();
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 5: Review
    await expect(page.getByText(/Looking good/)).toBeVisible();
    await page.getByRole("button", { name: /start using/i }).click();

    // Should now be in chat
    await expect(page.getByText(/PocketPilot/)).toBeVisible();
    await expect(page.getByPlaceholder("Ask about a purchase")).toBeVisible();
  });

  test("should display greeting message in chat", async ({ page }) => {
    // Complete onboarding quickly
    for (let i = 0; i < 5; i++) {
      await page.getByRole("button", { name: /continue/i }).click();
    }
    await page.getByRole("button", { name: /start using/i }).click();

    // Check greeting
    await expect(page.getByText(/Hey Aarav/)).toBeVisible();
  });

  test("should show demo purchase button", async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.getByRole("button", { name: /continue/i }).click();
    }
    await page.getByRole("button", { name: /start using/i }).click();

    await expect(page.getByText(/Galaxy S25 Ultra/)).toBeVisible();
  });
});
