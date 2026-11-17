import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Admin sidebar preference, remembered in this browser. */
export const useAdminUi = create<{
  collapsed: boolean;
  toggle: () => void;
}>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((state) => ({ collapsed: !state.collapsed })),
    }),
    {
      name: "momtaz-shahd-admin-ui",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
