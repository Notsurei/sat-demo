import Stripe from "stripe";
import { prisma } from "./prisma";

export async function handleSubscriptionCanceled(
  stripeSubscription: Stripe.Subscription,
) {
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: stripeSubscription.id,
    },

    data: {
      status: "CANCELED",
      cancelAtPeriodEnd: true,
    },
  });
}
