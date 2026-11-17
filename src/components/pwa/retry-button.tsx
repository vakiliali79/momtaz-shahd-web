"use client";

import { RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function RetryButton({ label }: { label: string }) {
  return (
    <Button size="lg" className="h-12 rounded-full px-6" onClick={() => window.location.reload()}>
      <RotateCcwIcon aria-hidden="true" />
      {label}
    </Button>
  );
}
