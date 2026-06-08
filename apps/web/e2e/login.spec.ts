import { test, expect } from "@playwright/test";

const AUTH_DISABLED = process.env.AUTH_DISABLED !== "false";

test.describe("ログイン", () => {
  test("AUTH_DISABLED 時は /login → /jobs へリダイレクト", async ({ page }) => {
    test.skip(!AUTH_DISABLED, "AUTH_DISABLED=true 前提");
    await page.goto("/login");
    await expect(page).toHaveURL(/\/jobs/);
  });

  test("ログインフォームが表示される", async ({ page }) => {
    test.skip(AUTH_DISABLED, "AUTH_DISABLED では /login に到達しない");
    await page.goto("/login");
    await expect(page.getByTestId("login-form")).toBeVisible();
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
  });
});
