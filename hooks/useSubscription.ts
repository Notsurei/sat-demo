import axios from "axios";
import { useSubscriptionStore } from "@/zustand/subscription-store";

export function useSubscription() {
  const store = useSubscriptionStore();

  const createCheckout = async (plan: string) => {
    const res = await axios.post("/api/subscription/checkout", { plan });

    window.location.href = res.data.url;
  };

  const cancelSubscription = async () => {
    await axios.post("/api/subscription/cancel");
  };

  return {
    ...store,
    createCheckout,
    cancelSubscription,
  };
}
