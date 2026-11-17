"use server";

import { after } from "next/server";

import { updateTag } from "next/cache";

import { Prisma, type OrderType } from "@/generated/prisma/client";
import { computeCartTotals, effectivePrice, lineUnitPrice, type CartItem } from "@/lib/cart";
import { couponIssue } from "@/lib/coupons";
import { db } from "@/lib/db";
import { notifyAdminsNewOrder, notifyOrderCustomer } from "@/lib/notifications";
import { getCity, getProvince } from "@/lib/locations";
import { localize, toLocalizedText } from "@/lib/localized";
import { nextOrderNumber, orderNumberPrefix } from "@/lib/orders/order-number";
import type { AddressSnapshot } from "@/lib/orders/types";
import { isOnlinePaymentEnabled } from "@/lib/payments";
import { startOnlinePayment } from "@/lib/payments/service";
import { getShippingConfig } from "@/lib/data/settings";
import { getCurrentUser } from "@/lib/session";
import { shippingAvailability } from "@/lib/shipping";
import {
  placeOrderSchema,
  toPlaceOrderErrorKey,
  type PlaceOrderErrorKey,
} from "@/lib/validation/checkout";

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; nextUrl: string }
  | {
      ok: false;
      error: PlaceOrderErrorKey;
      /** Product name for stock errors, coupon error key for coupon errors. */
      detail?: string;
      available?: number;
    };

/** Thrown inside the transaction to roll it back with a customer-facing reason. */
class OrderError extends Error {
  constructor(
    readonly code: PlaceOrderErrorKey,
    readonly detail?: string,
    readonly available?: number,
  ) {
    super(code);
  }
}

const MAX_NUMBER_ATTEMPTS = 3;

/**
 * Places an order from the cart. Everything the customer sent except product
 * ids and quantities is recomputed from the database inside one transaction:
 * prices, stock (decremented atomically), coupon (usage incremented), shipping
 * cost and totals. If the result differs from what the customer saw, nothing
 * is saved and the customer is asked to review the cart.
 */
