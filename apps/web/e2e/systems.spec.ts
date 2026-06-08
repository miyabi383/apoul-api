import { test, expect } from "@playwright/test";

test.describe("システム一覧", () => {
  test("ページが表示される", async ({ page }) => {
    await page.goto("/systems");
    await expect(page.getByRole("heading", { name: "システム" })).toBeVisible();
  });

  test("contract / billing シードが表示される", async ({ page }) => {
    await page.goto("/systems");
    await expect(page.getByRole("cell", { name: "contract", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "billing", exact: true })).toBeVisible();
  });
});

test.describe("フロー", () => {
  test("フロー画面が表示される", async ({ page }) => {
    await page.goto("/flows");
    await expect(page.getByRole("heading", { name: "モジュール" })).toBeVisible();
  });
});
