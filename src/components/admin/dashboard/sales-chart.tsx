"use client";

import { useLocale, useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { localeMeta } from "@/i18n/locales";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";

type Point = { day: string; total: number; orders: number };

/** Noon in Tehran on that day, so the calendar date never shifts. */
const instant = (day: string) => `${day}T12:00:00+03:30`;

function ChartTooltip({ active, point }: { active: boolean; point: Point | undefined }) {
  const t = useTranslations("admin.dashboard");
  const locale = useLocale();
  const toman = useTranslations("common")("toman");
  if (!active || !point) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-soft">
      <p className="font-medium">{formatDate(instant(point.day), locale, { dateStyle: "medium" })}</p>
      <p className="mt-1 text-sm font-semibold">{formatPrice(point.total, locale, toman)}</p>
      <p className="text-muted-foreground">{t("ordersCount", { count: point.orders, formatted: formatNumber(point.orders, locale) })}</p>
    </div>
  );
}

/** Sales per day for the last 30 days: one series, so no legend; values on hover and in the table. */
export function SalesChart({ data }: { data: Point[] }) {
  const t = useTranslations("admin.dashboard");
  const locale = useLocale();
  const toman = useTranslations("common")("toman");
  const rtl = localeMeta[locale].dir === "rtl";
  const compact = new Intl.NumberFormat(localeMeta[locale].numberLocale, { notation: "compact", maximumFractionDigits: 1 });

  return (
    <div className="space-y-3">
      <div className="h-64 w-full sm:h-72" role="img" aria-label={t("chartLabel")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap={2}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
            <XAxis
              dataKey="day"
              reversed={rtl}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={24}
              tickFormatter={(day: string) => formatDate(instant(day), locale, { day: "numeric", month: "short" })}
            />
            <YAxis
              orientation={rtl ? "right" : "left"}
              width={48}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(value: number) => compact.format(value)}
            />
            <Tooltip
              content={({ active, label }) => <ChartTooltip active={active} point={data.find((entry) => entry.day === label)} />} cursor={{ fill: "var(--muted)", opacity: 0.6 }} />
            <Bar dataKey="total" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">{t("showTable")}</summary>
        <div className="mt-2 max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{t("chartLabel")}</caption>
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="py-1 text-start font-medium">{t("day")}</th>
                <th scope="col" className="py-1 text-start font-medium">{t("orders")}</th>
                <th scope="col" className="py-1 text-end font-medium">{t("sales")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((point) => (
                <tr key={point.day}>
                  <td className="py-1">{formatDate(instant(point.day), locale, { dateStyle: "medium" })}</td>
                  <td className="py-1">{formatNumber(point.orders, locale)}</td>
                  <td className="py-1 text-end">{formatPrice(point.total, locale, toman)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
