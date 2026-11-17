import { ChevronDownIcon } from "lucide-react";

/**
 * Accordion of questions built on <details>/<summary>: keyboard and screen
 * reader support come from the browser, and it works without JavaScript.
 */
export function Faq({ items }: { items: readonly { question: string; answer: string }[] }) {
  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card shadow-soft">
      {items.map((item) => (
        <details key={item.question} className="group px-5 py-1 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-4 font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            {item.question}
            <ChevronDownIcon className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
          </summary>
          <p className="pb-5 text-sm leading-7 text-pretty text-muted-foreground">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
