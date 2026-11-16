import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type WishlistState = {
  /** Product ids. Kept in the browser until accounts exist to sync with. */
  ids: string[];
  toggle: (id: string) => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) =>
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((entry) => entry !== id)
            : [...state.ids, id],
        })),
    }),
    {
      name: "momtaz-shahd-wishlist",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
