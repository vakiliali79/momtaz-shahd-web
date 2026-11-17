"use client";

import { useId, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, ImagePlusIcon, StarIcon, Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { ProductImage } from "@/components/product/product-image";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp";

/**
 * Multi-image uploader: uploads each file to /api/admin/uploads, keeps the
 * returned URLs in order (the first image is the cover), and lets the admin
 * reorder or remove them.
 */
export function ImageUploader({
  value,
  onChange,
  folder,
  max = 8,
  label,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  folder: "products" | "categories" | "dealers";
  max?: number;
  label: string;
}) {
  const t = useTranslations("admin.images");
  const locale = useLocale();
  const id = useId();
  const [uploading, setUploading] = useState(0);

  async function upload(files: FileList) {
    const room = Math.max(0, max - value.length);
    const selected = Array.from(files).slice(0, room);
    if (files.length > room) toast.warning(t("tooMany", { max: formatNumber(max, locale) }));
    setUploading(selected.length);
    const urls: string[] = [];
    for (const file of selected) {
      const body = new FormData();
      body.set("file", file);
      body.set("folder", folder);
      try {
        const response = await fetch("/api/admin/uploads", { method: "POST", body });
        const result = (await response.json()) as { url?: string; error?: string };
        if (result.url) urls.push(result.url);
        else toast.error(t(`errors.${result.error === "fileType" || result.error === "fileTooLarge" ? result.error : "server"}`, { name: file.name }));
      } catch {
        toast.error(t("errors.server", { name: file.name }));
      }
      setUploading((count) => count - 1);
    }
    if (urls.length > 0) onChange([...value, ...urls]);
  }

  function move(index: number, delta: number) {
    const next = [...value];
    const [item] = next.splice(index, 1);
    if (item === undefined) return;
    next.splice(index + delta, 0, item);
    onChange(next);
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <p className="text-xs text-muted-foreground">{t("hint", { max: formatNumber(max, locale) })}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {value.map((url, index) => (
          <li key={url} className="group relative overflow-hidden rounded-xl border border-border bg-secondary">
            <div className="relative aspect-square">
              <ProductImage src={url} alt="" sizes="200px" />
            </div>
            {index === 0 ? (
              <span className="absolute start-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[0.6875rem] font-semibold">
                <StarIcon className="size-3 fill-brand-gold text-gold-ink" aria-hidden="true" />
                {t("cover")}
              </span>
            ) : null}
            <div className="flex items-center justify-between gap-1 border-t border-border bg-card p-1">
              <div className="flex">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={t("moveEarlier", { index: formatNumber(index + 1, locale) })}
                  className="grid size-8 place-items-center rounded-lg hover:bg-muted disabled:opacity-30"
                >
                  <ArrowRightIcon className="size-4 ltr:rotate-180" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={t("moveLater", { index: formatNumber(index + 1, locale) })}
                  className="grid size-8 place-items-center rounded-lg hover:bg-muted disabled:opacity-30"
                >
                  <ArrowLeftIcon className="size-4 ltr:rotate-180" aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onChange(value.filter((entry) => entry !== url))}
                aria-label={t("remove", { index: formatNumber(index + 1, locale) })}
                className="grid size-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"
              >
                <Trash2Icon className="size-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
        {value.length < max ? (
          <li>
            <label
              htmlFor={id}
              className={cn(
                "flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input text-sm text-muted-foreground transition-colors hover:border-brand-gold hover:text-foreground has-focus-visible:outline-2 has-focus-visible:outline-ring",
                uploading > 0 && "pointer-events-none opacity-60",
              )}
            >
              <ImagePlusIcon className="size-7" aria-hidden="true" />
              {uploading > 0 ? t("uploading", { count: formatNumber(uploading, locale) }) : t("add")}
              <input
                id={id}
                type="file"
                accept={ACCEPT}
                multiple
                className="sr-only"
                onChange={(event) => {
                  if (event.target.files?.length) void upload(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
          </li>
        ) : null}
      </ul>
    </fieldset>
  );
}
