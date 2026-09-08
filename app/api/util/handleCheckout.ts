import Stripe from "stripe";
import { prisma } from "./prisma";

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan;

  if (!userId || !plan) return;

  const subscriptionId = session.subscription?.toString();

  await prisma.subscription.create({
    data: {
      userId,
      plan: plan as any,
      status: "ACTIVE",
      stripeSubscriptionId: subscriptionId,
    },
  });

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      subscriptionPlan: plan as any,
    },
  });

  await prisma.payment.create({
    data: {
      userId,
      amount: session.amount_total ? session.amount_total / 100 : 0,

      currency: session.currency?.toUpperCase() ?? "USD",

      status: "COMPLETED",

      plan: plan as any,

      stripePaymentIntentId: session.payment_intent?.toString(),

      paidAt: new Date(),
    },
  });
}
