import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("app loads with Dashboard heading", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Lobster/i);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("content renders (not a blank white screen)", async ({ page }) => {
    await page.goto("/");
    const body = page.locator("body");
    const text = await body.textContent();
    // Should have meaningful text — either component names or discovery messages
    expect(text?.length).toBeGreaterThan(20);
  });

  test("navigation to /settings works", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  test("no unexpected console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Filter out expected Tauri-not-available errors
        if (
          !text.includes("__TAURI__") &&
          !text.includes("tauri") &&
          !text.includes("invoke")
        ) {
          errors.push(text);
        }
      }
    });

    await page.goto("/");
    // Wait for app to settle
    await page.waitForTimeout(1000);

    expect(errors).toEqual([]);
  });
});
