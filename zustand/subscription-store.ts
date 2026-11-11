import { create } from "zustand";
import axios from "axios";

interface SubscriptionState {
  plan: string;
  nextBillingDate: string | null;
  loading: boolean;
  error: string | null;

  setSubscription: (plan: string, nextBillingDate: string) => void;
  createCheckout: (plan: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  plan: "FREE",
  nextBillingDate: null,
  loading: false,
  error: null,

  setSubscription: (plan, nextBillingDate) => set({ plan, nextBillingDate }),

  createCheckout: async (plan) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.post("/api/subscription/checkout", { plan });
      if (!res.data?.url) throw new Error("Missing checkout URL");
      window.location.href = res.data.url;
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  cancelSubscription: async () => {
    try {
      set({ loading: true, error: null });
      await axios.post("/api/subscription/cancel");
      set({ plan: "FREE", nextBillingDate: null });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  reset: () =>
    set({
      plan: "FREE",
      nextBillingDate: null,
      loading: false,
      error: null,
    }),
}));

export const useSubscription = useSubscriptionStore;
