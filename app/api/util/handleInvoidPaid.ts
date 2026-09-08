import Stripe from "stripe";
import { prisma } from "../util/prisma";

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.parent?.subscription_details?.subscription;

  if (!subscriptionId || typeof subscriptionId !== "string") return;

  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
    },
  });

  if (!subscription) return;

  await prisma.payment.create({
    data: {
      userId: subscription.userId,

      amount: invoice.amount_paid / 100,

      currency: invoice.currency.toUpperCase(),

      status: "COMPLETED",

      plan: subscription.plan,

      stripeInvoiceId: invoice.id,

      paidAt: new Date(),
    },
  });

  await prisma.user.update({
    where: {
      id: subscription.userId,
    },
    data: {
      subscriptionPlan: subscription.plan,
    },
  });
}
