"use client";

import { useEffect } from "react";

import { useSessionStore, type ClientSessionUser } from "@/stores/session";

export function SessionBridge({ user }: { user: ClientSessionUser | null }) {
  const setUser = useSessionStore((state) => state.setUser);
  const id = user?.id ?? null;
  const name = user?.name ?? "";

  useEffect(() => {
    setUser(id ? { id, name } : null);
  }, [id, name, setUser]);

  return null;
}
