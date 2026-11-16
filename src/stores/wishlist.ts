import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const WISHLIST_STORAGE_KEY = "momtaz-shahd-wishlist";

type WishlistState = {
  /**
   * Product ids. Guests keep them in the browser; for signed-in users the
   * list is merged with, and then mirrors, their saved wishlist
   * (see WishlistSync and useWishlistToggle).
   */
  ids: string[];
  /** True once the list has been merged with the signed-in user's saved one. */
  synced: boolean;
  toggle: (id: string) => void;
  setIds: (ids: string[], synced: boolean) => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      synced: false,
      toggle: (id) =>
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((entry) => entry !== id)
            : [...state.ids, id],
        })),
      setIds: (ids, synced) => set({ ids, synced }),
    }),
    {
      name: WISHLIST_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ ids: state.ids }),
      skipHydration: true,
    },
  ),
);
