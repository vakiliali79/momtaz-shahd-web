"use server";

import { db } from "@/lib/db";
import type { AddressDto } from "@/lib/orders/types";
import { getSessionUser } from "@/lib/session";
import {
  addressSchema,
  toAddressErrorKey,
  type AddressErrorKey,
} from "@/lib/validation/address";

const MAX_ADDRESSES = 20;

export type SaveAddressResult =
  | { ok: true; address: AddressDto }
  | { ok: false; error: AddressErrorKey; field?: string };

export async function saveAddress(input: unknown): Promise<SaveAddressResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: toAddressErrorKey(issue?.message),
      field: typeof issue?.path[0] === "string" ? issue.path[0] : undefined,
    };
  }

  try {
    const count = await db.address.count({ where: { userId: user.id } });
    if (count >= MAX_ADDRESSES) return { ok: false, error: "limitReached" };

    const address = await db.address.create({
      data: { ...parsed.data, userId: user.id, country: "IR", isDefault: count === 0 },
      select: {
        id: true,
        title: true,
        province: true,
        city: true,
        fullAddress: true,
        postalCode: true,
        receiverName: true,
        receiverPhone: true,
        lat: true,
        lng: true,
        isDefault: true,
      },
    });
    return { ok: true, address };
  } catch (error) {
    console.error("[address] Save failed:", error);
    return { ok: false, error: "server" };
  }
}
