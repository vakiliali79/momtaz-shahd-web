import { ArrowLeftIcon } from "lucide-react";

import { Link } from "@/i18n/navigation";

/** Thin brand-coloured strip above the header, edited in Admin → Settings. */
export function AnnouncementBanner({ text, link }: { text: string; link: string | null }) {
  const content = (
    <>
      <span>{text}</span>
      {link ? <ArrowLeftIcon className="size-3.5 shrink-0 ltr:rotate-180" aria-hidden="true" /> : null}
    </>
  );
  return (
    <aside className="bg-brand-red px-4 text-center text-xs font-medium text-white sm:text-sm print:hidden">
      {link ? (
        <Link href={link} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none">
          {content}
        </Link>
      ) : (
        <p className="flex min-h-11 items-center justify-center gap-1.5">{content}</p>
      )}
    </aside>
  );
}
