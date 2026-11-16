"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { deleteStoredFile, saveFile } from "@/lib/storage";
import {
  receiptSchema,
  sniffReceiptType,
  toReceiptErrorKey,
  type ReceiptErrorKey,
} from "@/lib/validation/receipt";

export type ReceiptResult = { ok: true } | { ok: false; error: ReceiptErrorKey };

/**
 * Customer uploads the bank-transfer receipt for a pending order. The order
 * stays PENDING until an admin confirms the transfer (see
 * src/lib/orders/bank-transfer.ts). Uploading again replaces the receipt.
 */
export async function uploadTransferReceipt(formData: FormData): Promise<ReceiptResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = receiptSchema.safeParse({
    orderNumber: formData.get("orderNumber"),
    reference: formData.get("reference") ?? "",
    file: formData.get("file"),
  });
  if (!parsed.success) {
    return { ok: false, error: toReceiptErrorKey(parsed.error.issues[0]?.message) };
  }
  const { orderNumber, reference, file } = parsed.data;

  const order = await db.order.findFirst({
    where: { orderNumber, userId: user.id },
    select: { id: true, status: true, paymentMethod: true, receiptPath: true },
  });
  if (!order || order.paymentMethod !== "BANK_TRANSFER" || order.status !== "PENDING") {
    return { ok: false, error: "notAllowed" };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffReceiptType(bytes);
  if (!type) return { ok: false, error: "fileType" };

  try {
    const key = await saveFile(
      `receipts/${orderNumber}-${randomBytes(6).toString("hex")}.${type.ext}`,
      bytes,
    );
    const updated = await db.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: {
        receiptPath: key,
        receiptUploadedAt: new Date(),
        transferReference: reference || null,
      },
    });
    if (updated.count !== 1) {
      await deleteStoredFile(key);
      return { ok: false, error: "notAllowed" };
    }
    await db.orderStatusHistory.create({
      data: { orderId: order.id, status: "PENDING", note: "receipt_uploaded" },
    });
    if (order.receiptPath) await deleteStoredFile(order.receiptPath);
  } catch (error) {
    console.error("[receipt] Upload failed:", error);
    return { ok: false, error: "server" };
  }

  revalidatePath("/[locale]/checkout/success/[orderNumber]", "page");
  return { ok: true };
}
