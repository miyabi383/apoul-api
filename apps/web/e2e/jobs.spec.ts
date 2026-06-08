import { test, expect } from "@playwright/test";

test.describe("ジョブ一覧", () => {
  test("ページが表示される", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: "ジョブ一覧" })).toBeVisible();
  });

  test("ステータスフィルタが操作できる", async ({ page }) => {
    await page.goto("/jobs");
    const successFilter = page.getByRole("link", { name: "成功" });
    if (await successFilter.isVisible()) {
      await successFilter.click();
      await expect(page).toHaveURL(/status=success/);
    }
  });
});
