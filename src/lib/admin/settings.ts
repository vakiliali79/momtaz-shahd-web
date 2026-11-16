import "server-only";

import { db } from "@/lib/db";
import { settingSchemas, type SettingKey } from "@/lib/settings-schemas";
import type { z } from "zod";

type SettingValues = { [K in SettingKey]: z.output<(typeof settingSchemas)[K]> | null };

/** Current settings for the admin forms (null where missing or unreadable). */
export async function getAdminSettings(): Promise<SettingValues> {
  const rows = await db.setting.findMany({ where: { key: { in: Object.keys(settingSchemas) } } });
  const read = <K extends SettingKey>(key: K): z.output<(typeof settingSchemas)[K]> | null => {
    const parsed = settingSchemas[key].safeParse(rows.find((row) => row.key === key)?.value);
    return parsed.success ? (parsed.data as z.output<(typeof settingSchemas)[K]>) : null;
  };
  return {
    shipping: read("shipping"),
    freeShipping: read("freeShipping"),
    exchangeRates: read("exchangeRates"),
    contact: read("contact"),
    announcementBanner: read("announcementBanner"),
    bankTransfer: read("bankTransfer"),
  };
}
