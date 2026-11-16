"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import { firstIssue, type AdminResult } from "@/lib/admin/validation";
import { db } from "@/lib/db";
import { getCity, getProvince } from "@/lib/locations";
import { getAdminUser } from "@/lib/session";
import { settingSchemas, type SettingKey } from "@/lib/settings-schemas";

const keys = Object.keys(settingSchemas) as SettingKey[];

/**
 * Saves one or more settings at once (e.g. shipping and the free-shipping
 * threshold). Each value is validated with its schema before anything is
 * written; the storefront picks the change up through the "settings" tag.
 */
export async function saveSettings(input: unknown): Promise<AdminResult> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const shape = z.record(z.enum(keys), z.unknown()).safeParse(input);
  if (!shape.success || Object.keys(shape.data).length === 0) return { ok: false, error: "invalid" };

  const rows: { key: SettingKey; value: object }[] = [];
  for (const key of keys) {
    if (!(key in shape.data)) continue;
    const parsed = settingSchemas[key].safeParse(shape.data[key]);
    if (!parsed.success) {
      const issue = firstIssue(parsed.error.issues);
      return { ...issue, field: issue.field ? `${key}.${issue.field}` : key };
    }
    let value: object = parsed.data;
    if (key === "shipping" && "origin" in parsed.data) {
      const { origin, methods } = parsed.data;
      if (!getCity(origin.province, origin.city)) return { ok: false, error: "required", field: "shipping.origin.city" };
      if (methods.some((method) => Object.keys(method.provinceRates).some((id) => !getProvince(id)))) {
        return { ok: false, error: "invalid", field: "shipping.methods" };
      }
    }
    if (key === "exchangeRates") value = { ...parsed.data, updatedAt: new Date().toISOString() };
    rows.push({ key, value });
  }

  try {
    await db.$transaction(
      rows.map(({ key, value }) => db.setting.upsert({ where: { key }, update: { value }, create: { key, value } })),
    );
  } catch (error) {
    console.error("[admin] saveSettings failed:", error);
    return { ok: false, error: "server" };
  }
  updateTag("settings");
  return { ok: true };
}
