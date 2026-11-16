import { create } from "zustand";

export type ClientSessionUser = { id: string; name: string };

/**
 * Signed-in state for client components in the shared header. It is filled
 * by <SessionBridge>, which streams in from the server inside a <Suspense>
 * boundary, so the rest of every page can stay static.
 */
export const useSessionStore = create<{
  status: "loading" | "guest" | "user";
  user: ClientSessionUser | null;
  setUser: (user: ClientSessionUser | null) => void;
}>()((set) => ({
  status: "loading",
  user: null,
  setUser: (user) => set({ user, status: user ? "user" : "guest" }),
}));
