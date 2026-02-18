import { expect, test, type Page } from "@playwright/test";

const nonBlankCanvasRatio = async (page: Page) => {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return 0;

    const context = canvas.getContext("2d");
    if (!context) return 0;

    const { width, height } = canvas;
    if (width === 0 || height === 0) return 0;

    const { data } = context.getImageData(0, 0, width, height);
    let coloredPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) coloredPixels += 1;
    }

    return coloredPixels / (width * height);
  });
};

const expectCanvasToBeDrawn = async (page: Page) => {
  await expect(page.locator("canvas").first()).toBeVisible();
  const ratio = await nonBlankCanvasRatio(page);
  expect(ratio).toBeGreaterThan(0.002);
};

test.describe("Rosette mechanism editor", () => {
  test("renders and keeps drawing across all controls", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Kinetic Rosette — Multi-Level Editor")).toBeVisible();
    await expect(page.getByText("Editing: Level 1 — Shape")).toBeVisible();
    await expectCanvasToBeDrawn(page);

    // Shape level interactions
    await expect(page.getByText("endpoint-on-axis is enforced per shape constraints")).toBeVisible();
    await expect(page.getByText("handles: 5")).toBeVisible();
    await page.getByRole("button", { name: "Add handle" }).click();
    await expect(page.getByText("handles: 6")).toBeVisible();
    await expectCanvasToBeDrawn(page);

    await page.getByRole("button", { name: "Remove handle" }).click();
    await expect(page.getByText("handles: 5")).toBeVisible();
    await expectCanvasToBeDrawn(page);

    await page.getByRole("button", { name: "Add stroke" }).click();
    await expect(page.getByRole("button", { name: "Stroke 2" })).toBeVisible();
    await page.getByRole("button", { name: "Stroke 1" }).click();
    await page.getByRole("button", { name: "Stroke 2" }).click();
    await expect(page.getByText("handles: 5")).toBeVisible();
    await expectCanvasToBeDrawn(page);

    // Rosette level interactions
    await page.getByRole("button", { name: "L2 Rosette" }).click();
    await expect(page.getByText("Editing: Level 2 — Rosette")).toBeVisible();

    const orderSlider = page.getByLabel("Rosette order");
    await orderSlider.fill("12");
    await expect(page.getByText("Order (n)").locator("..").getByText("12")).toBeVisible();

    const mirrorCheckbox = page.getByRole("checkbox", { name: "Mirror adjacent linkages" });
    await mirrorCheckbox.uncheck();
    await expect(mirrorCheckbox).not.toBeChecked();
    await expect(page.getByText("Mirrored neighbors OFF: all sectors share orientation.")).toBeVisible();

    const thicknessSlider = page.getByLabel("Rosette line thickness");
    await thicknessSlider.fill("5");
    await expect(page.getByText("Line thickness").locator("..").getByText("5.0")).toBeVisible();
    await expectCanvasToBeDrawn(page);

    await page.getByRole("button", { name: "Reset rosette" }).click();
    await expect(page.getByText("Order (n)").locator("..").getByText("8")).toBeVisible();
    await expect(mirrorCheckbox).toBeChecked();
    await expect(page.getByText("Line thickness").locator("..").getByText("1.8")).toBeVisible();
    await expectCanvasToBeDrawn(page);

    // Tiling level interactions
    await page.getByRole("button", { name: /L3 (Tiling|Tessellation)/ }).click();
    await expect(page.getByText(/Editing: Level 3 — (Tiling|Tessellation)/)).toBeVisible();

    await page.getByRole("button", { name: "Square grid" }).click();
    await expect(
      page.getByText("Tiling square layout · rings 1 · spacing 220 · translation symmetry."),
    ).toBeVisible();

    await page.getByLabel("Expansion rings").fill("4");
    await page.getByLabel("Cell spacing").fill("120");
    await page.getByLabel("Inter-cell rotation").fill("20");
    await page.getByRole("button", { name: "Reflection" }).click();
    await page.getByRole("button", { name: "Axis first" }).click();
    await page.getByLabel("Fold progression").fill("0.65");
    await page.getByLabel("Base rotation").fill("35");
    await page.getByLabel("Fixed cell id").fill("1,0");
    await expect(
      page.getByText("Tiling square layout · rings 4 · spacing 120 · reflection symmetry."),
    ).toBeVisible();
    await expectCanvasToBeDrawn(page);

    await page.getByRole("button", { name: "Reset tiling" }).click();
    await expect(
      page.getByText("Tiling hex layout · rings 1 · spacing 220 · translation symmetry."),
    ).toBeVisible();
    await expectCanvasToBeDrawn(page);

    // Global reset returns to defaults and keeps drawing
    await page.getByRole("button", { name: "Reset all" }).click();
    await expect(page.getByText("Editing: Level 1 — Shape")).toBeVisible();
    await expect(page.getByText("handles: 5")).toBeVisible();
    await expect(page.getByText("endpoint-on-axis is enforced per shape constraints")).toBeVisible();
    await expectCanvasToBeDrawn(page);
  });
});
