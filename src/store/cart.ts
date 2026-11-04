"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { emptyDelivery, emptyRecipient, type CartGift, type OrderDelivery } from "@/lib/cart";

export interface Sender {
  name: string;
  phone: string;
  email: string;
  isRecipient: boolean; // المرسل هو نفسه المستلم (شرط الكاش)
}

interface CartState {
  gifts: CartGift[];
  /** التوصيل للطلب كله (شخص واحد وميعاد واحد) */
  delivery: OrderDelivery;
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
  setDelivery: (patch: Partial<OrderDelivery>) => void;
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
    (set) => ({
      gifts: [],
      delivery: emptyDelivery(),
      sender: { name: "", phone: "", email: "", isRecipient: false },
      couponCode: "",
      justAdded: null,
      closeDrawer: () => set({ justAdded: null }),
      addGift: (g) => {
        const id = newId();
        set((s) => ({
          gifts: [
            ...s.gifts,
            {
              ...g,
              id,
              // بيانات التوصيل الحقيقية في delivery (للطلب كله)، دي بتتملا وقت الإرسال
              recipient: { ...emptyRecipient },
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
      setDelivery: (patch) => set((s) => ({ delivery: { ...s.delivery, ...patch } })),
      setSender: (patch) => set((s) => ({ sender: { ...s.sender, ...patch } })),
      setCoupon: (couponCode) => set({ couponCode }),
      // بنسيب المستلم والعنوان للطلب الجاي، وبنشيل الميعاد
      clear: () => set((s) => ({ gifts: [], couponCode: "", delivery: { ...s.delivery, date: "", period: "" } })),
    }),
    {
      name: "gift-cart-v1",
      // الدرج مش بيتحفظ: لو الصفحة اتعملها refresh ميفتحش لوحده
      partialize: (s) => ({ gifts: s.gifts, delivery: s.delivery, sender: s.sender, couponCode: s.couponCode }),
      // السلات القديمة كان التوصيل فيها جوه كل هدية: بناخده من أول هدية
      // نسخة 3: رسالة الكارت بقت واحدة للطلب كله (بناخدها من أول هدية فيها رسالة)
      version: 3,
      migrate: (persisted, version) => {
        const st = persisted as Partial<CartState> & { gifts?: CartGift[] };
        if (version < 2 && !st.delivery) {
          const first = st.gifts?.[0];
          st.delivery = first
            ? {
                recipient: { ...first.recipient },
                date: first.delivery.date,
                period: first.delivery.period,
                hidePrice: first.hidePrice,
                surprise: first.surprise,
                wantsDeliveryPhoto: first.wantsDeliveryPhoto,
                cardMessage: "",
              }
            : emptyDelivery();
        }
        if (version < 3 && st.delivery && st.delivery.cardMessage === undefined) {
          st.delivery = { ...st.delivery, cardMessage: st.gifts?.find((g) => g.cardMessage)?.cardMessage ?? "" };
        }
        return st as CartState;
      },
    },
  ),
);
