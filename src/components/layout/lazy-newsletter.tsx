"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// The form (React Hook Form, its schema and the server action) loads only
// when the footer comes near the screen, keeping it out of the first load.
const NewsletterForm = dynamic(() => import("@/components/layout/newsletter-form").then((module) => module.NewsletterForm), {
  ssr: false,
  loading: () => <NewsletterPlaceholder />,
});

function NewsletterPlaceholder() {
  return (
    <div aria-hidden="true" className="flex flex-wrap gap-2">
      <div className="h-11 min-w-0 flex-1 basis-44 rounded-full border border-input bg-background" />
      <div className="h-11 w-24 rounded-full bg-brand-red/80" />
    </div>
  );
}

export function LazyNewsletter() {
  const anchor = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = anchor.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={anchor}>{visible ? <NewsletterForm /> : <NewsletterPlaceholder />}</div>;
}
