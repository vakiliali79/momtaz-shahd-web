import { create } from "zustand";

/** Open state of the cart drawer, so any component (e.g. a toast) can open it. */
export const useCartDrawer = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
