"use client";

import { useEffect, useSyncExternalStore } from "react";

import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import fa from "../../messages/fa.json";

const texts = { fa: fa.errorPage, en: en.errorPage, ar: ar.errorPage } as const;
type Locale = keyof typeof texts;

/**
 * Last-resort error page, used when the root layout itself fails. It
 * replaces the whole document, so it carries its own <html> and minimal
 * styles, and reads the language from the URL.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // The language comes from the URL; the server render falls back to Persian.
  const locale = useSyncExternalStore<Locale>(
    () => () => undefined,
    () => {
      const segment = window.location.pathname.split("/")[1];
      return segment === "en" || segment === "ar" ? segment : "fa";
    },
    () => "fa",
  );

  useEffect(() => {
    console.error(error);
  }, [error]);

  const t = texts[locale];
  const rtl = locale !== "en";
  return (
    <html lang={locale} dir={rtl ? "rtl" : "ltr"}>
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", fontFamily: "system-ui, sans-serif", background: "#fff", color: "#2b2118", padding: "1.5rem" }}>
        <main style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.75rem", margin: "0 0 0.75rem" }}>{t.title}</h1>
          <p style={{ color: "#6b5b4d", lineHeight: 1.7, margin: "0 0 1.5rem" }}>{t.description}</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ minHeight: "3rem", padding: "0 1.5rem", borderRadius: "9999px", border: 0, background: "#c8102e", color: "#fff", fontSize: "1rem", cursor: "pointer" }}
          >
            {t.retry}
          </button>
          {error.digest ? (
            <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "#6b5b4d" }}>
              {t.reference} <code dir="ltr">{error.digest}</code>
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
