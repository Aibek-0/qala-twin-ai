import { test, expect } from "@playwright/test";
test("landing, demo, bilingual navigation and scenarios", async ({ page }) => {
  await page.goto("/kk");
  await expect(
    page.getByRole("heading", { name: "Бизнесіңіз. Бір қадам алда." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Демоны зерттеу" }).first().click();
  await expect(page).toHaveURL(/kk\/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Бизнесіңіз. Толық көріністе." }),
  ).toBeVisible();
  await expect(
    page.getByText("Демонстрациялық деректер · 2026 ж. 17 қыркүйек — 16 қазан"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Интерфейс тілі" }).click();
  await expect(page).toHaveURL(/ru\/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Ваш бизнес. В полной картине." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Симулятор", exact: true }).click();
  await page.getByRole("button", { name: "Запустить симуляцию" }).click();
  await expect(page.getByText("Снижение ожидания")).toBeVisible();
  await expect(page.getByText("24 000 ₸")).toBeVisible();
  await page
    .getByRole("link", { name: "AI Советник", exact: false })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Какой товар приносит больше прибыли?" })
    .click();
  await expect(page.getByText(/Наибольшая валовая прибыль/)).toBeVisible();
});
test("CSV preview and import changes analytics", async ({ page }) => {
  await page.request.post("/api/v1/auth/demo");
  await page.goto("/ru/analytics");
  await expect(
    page.getByRole("heading", { name: "Аналитика продаж", exact: true }),
  ).toBeVisible();
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "e2e.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "date,product_name,quantity,unit_price,unit_cost\n2026-10-16,Imported E2E,2,500,300\n",
      ),
    });
  await expect(page.getByText("Корректных строк: 1")).toBeVisible();
  await page.getByRole("button", { name: "Импортировать строки" }).click();
  await expect(page.getByText("Данные импортированы")).toBeVisible();
});
test("inventory changes persist and mobile layout fits", async ({ page }) => {
  await page.request.post("/api/v1/auth/demo");
  await page.goto("/ru/inventory");
  await page.getByRole("button", { name: "Добавить товар" }).click();
  await page.getByLabel("Название на русском").fill("Test Product");
  await page.getByLabel("Название на казахском").fill("Сынақ тауары");
  await page.getByLabel("Артикул", { exact: true }).fill("TEST-E2E");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await page.getByPlaceholder("Поиск по платформе…").fill("TEST-E2E");
  await expect(page.getByText("Test Product", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/kk/dashboard");
  await expect(
    page.getByRole("heading", { name: "Бизнесіңіз. Толық көріністе." }),
  ).toBeVisible();
  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fits).toBeTruthy();
});
test("twin saves its layout and reports download", async ({ page }) => {
  await page.request.post("/api/v1/auth/demo");
  await page.goto("/ru/digital-twin");
  await page.getByLabel("Количество касс", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Изменения сохранены" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Количество касс", { exact: true })).toHaveValue(
    "3",
  );
  await page.goto("/ru/reports");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Скачать PDF" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toContain(".pdf");
});
