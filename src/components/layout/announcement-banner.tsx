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
    <aside className="bg-primary px-4 py-2 text-center text-xs font-medium text-primary-foreground sm:text-sm print:hidden">
      {link ? (
        <Link href={link} className="touch-target inline-flex items-center justify-center gap-1.5 rounded underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:outline-none">
          {content}
        </Link>
      ) : (
        <p>{content}</p>
      )}
    </aside>
  );
}
