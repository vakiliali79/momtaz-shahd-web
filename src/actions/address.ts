"use server";

import { addressSelect } from "@/lib/account/queries";
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

export type AddressActionResult = { ok: true } | { ok: false; error: AddressErrorKey };

function parseAddress(input: unknown) {
  const parsed = addressSchema.safeParse(input);
  if (parsed.success) return { ok: true as const, data: parsed.data };
  const issue = parsed.error.issues[0];
  return {
    ok: false as const,
    result: {
      ok: false as const,
      error: toAddressErrorKey(issue?.message),
      field: typeof issue?.path[0] === "string" ? issue.path[0] : undefined,
    },
  };
}

function isId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 64;
}

export async function saveAddress(input: unknown): Promise<SaveAddressResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "unauthorized" };
  const parsed = parseAddress(input);
  if (!parsed.ok) return parsed.result;

  try {
    const count = await db.address.count({ where: { userId: user.id } });
    if (count >= MAX_ADDRESSES) return { ok: false, error: "limitReached" };

    const address = await db.address.create({
      data: { ...parsed.data, userId: user.id, country: "IR", isDefault: count === 0 },
      select: addressSelect,
    });
    return { ok: true, address };
  } catch (error) {
    console.error("[address] Save failed:", error);
    return { ok: false, error: "server" };
  }
}

export async function updateAddress(id: unknown, input: unknown): Promise<SaveAddressResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "unauthorized" };
  if (!isId(id)) return { ok: false, error: "server" };
  const parsed = parseAddress(input);
  if (!parsed.ok) return parsed.result;

  try {
    // updateMany scopes the change to the user's own address.
    const updated = await db.address.updateMany({
      where: { id, userId: user.id },
      data: parsed.data,
    });
    if (updated.count !== 1) return { ok: false, error: "server" };
    const address = await db.address.findUniqueOrThrow({ where: { id }, select: addressSelect });
    return { ok: true, address };
  } catch (error) {
    console.error("[address] Update failed:", error);
    return { ok: false, error: "server" };
  }
}

export async function deleteAddress(id: unknown): Promise<AddressActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "unauthorized" };
  if (!isId(id)) return { ok: false, error: "server" };

  try {
    await db.$transaction(async (tx) => {
      const address = await tx.address.findFirst({ where: { id, userId: user.id } });
      if (!address) return;
      await tx.address.delete({ where: { id } });
      // Past orders keep their own copy of the address, so deleting is safe.
      // If the default went away, the oldest remaining address takes over.
      if (address.isDefault) {
        const next = await tx.address.findFirst({ where: { userId: user.id }, orderBy: { id: "asc" } });
        if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    });
    return { ok: true };
  } catch (error) {
    console.error("[address] Delete failed:", error);
    return { ok: false, error: "server" };
  }
}

export async function setDefaultAddress(id: unknown): Promise<AddressActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "unauthorized" };
  if (!isId(id)) return { ok: false, error: "server" };

  try {
    const done = await db.$transaction(async (tx) => {
      const address = await tx.address.findFirst({ where: { id, userId: user.id }, select: { id: true } });
      if (!address) return false;
      await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      await tx.address.update({ where: { id }, data: { isDefault: true } });
      return true;
    });
    return done ? { ok: true } : { ok: false, error: "server" };
  } catch (error) {
    console.error("[address] Set default failed:", error);
    return { ok: false, error: "server" };
  }
}
