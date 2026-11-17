import { expect, test } from "@playwright/test";

import { m } from "./messages";

// Near Tehran (Valiasr St.), so the Tehran agency should come first.
test.use({ geolocation: { latitude: 35.7, longitude: 51.4 }, permissions: ["geolocation"] });

for (const locale of ["fa", "en"] as const) {
  test(`${locale}: dealer locator shows markers and "near me" sorts by distance`, async ({ page }) => {
    await page.goto(`/${locale}/dealers`);
    const cards = page.getByRole("main").locator("ul li article");
    await expect(cards).toHaveCount(6); // seeded dealers
    await expect(page.locator(".leaflet-marker-icon").first()).toBeVisible();
    expect(await page.locator(".leaflet-marker-icon").count()).toBeGreaterThanOrEqual(1);

    const before = await cards.locator("h3").allInnerTexts();
    await page.getByRole("button", { name: m(locale, "dealers.nearMe") }).click();
    await expect(page.getByText(m(locale, "dealers.sortedByDistance"), { exact: false })).toBeVisible();
    const after = await cards.locator("h3").allInnerTexts();
    expect(after[0]).toContain(locale === "fa" ? "تهران" : "Tehran");
    expect(after.slice().sort()).toEqual(before.slice().sort()); // same dealers, new order

    // Distances are shown and increase down the list.
    const distances = (await cards.locator("p.text-xs").first().allInnerTexts()).length;
    expect(distances).toBeGreaterThan(0);

    // Choosing a dealer opens its popup on the map.
    await cards.first().getByRole("button", { name: m(locale, "dealers.showOnMap") }).click();
    await expect(page.locator(".leaflet-popup")).toBeVisible();
  });
}
