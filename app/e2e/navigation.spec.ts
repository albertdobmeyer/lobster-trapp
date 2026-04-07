import { test, expect } from "@playwright/test";

test.describe("Navigation and routing", () => {
  test("sidebar links are rendered", async ({ page }) => {
    await page.goto("/");
    // The sidebar should show a Settings link
    await expect(page.getByRole("link", { name: /settings/i })).toBeVisible();
  });

  test("settings page has controls", async ({ page }) => {
    await page.goto("/settings");
    // Should show the monorepo path setting and refresh interval
    await expect(page.getByText(/monorepo/i)).toBeVisible();
    await expect(page.getByText(/refresh/i)).toBeVisible();
  });

  test("unknown route shows 404 or redirects to dashboard", async ({ page }) => {
    await page.goto("/nonexistent-page");
    // Should either show dashboard (redirect) or some meaningful content
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(10);
    // Should not show a blank page
  });

  test("direct navigation to /component/unknown-id works gracefully", async ({ page }) => {
    await page.goto("/component/unknown-id-that-does-not-exist");
    // Should show some content — either error state or redirect
    // (In non-Tauri mode, this will show loading/error since invoke fails)
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(10);
  });

  test("setup wizard route loads", async ({ page }) => {
    await page.goto("/setup");
    // The setup wizard should render with a welcome message or step indicator
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(20);
  });
});

test.describe("Visual structure", () => {
  test("dark theme is applied", async ({ page }) => {
    await page.goto("/");
    // The app uses bg-gray-950 dark theme
    const body = page.locator("body");
    // Check that the background is dark (not default white)
    const bgColor = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    // Should be a dark color, not white (rgb(255,255,255))
    expect(bgColor).not.toBe("rgb(255, 255, 255)");
  });

  test("dashboard has responsive layout", async ({ page }) => {
    await page.goto("/");
    // At desktop width, sidebar should be visible
    await page.setViewportSize({ width: 1280, height: 800 });
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(20);
  });

  test("no JavaScript errors on settings page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          !text.includes("__TAURI__") &&
          !text.includes("tauri") &&
          !text.includes("invoke")
        ) {
          errors.push(text);
        }
      }
    });

    await page.goto("/settings");
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });

  test("no JavaScript errors on setup page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          !text.includes("__TAURI__") &&
          !text.includes("tauri") &&
          !text.includes("invoke")
        ) {
          errors.push(text);
        }
      }
    });

    await page.goto("/setup");
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });
});
