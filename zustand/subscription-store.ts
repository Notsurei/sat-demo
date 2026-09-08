import { create } from "zustand";

interface SubscriptionState {
  plan: string;
  nextBillingDate: string | null;

  setSubscription: (plan: string, nextBillingDate: string) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  plan: "FREE",

  nextBillingDate: null,

  setSubscription: (plan, nextBillingDate) =>
    set({
      plan,
      nextBillingDate,
    }),
}));
