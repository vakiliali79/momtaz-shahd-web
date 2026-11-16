/** History notes the customer may see, keyed by the code before any ":" detail. */
const visibleNotes = [
  "order_placed",
  "order_placed_cod",
  "payment_received",
  "payment_failed",
  "payment_needs_review",
  "receipt_uploaded",
  "receipt_rejected",
  "bank_transfer_confirmed",
  "cancelled_by_customer",
] as const;
type VisibleNote = (typeof visibleNotes)[number];

export function noteKey(note: string | null): VisibleNote | null {
  const code = note?.split(":")[0];
  return visibleNotes.find((key) => key === code) ?? null;
}
