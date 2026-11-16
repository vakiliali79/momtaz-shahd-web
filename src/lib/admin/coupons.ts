import "server-only";

import { db } from "@/lib/db";
import { expiryDay, type CouponInput } from "@/lib/admin/coupon-schema";

export type AdminCouponRow = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  expired: boolean;
  usedUp: boolean;
};

export async function listAdminCoupons(): Promise<AdminCouponRow[]> {
  const coupons = await db.coupon.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "desc" }] });
  const now = new Date();
  return coupons.map((coupon) => ({
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minOrder: coupon.minOrder,
    maxUses: coupon.maxUses,
    usedCount: coupon.usedCount,
    expiresAt: coupon.expiresAt?.toISOString() ?? null,
    isActive: coupon.isActive,
    expired: coupon.expiresAt !== null && coupon.expiresAt < now,
    usedUp: coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses,
  }));
}

export async function getCouponForEdit(id: string): Promise<CouponInput | null> {
  const coupon = await db.coupon.findUnique({ where: { id } });
  if (!coupon) return null;
  return {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minOrder: coupon.minOrder,
    maxUses: coupon.maxUses,
    expiresAt: coupon.expiresAt ? expiryDay(coupon.expiresAt) : "",
    isActive: coupon.isActive,
  };
}
