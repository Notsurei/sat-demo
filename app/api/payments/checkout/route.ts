import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { userId, email, plan } = await req.json();
    const normalizedPlan = String(plan ?? "").toUpperCase();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const priceMap: Record<string, string> = {
      BASIC: process.env.STRIPE_BASIC_PRICE_ID!,
      PREMIUM: process.env.STRIPE_PREMIUM_PRICE_ID!,
      VIP: process.env.STRIPE_VIP_PRICE_ID!,
    };

    const priceId = priceMap[normalizedPlan];

    if (!priceId) {
      return NextResponse.json(
        {
          error: `Unsupported plan: ${plan}`,
        },
        {
          status: 400,
        },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      customer_email: email,

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      metadata: {
        userId,
        plan: normalizedPlan,
      },

      success_url: `${baseUrl}/payment/success`,

      cancel_url: `${baseUrl}/payment/cancel`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}
