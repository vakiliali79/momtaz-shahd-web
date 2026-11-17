import { expect, test, type Page } from "@playwright/test";

import { escape, m, prefix, type Locale } from "./messages";

const ADMIN = { phone: "09120000000", password: "Admin@1234" }; // seeded (prisma/seed.ts)
const PASSWORD = "E2e-Pass-2026";

async function signIn(page: Page, locale: Locale, phone: string, password: string) {
  await page.goto(`/${locale}/login`);
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="password"]').press("Enter");
  await page.waitForURL((url) => !url.pathname.endsWith("/login"));
}

async function addToCart(page: Page, locale: Locale, slug: string) {
  await page.goto(`/${locale}/products/${slug}`);
  await page.getByRole("main").getByRole("button", { name: new RegExp(`^${escape(m(locale, "cart.add"))}`) }).first().click();
  await expect(page.getByText(m(locale, "cart.addedShort")).or(page.locator("[data-sonner-toast]")).first()).toBeVisible();
}

for (const locale of ["fa", "en"] as const) {
  test(`${locale}: register, buy two products online, see the order, admin updates it`, async ({ page, browser }) => {
    const phone = `0912${String(Date.now()).slice(-7)}`;

    await test.step("register a new customer", async () => {
      await page.goto(`/${locale}/register`);
      await page.locator('input[name="name"]').fill(locale === "fa" ? "مشتری آزمایشی" : "Test Customer");
      await page.locator('input[name="phone"]').fill(phone);
      await page.locator('input[name="password"]').fill(PASSWORD);
      await page.locator('input[name="confirmPassword"]').fill(PASSWORD);
      await page.getByRole("button", { name: m(locale, "auth.createAccount") }).click();
      await page.waitForURL((url) => !url.pathname.endsWith("/register"));
    });

    await test.step("add two different products to the cart", async () => {
      await addToCart(page, locale, "walnut-koloocheh-450g");
      await addToCart(page, locale, "date-kolompeh-500g");
      await page.goto(`/${locale}/cart`);
      // Both products are listed (a table on desktop, cards on phones).
      for (const slug of ["walnut-koloocheh-450g", "date-kolompeh-500g"]) {
        await expect(page.getByRole("main").locator(`a[href$="/products/${slug}"]`).first()).toBeVisible();
      }
    });

    await test.step("checkout: new address, Express Post, online payment", async () => {
      await page.goto(`/${locale}/checkout`);
      const tehran = locale === "fa" ? "تهران" : "Tehran";
      await page.getByLabel(m(locale, "address.fields.title")).fill(locale === "fa" ? "خانه" : "Home");
      await page.getByRole("combobox", { name: m(locale, "address.fields.province") }).click();
      await page.getByRole("option", { name: tehran, exact: true }).click();
      await page.getByRole("combobox", { name: m(locale, "address.fields.city") }).click();
      await page.getByRole("option", { name: tehran, exact: true }).click();
      await page.getByLabel(m(locale, "address.fields.fullAddress")).fill(locale === "fa" ? "خیابان ولیعصر، پلاک ۱۰" : "10 Valiasr St.");
      await page.getByLabel(m(locale, "address.fields.postalCode")).fill("1234567890");
      await page.getByLabel(m(locale, "address.fields.receiverName")).fill(locale === "fa" ? "مشتری آزمایشی" : "Test Customer");
      await page.getByLabel(m(locale, "address.fields.receiverPhone")).fill(phone);
      await page.getByRole("button", { name: m(locale, "address.save") }).click();

      await page.getByRole("button", { name: m(locale, "checkout.continueToShipping") }).click();
      await page.getByText(m(locale, "checkout.shipping.methods.post.name")).first().click();
      await page.getByRole("button", { name: m(locale, "checkout.continueToPayment") }).click();
      await page.getByText(m(locale, "checkout.payment.methods.ONLINE.name")).first().click();
      await page.getByRole("button", { name: new RegExp(`^${escape(prefix(locale, "checkout.placeAndPay"))}`) }).click();
    });

    let orderNumber = "";
    await test.step("pay on the mock gateway and land on the success page", async () => {
      await page.waitForURL(/\/payment\/mock/);
      await page.getByRole("button", { name: new RegExp(`^${escape(prefix(locale, "payment.mock.pay"))}`) }).click();
      await page.waitForURL(/\/checkout\/success\/MS-\d{8}-\d+/, { timeout: 30_000 });
      orderNumber = page.url().match(/MS-\d{8}-\d+/)?.[0] ?? "";
      expect(orderNumber).not.toBe("");
    });

    await test.step("the order is in the customer's panel as paid", async () => {
      await page.goto(`/${locale}/account/orders`);
      const row = page.getByRole("main").locator(":is(tr, li, article)", { hasText: orderNumber }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(m(locale, "order.status.PAID"));
    });

    await test.step("an admin moves it to 'being prepared'; the customer sees the change", async () => {
      const adminContext = await browser.newContext();
      const admin = await adminContext.newPage();
      await signIn(admin, locale, ADMIN.phone, ADMIN.password);
      await admin.goto(`/${locale}/admin/orders/${orderNumber}`);
      await admin.locator("#order-status").click();
      await admin.getByRole("option", { name: m(locale, "order.status.PROCESSING") }).click();
      await admin.getByRole("button", { name: m(locale, "admin.orders.detail.applyStatus") }).click();
      await expect(admin.locator("[data-sonner-toast]").first()).toBeVisible();
      await adminContext.close();

      await page.goto(`/${locale}/account/orders/${orderNumber}`);
      await expect(page.getByRole("main")).toContainText(m(locale, "order.status.PROCESSING"));
    });
  });
}
