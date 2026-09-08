import Stripe from "stripe";
import { headers } from "next/headers";
import { handleCheckoutCompleted } from "../../util/handleCheckout";
import { handleInvoicePaid } from "../../util/handleInvoidPaid";
import { handleSubscriptionCanceled } from "../../util/cancelSubscription";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();

  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session,
      );
      break;

    case "invoice.paid":
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionCanceled(
        event.data.object as Stripe.Subscription,
      );
      break;
  }

  return Response.json({
    received: true,
  });
}
