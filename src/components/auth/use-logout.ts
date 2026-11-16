"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { logout } from "@/actions/auth";
import { useSessionStore } from "@/stores/session";

export function useLogout() {
  const t = useTranslations("auth");
  const router = useRouter();
  const setUser = useSessionStore((state) => state.setUser);
  const [pending, startTransition] = useTransition();

  return {
    pending,
    logout: () =>
      startTransition(async () => {
        await logout();
        setUser(null);
        toast.success(t("signedOut"));
        // Re-render server components (protected pages redirect to login).
        router.refresh();
      }),
  };
}
