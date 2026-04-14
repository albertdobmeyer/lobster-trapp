import { test, expect } from "@playwright/test";

test.describe("Navigation and routing", () => {
  test("sidebar links are rendered or wizard is shown", async ({ page }) => {
    await page.goto("/");
    // On first run, the app shows the setup wizard (no sidebar); otherwise sidebar with Settings link
    const settingsLink = page.getByRole("link", { name: /settings/i });
    const setup = page.getByText(/welcome|setup|prerequisites/i);
    await expect(settingsLink.or(setup)).toBeVisible();
  });

  test("settings page has controls", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    await expect(page.getByText(/monorepo path/i).first()).toBeVisible();
    await expect(page.getByRole("slider")).toBeVisible();
    await expect(page.getByRole("button", { name: "Re-run Setup Wizard" })).toBeVisible();
  });

  test("unknown route shows 404 page with navigation", async ({ page }) => {
    await page.goto("/nonexistent-page");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.getByText("doesn't exist or has been moved")).toBeVisible();
    // Sidebar is still visible for navigation
    await expect(page.getByRole("link", { name: /settings/i })).toBeVisible();
    // "Back to Dashboard" link exists
    const backLink = page.getByRole("link", { name: "Back to Dashboard" });
    await expect(backLink).toBeVisible();
  });

  test("404 'Back to Dashboard' link navigates home", async ({ page }) => {
    await page.goto("/nonexistent-page");
    await page.getByRole("link", { name: "Back to Dashboard" }).click();
    await expect(page).toHaveURL(/\/(?:setup)?$/);
  });

  test("direct navigation to /component/unknown-id shows not-found state", async ({ page }) => {
    await page.goto("/component/unknown-id-that-does-not-exist");
    // Should show "Component not found" (not infinite skeleton)
    await expect(page.getByText("Component not found")).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to Dashboard" })).toBeVisible();
  });

  test("setup wizard route loads with welcome message", async ({ page }) => {
    await page.goto("/setup");
    await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /get started/i })).toBeVisible();
  });

  test("dashboard empty state has setup wizard link", async ({ page }) => {
    // Navigate to dashboard (may redirect to /setup if wizard not completed)
    await page.goto("/");
    const dashboard = page.getByRole("heading", { name: "Dashboard" });
    const wizardLink = page.getByRole("link", { name: "Run Setup Wizard" });
    const setup = page.getByText(/welcome/i);
    // Either shows dashboard with wizard link, or redirects to setup
    await expect(dashboard.or(setup)).toBeVisible();
    // If on dashboard, the empty state should have a wizard link
    if (await dashboard.isVisible()) {
      await expect(page.getByText("No components detected yet")).toBeVisible();
      await expect(wizardLink).toBeVisible();
    }
  });
});

test.describe("Visual structure", () => {
  test("dark theme is applied", async ({ page }) => {
    await page.goto("/");
    const body = page.locator("body");
    const bgColor = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    // Should be a dark color, not white (rgb(255,255,255))
    expect(bgColor).not.toBe("rgb(255, 255, 255)");
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
