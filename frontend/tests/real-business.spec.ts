import { test, expect } from "@playwright/test";
test("real workspace: register, sale, expense, receipt and persistent login", async ({
  page,
}) => {
  const email = `real-${Date.now()}@example.kz`;
  await page.goto("/ru/register");
  await page
    .getByLabel("Название бизнеса", { exact: true })
    .fill("Real E2E Shop");
  await page.getByLabel("Город", { exact: true }).fill("Тараз");
  await page.getByLabel("Электронная почта", { exact: true }).fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill("Test-password-2026");
  await page.getByRole("button", { name: "Регистрация", exact: true }).click();
  await expect(page).toHaveURL(/ru\/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Начните со своего бизнеса." }),
  ).toBeVisible();
  await expect(page.locator(".source-bar")).toContainText("Мой бизнес");
  expect(
    await page.request.get("/api/v1/inventory").then((r) => r.json()),
  ).toEqual([]);
  await page.goto("/ru/inventory");
  await page.getByRole("button", { name: "Добавить товар" }).click();
  await page.getByLabel("Название на русском").fill("Real E2E Product");
  await page.getByLabel("Название на казахском").fill("Нақты тауар");
  await page.getByLabel("Артикул", { exact: true }).fill("REAL-E2E");
  await page.getByLabel("Закупочная цена", { exact: true }).fill("600");
  await page.getByLabel("Цена продажи", { exact: true }).fill("1000");
  await page.getByLabel("Остаток", { exact: true }).fill("10");
  await page.getByLabel("Точка заказа", { exact: true }).fill("8");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByText("Изменения сохранены")).toBeVisible();
  await page.goto("/ru/operations");
  await page.getByLabel("Количество", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Сохранить операцию" }).click();
  await expect(
    page.getByText("Продажа сохранена. Остаток товара обновлён."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Записать расход", exact: true })
    .click();
  await page.getByLabel("Категория расхода", { exact: true }).fill("Аренда");
  await page.getByLabel("Сумма, ₸", { exact: true }).fill("500");
  await page.getByRole("button", { name: "Сохранить операцию" }).click();
  await expect(
    page.getByText("Расход сохранён. Чистая прибыль пересчитана."),
  ).toBeVisible();
  let overview = await (
    await page.request.get("/api/v1/dashboard/overview")
  ).json();
  expect(overview.revenue).toBe("3000.00");
  expect(overview.net_profit).toBe("700.00");
  await page.goto("/ru/actions");
  await page
    .getByRole("button", { name: "Товар получен", exact: true })
    .click();
  await expect(
    page.getByText("Поступление сохранено. Остаток обновлён."),
  ).toBeVisible();
  expect(
    (await (await page.request.get("/api/v1/inventory")).json())[0]
      .stock_quantity,
  ).toBe(9);
  await page.request.post("/api/v1/auth/logout");
  await page.goto("/ru/login");
  await page.getByLabel("Электронная почта", { exact: true }).fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill("Test-password-2026");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page).toHaveURL(/ru\/dashboard/);
  overview = await (
    await page.request.get("/api/v1/dashboard/overview")
  ).json();
  expect(overview.revenue).toBe("3000.00");
});
test("real pages fit mobile and retain simulators", async ({ page }) => {
  await page.request.post("/api/v1/auth/demo");
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "dashboard",
    "operations",
    "actions",
    "simulator",
    "ai-assistant",
  ]) {
    await page.goto("/kk/" + route);
    await expect(page.locator("main.content h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/ru/simulator?scenario=pricing");
  await expect(
    page.getByRole("tab", { name: "Сценарий цены" }),
  ).toHaveAttribute("aria-selected", "true");
});
