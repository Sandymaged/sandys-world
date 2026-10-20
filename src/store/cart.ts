"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { emptyRecipient, type CartGift } from "@/lib/cart";

export interface Sender {
  name: string;
  phone: string;
  email: string;
  isRecipient: boolean; // المرسل هو نفسه المستلم (شرط الكاش)
}

interface CartState {
  gifts: CartGift[];
  sender: Sender;
  couponCode: string;
  /** الهدية اللي لسه متضافة — بتفتح درج السلة */
  justAdded: string | null;
  closeDrawer: () => void;
  addGift: (
    g: Omit<CartGift, "id" | "recipient" | "delivery" | "cardMessage" | "hidePrice" | "surprise" | "wantsDeliveryPhoto">,
  ) => string;
  updateGift: (id: string, patch: Partial<CartGift>) => void;
  removeGift: (id: string) => void;
  setSender: (patch: Partial<Sender>) => void;
  setCoupon: (code: string) => void;
  clear: () => void;
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      gifts: [],
      sender: { name: "", phone: "", email: "", isRecipient: false },
      couponCode: "",
      justAdded: null,
      closeDrawer: () => set({ justAdded: null }),
      addGift: (g) => {
        const id = newId();
        // المستلم الافتراضي = مستلم آخر هدية، عشان اللي بيبعت كذا حاجة لنفس الشخص
        const last = get().gifts.at(-1);
        set((s) => ({
          gifts: [
            ...s.gifts,
            {
              ...g,
              id,
              recipient: last ? { ...last.recipient } : { ...emptyRecipient },
              delivery: { date: "", period: "" },
              cardMessage: "",
              hidePrice: true,
              surprise: false,
              wantsDeliveryPhoto: true,
            },
          ],
          justAdded: id,
        }));
        return id;
      },
      updateGift: (id, patch) =>
        set((s) => ({
          gifts: s.gifts.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),
      removeGift: (id) =>
        set((s) => ({ gifts: s.gifts.filter((g) => g.id !== id) })),
      setSender: (patch) => set((s) => ({ sender: { ...s.sender, ...patch } })),
      setCoupon: (couponCode) => set({ couponCode }),
      clear: () => set({ gifts: [], couponCode: "" }),
    }),
    {
      name: "gift-cart-v1",
      // الدرج مش بيتحفظ: لو الصفحة اتعملها refresh ميفتحش لوحده
      partialize: (s) => ({ gifts: s.gifts, sender: s.sender, couponCode: s.couponCode }),
    },
  ),
);
