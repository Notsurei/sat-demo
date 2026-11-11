import { NextRequest, NextResponse } from "next/server";
import DodoPayments from "dodopayments";

// ✅ Lazy init — chỉ tạo client khi có request
function getDodoClient(): DodoPayments {
  const apiKey = process.env.DODO_API_KEY;

  if (!apiKey) {
    throw new Error(
      "DODO_API_KEY is missing. Add it to .env.local (dev) hoặc Vercel → Settings → Environment Variables (prod).",
    );
  }

  const environment =
    process.env.DODO_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";

  return new DodoPayments({
    bearerToken: apiKey,
    environment,
  });
}

function getProductMap(): Record<string, string | undefined> {
  return {
    BASIC: process.env.DODO_BASIC_PRICE_ID,
    PREMIUM: process.env.DODO_PREMIUM_PRICE_ID,
    VIP: process.env.DODO_VIP_PRICE_ID,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { userId, email, plan } = await req.json();

    const normalizedPlan = String(plan ?? "").toUpperCase();
    const productMap = getProductMap();
    const productId = productMap[normalizedPlan];

    if (!userId || !email || !productId) {
      return NextResponse.json(
        { error: "Invalid user, email, or subscription plan" },
        { status: 400 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // ✅ Chỉ khởi tạo SDK tại đây
    const dodo = getDodoClient();

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

    // ✅ Trả message rõ ràng nếu thiếu env
    const message =
      error instanceof Error && error.message.includes("DODO_API_KEY")
        ? error.message
        : "Unable to create checkout session";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}