export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: toPlaceOrderErrorKey(parsed.error.issues[0]?.message) };
  }
  const data = parsed.data;

  // Merge duplicate lines for the same product.
  const quantities = new Map<string, number>();
  for (const item of data.items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  const shippingConfig = await getShippingConfig();
  const onlineEnabled = isOnlinePaymentEnabled();
  if (data.paymentMethod === "ONLINE" && !onlineEnabled) {
    return { ok: false, error: "paymentUnavailable" };
  }

  for (let attempt = 1; ; attempt++) {
    try {
      const order = await db.$transaction(async (tx) => {
        const address = await tx.address.findFirst({
          where: { id: data.addressId, userId: user.id },
        });
        if (!address) throw new OrderError("addressRequired");
        const province = getProvince(address.province);
        const city = getCity(address.province, address.city);
        if (!province || !city) throw new OrderError("addressRequired");

        // Products, re-read from the database.
        const products = await tx.product.findMany({
          where: { id: { in: [...quantities.keys()] } },
        });
        const items: CartItem[] = [];
        for (const [productId, quantity] of quantities) {
          const product = products.find((entry) => entry.id === productId);
          if (!product || !product.isActive) {
            throw new OrderError("productUnavailable", product ? localize(product.name, data.locale) : undefined);
          }
          if (product.stock < quantity) {
            throw new OrderError("outOfStock", localize(product.name, data.locale), product.stock);
          }
          items.push({
            productId: product.id,
            slug: product.slug,
            name: toLocalizedText(product.name),
            image: "",
            unitPrice: effectivePrice(product.price, product.discountPrice),
            wholesalePrice: product.wholesalePrice,
            minWholesaleQty: product.minWholesaleQty,
            weightGrams: product.weightGrams,
            quantity,
            maxStock: product.stock,
          });
        }

        // Stock: decrement only if still available (safe against concurrent orders).
        for (const item of items) {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count !== 1) {
            throw new OrderError("outOfStock", item.name[data.locale]);
          }
        }

        // Coupon: validate and count the use (again, safe against races).
        let coupon = null;
        if (data.couponCode) {
          const found = await tx.coupon.findUnique({ where: { code: data.couponCode } });
          const preliminary = computeCartTotals(items, null);
          const issue = couponIssue(found, preliminary.subtotal);
          if (issue || !found) throw new OrderError("couponInvalid", issue ?? "notFound");
          // Count the use only while uses remain (atomic against concurrent orders).
          const used = await tx.coupon.updateMany({
            where: {
              id: found.id,
              ...(found.maxUses !== null ? { usedCount: { lt: found.maxUses } } : {}),
            },
            data: { usedCount: { increment: 1 } },
          });
          if (used.count !== 1) throw new OrderError("couponInvalid", "usedUp");
          coupon = { code: found.code, type: found.type, value: found.value, minOrder: found.minOrder };
        }

        // Shipping and totals, with the same rules the browser uses.
        const destination = { province: address.province, city: address.city };
        if (!shippingAvailability(shippingConfig, data.shippingMethod, destination).available) {
          throw new OrderError("shippingUnavailable");
        }
        const totals = computeCartTotals(items, coupon, {
          config: shippingConfig,
          method: data.shippingMethod,
          destination,
        });
        if (totals.shipping === null) throw new OrderError("shippingUnavailable");
        if (totals.total !== data.expectedTotal) throw new OrderError("totalChanged");

        const type: OrderType =
          user.role === "WHOLESALE" || totals.wholesaleSavings > 0 ? "WHOLESALE" : "RETAIL";
        if (data.paymentMethod === "BANK_TRANSFER" && type !== "WHOLESALE") {
          throw new OrderError("paymentUnavailable");
        }

        const prefix = orderNumberPrefix();
        const latest = await tx.order.findFirst({
          where: { orderNumber: { startsWith: prefix } },
          orderBy: { orderNumber: "desc" },
          select: { orderNumber: true },
        });

        const snapshot: AddressSnapshot = {
          title: address.title,
          receiverName: address.receiverName,
          receiverPhone: address.receiverPhone,
          province: { id: province.id, name: province.name },
          city: { id: city.id, name: city.name },
          fullAddress: address.fullAddress,
          postalCode: address.postalCode,
          lat: address.lat,
          lng: address.lng,
        };

        // Cash on delivery needs no payment step: the order goes straight to
        // preparation. Online and bank-transfer orders wait for their payment.
        const isCod = data.paymentMethod === "COD";

        return tx.order.create({
          data: {
            orderNumber: nextOrderNumber(prefix, latest?.orderNumber ?? null),
            userId: user.id,
            type,
            status: isCod ? "PROCESSING" : "PENDING",
            subtotal: BigInt(totals.subtotal),
            shippingCost: BigInt(totals.shipping),
            discount: BigInt(totals.discount),
            total: BigInt(totals.total),
            currency: "IRT",
            addressSnapshot: snapshot,
            shippingMethod: data.shippingMethod,
            paymentMethod: data.paymentMethod,
            note: data.note || null,
            couponCode: coupon?.code ?? null,
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                productName: item.name[data.locale],
                unitPrice: lineUnitPrice(item, item.quantity),
                quantity: item.quantity,
              })),
            },
            statusHistory: {
              create: isCod
                ? { status: "PROCESSING", note: "order_placed_cod" }
                : { status: "PENDING", note: "order_placed" },
            },
          },
          select: { id: true, orderNumber: true },
        });
      });

      // Stock changed: refresh the cached catalogue for the next visitor.
      updateTag("catalog");
      // Text the customer and alert the team once the response is on its way.
      after(() => Promise.all([notifyOrderCustomer(order.id, { type: "placed" }), notifyAdminsNewOrder(order.id)]));

      const base = `/${data.locale}/checkout`;
      if (data.paymentMethod !== "ONLINE") {
        return { ok: true, orderNumber: order.orderNumber, nextUrl: `${base}/success/${order.orderNumber}` };
      }
      // Online: go straight to the gateway. If it cannot be reached, the order
      // is kept and the payment page offers to try again.
      const payment = await startOnlinePayment(order.id, data.locale);
      return {
        ok: true,
        orderNumber: order.orderNumber,
        nextUrl: payment.ok ? payment.redirectUrl : `${base}/pay/${order.orderNumber}?error=request`,
      };
    } catch (error) {
      if (error instanceof OrderError) {
        return { ok: false, error: error.code, detail: error.detail, available: error.available };
      }
      // Two orders took the same number at once: try again with the next one.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        attempt < MAX_NUMBER_ATTEMPTS
      ) {
        continue;
      }
      console.error("[checkout] placeOrder failed:", error);
      return { ok: false, error: "server" };
    }
  }
}
