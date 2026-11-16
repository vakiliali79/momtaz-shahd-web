"use server";

import { z } from "zod";

import { ORDER_NUMBER_PATTERN } from "@/lib/orders/order-number-pattern";
import {
  confirmBankTransfer,
  rejectTransferReceipt,
  type BankTransferResult,
} from "@/lib/orders/bank-transfer";
import { getCurrentUser } from "@/lib/session";

type AdminResult = BankTransferResult | { ok: false; error: "forbidden" | "invalid" };

const schema = z.string().regex(ORDER_NUMBER_PATTERN);

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}

/** Admin: the bank transfer for this order has arrived. */
export async function confirmBankTransferAction(orderNumber: unknown): Promise<AdminResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "forbidden" };
  const parsed = schema.safeParse(orderNumber);
  if (!parsed.success) return { ok: false, error: "invalid" };
  return confirmBankTransfer(parsed.data, admin.id);
}

/** Admin: the uploaded receipt is not acceptable; the customer may upload again. */
export async function rejectTransferReceiptAction(orderNumber: unknown): Promise<AdminResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "forbidden" };
  const parsed = schema.safeParse(orderNumber);
  if (!parsed.success) return { ok: false, error: "invalid" };
  return rejectTransferReceipt(parsed.data, admin.id);
}
