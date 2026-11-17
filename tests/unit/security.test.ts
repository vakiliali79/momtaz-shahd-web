/**
 * Security regression tests: admin-only actions refuse everyone else, users
 * can't reach other users' orders or addresses (IDOR), uploads are validated,
 * and the mock payment endpoint can't be used as an open redirect.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

import type { CurrentUser } from "@/lib/session";

const session = vi.hoisted(() => ({ user: null as CurrentUser | null }));
vi.mock("@/lib/session", () => ({
  getCurrentUser: async () => session.user,
  getSessionUser: async () => (session.user ? { id: session.user.id, name: session.user.name ?? "" } : null),
  getAdminUser: async () => (session.user?.role === "ADMIN" ? session.user : null),
}));
vi.mock("next/cache", () => ({ cacheLife: () => undefined, cacheTag: () => undefined, updateTag: () => undefined, revalidateTag: () => undefined }));
vi.mock("next/server", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/server")>()), after: () => undefined }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (key: string) => key, getMessages: async () => ({}) }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7" }) }));

const { db } = await import("@/lib/db");

let alice: CurrentUser;
let bob: CurrentUser;
let admin: CurrentUser;
let aliceOrder = "";
let aliceAddressId = "";

beforeAll(async () => {
  const make = async (phone: string, role: "CUSTOMER" | "ADMIN") => {
    const user = await db.user.create({ data: { phone, name: phone, role } });
    return { id: user.id, name: user.name, phone, email: null, role } satisfies CurrentUser;
  };
  alice = await make("09120000201", "CUSTOMER");
  bob = await make("09120000202", "CUSTOMER");
  admin = await make("09120000203", "ADMIN");
  const address = await db.address.create({
    data: { userId: alice.id, title: "Home", province: "tehran", city: "tehran", fullAddress: "x", postalCode: "1234567890", receiverName: "A", receiverPhone: "09120000201" },
  });
  aliceAddressId = address.id;
  aliceOrder = "MS-20260101-9001";
  await db.order.create({
    data: {
      orderNumber: aliceOrder, userId: alice.id, status: "PENDING", type: "RETAIL", paymentMethod: "COD",
      subtotal: BigInt(100_000), shippingCost: BigInt(0), discount: BigInt(0), total: BigInt(100_000), currency: "IRT", addressSnapshot: {},
    },
  });
});

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(() => {
  session.user = null;
});

describe("admin-only Server Actions refuse anonymous visitors and customers", async () => {
  const actions = {
    ...(await import("@/actions/admin/products")),
    ...(await import("@/actions/admin/categories")),
    ...(await import("@/actions/admin/coupons")),
    ...(await import("@/actions/admin/dealers")),
    ...(await import("@/actions/admin/orders")),
    ...(await import("@/actions/admin/reviews")),
    ...(await import("@/actions/admin/settings")),
    ...(await import("@/actions/admin/translations")),
    ...(await import("@/actions/admin/wholesale")),
    ...(await import("@/actions/admin/customers")),
  } as Record<string, (...args: unknown[]) => Promise<unknown>>;
  const names = Object.keys(actions).filter((name) => typeof actions[name] === "function");

  test("there are admin actions to check", () => {
    expect(names.length).toBeGreaterThanOrEqual(20);
  });

  for (const who of ["anonymous", "customer"] as const) {
    test(`${who}: every admin action answers "forbidden"`, async () => {
      session.user = who === "customer" ? alice : null;
      for (const name of names) {
        const result = await actions[name]!("x", "y", "z");
        expect(result, name).toMatchObject({ ok: false, error: "forbidden" });
      }
    });
  }
});

describe("no access to other customers' data (IDOR)", () => {
  test("orders are only visible to their owner", async () => {
    const { getOrderForUser } = await import("@/lib/orders/queries");
    expect(await getOrderForUser(aliceOrder, alice.id)).toMatchObject({ orderNumber: aliceOrder });
    expect(await getOrderForUser(aliceOrder, bob.id)).toBeNull();
  });

  test("another customer can't cancel the order", async () => {
    const { cancelMyOrder } = await import("@/actions/account-orders");
    session.user = bob;
    expect(await cancelMyOrder(aliceOrder)).toMatchObject({ ok: false });
    expect((await db.order.findUniqueOrThrow({ where: { orderNumber: aliceOrder } })).status).toBe("PENDING");
  });

  test("another customer can't change or delete the address", async () => {
    const { deleteAddress, setDefaultAddress, updateAddress } = await import("@/actions/address");
    session.user = bob;
    const valid = { title: "Hacked", province: "tehran", city: "tehran", fullAddress: "Somewhere 1", postalCode: "1234567890", receiverName: "Bob", receiverPhone: "09120000202", lat: null, lng: null };
    expect(await updateAddress(aliceAddressId, valid)).toMatchObject({ ok: false });
    expect(await deleteAddress(aliceAddressId)).toMatchObject({ ok: false });
    expect(await setDefaultAddress(aliceAddressId)).toMatchObject({ ok: false });
    expect(await db.address.findUnique({ where: { id: aliceAddressId } })).toMatchObject({ title: "Home" });
  });

  test("the receipt download needs the owner or an admin", async () => {
    const { GET } = await import("@/app/api/orders/[orderNumber]/receipt/route");
    const call = () => GET(new Request("http://localhost/x"), { params: Promise.resolve({ orderNumber: aliceOrder }) });
    expect((await call()).status).toBe(401);
    session.user = bob;
    expect((await call()).status).toBe(404); // not "forbidden": don't reveal it exists
  });
});

describe("admin image uploads", async () => {
  const { POST } = await import("@/app/api/admin/uploads/route");
  const { NextRequest } = await import("next/server");
  const sharp = (await import("sharp")).default;
  const upload = (file: Blob, name = "photo.png", origin = "http://localhost") => {
    const form = new FormData();
    form.set("folder", "products");
    form.set("file", new File([file], name));
    return POST(new NextRequest("http://localhost/api/admin/uploads", { method: "POST", body: form, headers: { origin } }));
  };
  const png = await sharp({ create: { width: 40, height: 40, channels: 3, background: "#c8102e" } }).png().toBuffer();

  test("only admins can upload, from this site", async () => {
    session.user = alice;
    expect((await upload(new Blob([png]))).status).toBe(403);
    session.user = admin;
    expect((await upload(new Blob([png]), "photo.png", "https://evil.example")).status).toBe(403);
  });

  test("rejects non-images (checked from the bytes, not the name) and oversized files", async () => {
    session.user = admin;
    const html = new Blob(["<script>alert(1)</script>"]);
    expect((await upload(html, "photo.png")).status).toBe(400);
    const pdf = new Blob(["%PDF-1.7 fake"]);
    expect((await upload(pdf, "photo.png")).status).toBe(400);
    const big = new Blob([png, new Uint8Array(5 * 1024 * 1024)]);
    expect((await upload(big)).status).toBe(400);
  });

  test("stores a real image re-encoded as WebP under a random name", async () => {
    session.user = admin;
    const response = await upload(new Blob([png]), "../../etc/passwd.png");
    expect(response.status).toBe(200);
    const { url } = (await response.json()) as { url: string };
    expect(url).toMatch(/^\/uploads\/products\/[a-z0-9]+-[0-9a-f]{12}\.webp$/);
    const { rm } = await import("node:fs/promises");
    await rm(`public${url}`, { force: true });
  });
});

describe("mock payment endpoint", () => {
  test("never redirects to another site", async () => {
    process.env.PAYMENT_GATEWAY = "mock";
    const { POST } = await import("@/app/api/payment/mock/route");
    const { NextRequest } = await import("next/server");
    const form = new FormData();
    form.set("authority", `MOCK${"A".repeat(24)}`);
    form.set("decision", "pay");
    form.set("callback", "https://evil.example/api/payment/callback");
    const response = await POST(new NextRequest("http://localhost:3000/api/payment/mock", { method: "POST", body: form }));
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });
});
