import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
test("real YOLO video count reaches the digital twin", async ({ page }) => {
  await page.request.post("/api/v1/auth/demo");
  const cameras = await (
    await page.request.get("/api/v1/vision/cameras")
  ).json();
  const videoPath = path.resolve("../.runtime/vision-test.mp4");
  test.skip(
    !cameras[0]?.enabled || !fs.existsSync(videoPath),
    "Real vision requires installed YOLO and the local test video.",
  );
  await page.goto("/ru/vision");
  await page.locator("input[type=file]").setInputFiles(videoPath);
  await expect(
    page.locator(".vision-stats").getByText("Загруженное видео"),
  ).toBeVisible({ timeout: 120000 });
  const state = await (await page.request.get("/api/v1/twin/state")).json();
  expect(state.occupancy).toBeGreaterThan(0);
  expect(state.measurement).toBe("uploaded_video");
  await page.goto("/ru/digital-twin");
  await expect(
    page.locator(".twin-controls .result-big").first(),
  ).toContainText(String(state.occupancy));
});
