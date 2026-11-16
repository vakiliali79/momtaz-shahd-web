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

/** Pages that need a signed-in user, without the locale prefix. */
const PROTECTED_PATHS = [/^\/checkout(\/|$)/, /^\/account(\/|$)/];

/**
 * Auth.js session cookie (`__Secure-` prefix on HTTPS, `.0`/`.1` suffixes
 * when the token is split into chunks).
 */
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(({ name }) => /^(__Secure-)?authjs\.session-token(\.\d+)?$/.test(name));
}

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Fast path for signed-out visitors on protected pages. The page itself
  // still verifies the session, since a cookie may be expired or forged.
  const [, maybeLocale = "", ...rest] = pathname.split("/");
  if (hasLocale(routing.locales, maybeLocale) && !hasSessionCookie(request)) {
    const localPath = `/${rest.join("/")}`;
    if (PROTECTED_PATHS.some((pattern) => pattern.test(localPath))) {
      const url = request.nextUrl.clone();
      url.pathname = `/${maybeLocale}/login`;
      url.search = `?callbackUrl=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
  }

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
