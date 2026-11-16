import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { ORDER_NUMBER_PATTERN } from "@/lib/orders/order-number-pattern";
import { getCurrentUser } from "@/lib/session";
import { readStoredFile } from "@/lib/storage";
import { sniffReceiptType } from "@/lib/validation/receipt";

/** Serves a bank-transfer receipt to the order's owner or an admin only. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/orders/[orderNumber]/receipt">,
) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  if (!ORDER_NUMBER_PATTERN.test(orderNumber)) return new NextResponse(null, { status: 404 });

  const order = await db.order.findFirst({
    where: { orderNumber, ...(user.role === "ADMIN" ? {} : { userId: user.id }) },
    select: { receiptPath: true },
  });
  const file = order?.receiptPath ? await readStoredFile(order.receiptPath) : null;
  const type = file ? sniffReceiptType(file) : null;
  if (!file || !type) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": type.mime,
      "Content-Disposition": `inline; filename="receipt-${orderNumber}.${type.ext}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
