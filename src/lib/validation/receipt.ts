import { z } from "zod";

import { ORDER_NUMBER_PATTERN } from "@/lib/orders/order-number-pattern";

export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;
export const RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;

/** Error messages are translation keys under `receipt.errors`. */
export const receiptSchema = z.object({
  orderNumber: z.string().regex(ORDER_NUMBER_PATTERN),
  reference: z.string().trim().max(40, "tooLong"),
  file: z
    .instanceof(File, { message: "fileRequired" })
    .refine((file) => file.size > 0, "fileRequired")
    .refine((file) => file.size <= RECEIPT_MAX_BYTES, "fileTooLarge")
    .refine((file) => RECEIPT_TYPES.some((type) => type === file.type), "fileType"),
});
export type ReceiptInput = z.input<typeof receiptSchema>;

export const receiptErrorKeys = [
  "fileRequired",
  "fileTooLarge",
  "fileType",
  "tooLong",
  "notAllowed",
  "unauthorized",
  "server",
] as const;
export type ReceiptErrorKey = (typeof receiptErrorKeys)[number];

export function toReceiptErrorKey(message: string | undefined): ReceiptErrorKey {
  return receiptErrorKeys.find((key) => key === message) ?? "server";
}

/** Detects the real file type from its first bytes (never trust the browser's type). */
export function sniffReceiptType(bytes: Uint8Array): { ext: string; mime: string } | null {
  const starts = (...sig: number[]) => sig.every((byte, index) => bytes[index] === byte);
  if (starts(0xff, 0xd8, 0xff)) return { ext: "jpg", mime: "image/jpeg" };
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { ext: "png", mime: "image/png" };
  if (starts(0x25, 0x50, 0x44, 0x46, 0x2d)) return { ext: "pdf", mime: "application/pdf" };
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { ext: "webp", mime: "image/webp" };
  return null;
}
