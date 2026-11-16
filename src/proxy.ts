import createMiddleware from "next-intl/middleware";
import { hasLocale } from "next-intl";
import { NextResponse, type NextRequest } from "next/server";

import { LOCALE_COOKIE_NAME, routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

function hasLocalePrefix(pathname: string): boolean {
  return routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // No locale in the URL: honour the visitor's saved choice, if any.
  // Otherwise next-intl redirects to the default locale (/ → /fa).
  if (!hasLocalePrefix(pathname)) {
    const saved = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
    if (hasLocale(routing.locales, saved) && saved !== routing.defaultLocale) {
      const url = request.nextUrl.clone();
      url.pathname = `/${saved}${pathname === "/" ? "" : pathname}`;
      return NextResponse.redirect(url);
    }
  }

  return handleI18nRouting(request);
}

export const config = {
  // Everything except API routes, Next.js internals and files with an extension.
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
