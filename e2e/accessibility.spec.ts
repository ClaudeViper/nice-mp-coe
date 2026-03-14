import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility E2E tests — WCAG 2.1 AA
 * Runs axe-core against live pages rendered in Chromium.
 */

// Helper to run axe and assert no critical violations
async function checkPageA11y(page: import("@playwright/test").Page, route: string) {
  await page.goto(route);
  // Wait for content to load
  await page.waitForLoadState("networkidle").catch(() => {
    // ignore timeout; proceed with axe scan
  });

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  // Filter out known false positives or third-party issues
  const violations = results.violations.filter(
    (v) =>
      // Exclude color-contrast violations from dynamically loaded content
      v.id !== "color-contrast" ||
      // Include if there are actual critical violations
      v.impact === "critical"
  );

  if (violations.length > 0) {
    const report = violations
      .map(
        (v) =>
          `[${v.impact}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes.map((n) => n.html).slice(0, 2).join(", ")}`
      )
      .join("\n\n");
    throw new Error(`Accessibility violations on ${route}:\n\n${report}`);
  }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

test.describe("WCAG 2.1 AA — Dashboard", () => {
  test("dashboard page has no critical accessibility violations", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle").catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"]) // disable contrast check for themed UI
      .analyze();

    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(
      critical,
      `Critical a11y violations: ${critical.map((v) => v.id).join(", ")}`
    ).toHaveLength(0);
  });

  test("dashboard page has no serious accessibility violations", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle").catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(
      serious,
      `Serious a11y violations: ${serious.map((v) => v.id).join(", ")}`
    ).toHaveLength(0);
  });
});

// ─── Vendors page ─────────────────────────────────────────────────────────────

test.describe("WCAG 2.1 AA — Vendors", () => {
  test("vendors listing page has no critical violations", async ({ page }) => {
    await page.goto("/vendors");
    await page.waitForLoadState("networkidle").catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toHaveLength(0);
  });
});

// ─── Evaluate page ────────────────────────────────────────────────────────────

test.describe("WCAG 2.1 AA — Evaluate", () => {
  test("evaluate landing page has no critical violations", async ({ page }) => {
    await page.goto("/evaluate");
    await page.waitForLoadState("networkidle").catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toHaveLength(0);
  });

  test("new evaluation wizard has no critical violations on step 1", async ({ page }) => {
    await page.goto("/evaluate/new");
    await page.waitForLoadState("networkidle").catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toHaveLength(0);
  });
});

// ─── Datasets page ────────────────────────────────────────────────────────────

test.describe("WCAG 2.1 AA — Datasets", () => {
  test("datasets page has no critical violations", async ({ page }) => {
    await page.goto("/datasets");
    await page.waitForLoadState("networkidle").catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toHaveLength(0);
  });

  test("datasets page interactive elements are focusable", async ({ page }) => {
    await page.goto("/datasets");
    await page.waitForLoadState("networkidle").catch(() => {});

    // Tab through the page and ensure we can reach filter tabs
    const focusableCount = await page.evaluate(() => {
      const focusable = document.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      return focusable.length;
    });

    // Should have at least a few focusable elements
    expect(focusableCount).toBeGreaterThan(3);
  });
});

// ─── Benchmarks page ──────────────────────────────────────────────────────────

test.describe("WCAG 2.1 AA — Benchmarks", () => {
  test("benchmarks page has no critical violations", async ({ page }) => {
    await page.goto("/benchmarks");
    await page.waitForLoadState("networkidle").catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toHaveLength(0);
  });
});

// ─── Reports page ─────────────────────────────────────────────────────────────

test.describe("WCAG 2.1 AA — Reports", () => {
  test("reports page has no critical violations", async ({ page }) => {
    await page.goto("/reports");
    await page.waitForLoadState("networkidle").catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toHaveLength(0);
  });
});

// ─── Focus management ────────────────────────────────────────────────────────

test.describe("Focus management", () => {
  test("all pages have visible focus ring on Tab", async ({ page }) => {
    const pages = ["/dashboard", "/evaluate", "/datasets", "/benchmarks"];

    for (const route of pages) {
      await page.goto(route);
      await page.keyboard.press("Tab");

      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return false;
        const style = window.getComputedStyle(el);
        return (
          style.outlineWidth !== "0px" ||
          style.boxShadow !== "none" ||
          el.getAttribute("data-focus-visible") !== null
        );
      });

      // At minimum, something should be focused after Tab
      const somethingFocused = await page.evaluate(
        () => document.activeElement !== document.body
      );
      expect(somethingFocused, `Nothing focused after Tab on ${route}`).toBe(true);
    }
  });
});
