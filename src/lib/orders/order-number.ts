import "server-only";

/** Prefix for orders placed on a given day in Tehran, e.g. "MS-20261116-". */
export function orderNumberPrefix(date: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll("-", "");
  return `MS-${day}-`;
}

/** Next number after the day's latest one: MS-20261116-0001, -0002, … */
export function nextOrderNumber(prefix: string, latest: string | null): string {
  const last = latest ? Number(latest.slice(prefix.length)) : 0;
  const next = (Number.isFinite(last) ? last : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}
