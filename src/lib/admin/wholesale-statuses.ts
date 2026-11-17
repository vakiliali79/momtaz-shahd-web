export const wholesaleStatuses = ["NEW", "CONTACTED", "CONVERTED", "REJECTED"] as const;
export type WholesaleStatus = (typeof wholesaleStatuses)[number];
