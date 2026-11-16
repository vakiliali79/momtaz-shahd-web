import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const WISHLIST_STORAGE_KEY = "momtaz-shahd-wishlist";

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
      name: WISHLIST_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
