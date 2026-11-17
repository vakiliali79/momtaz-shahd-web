import { z } from "zod";

import { count, money } from "@/lib/admin/validation";

export const couponTypes = ["PERCENT", "FIXED"] as const;

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "required")
      .max(32, "tooLong")
      .regex(/^[A-Z0-9_-]+$/, "invalid"),
    type: z.enum(couponTypes),
    value: z.number({ error: "required" }).int("mustBeWhole").min(1, "mustBePositive").max(10_000_000_000, "tooLong"),
    minOrder: money,
    maxUses: count.min(1, "mustBePositive").nullable(),
    /** YYYY-MM-DD (end of that day, Tehran time), or empty for no expiry. */
    expiresAt: z.union([z.literal(""), z.iso.date("invalid")]),
    isActive: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "PERCENT" && value.value > 100) ctx.addIssue({ code: "custom", path: ["value"], message: "percentRange" });
  });
export type CouponInput = z.input<typeof couponSchema>;
export type CouponOutput = z.output<typeof couponSchema>;

/** The coupon stays valid until the end of the chosen day in Iran. */
export function expiryInstant(day: string): Date {
  return new Date(`${day}T23:59:59+03:30`);
}

export function expiryDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
