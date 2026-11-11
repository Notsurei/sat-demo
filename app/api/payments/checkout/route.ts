import { NextRequest, NextResponse } from "next/server";
import DodoPayments from "dodopayments";

const environment =
  process.env.DODO_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY,
  environment,
});

const productMap: Record<string, string | undefined> = {
  BASIC: process.env.DODO_BASIC_PRICE_ID,
  PREMIUM: process.env.DODO_PREMIUM_PRICE_ID,
  VIP: process.env.DODO_VIP_PRICE_ID,
};

export async function POST(req: NextRequest) {
  try {
    const { userId, email, plan } = await req.json();

    const normalizedPlan = String(plan ?? "").toUpperCase();
    const productId = productMap[normalizedPlan];

    if (!userId || !email || !productId) {
      return NextResponse.json(
        { error: "Invalid user, email, or subscription plan" },
        { status: 400 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],

      metadata: {
        userId: String(userId),
        plan: normalizedPlan,
        registeredEmail: email,
      },

      // ✅ Ẩn hoàn toàn phần "Purchasing as business"
      feature_flags: {
        allow_tax_id: false,
        allow_customer_editing_business_name: false,
      },

      return_url: `${baseUrl}/payment/success`,
    });

    if (!session.checkout_url) {
      return NextResponse.json(
        { error: "Dodo checkout URL was not returned" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      url: session.checkout_url,
      sessionId: session.session_id,
    });
  } catch (error) {
    console.error("Dodo checkout creation failed:", error);

    return NextResponse.json(
      { error: "Unable to create checkout session" },
      { status: 500 },
    );
  }
}
