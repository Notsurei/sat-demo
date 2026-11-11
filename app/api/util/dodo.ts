import DodoPayments from "dodopayments";

let _client: DodoPayments | null = null;
let _webhookClient: DodoPayments | null = null;

function getEnvironment(): "live_mode" | "test_mode" {
  return process.env.DODO_ENVIRONMENT === "live_mode"
    ? "live_mode"
    : "test_mode";
}

export function getDodoClient(): DodoPayments {
  if (_client) return _client;

  const apiKey = process.env.DODO_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DODO_API_KEY is missing. Add it to Vercel → Settings → Environment Variables.",
    );
  }

  _client = new DodoPayments({
    bearerToken: apiKey,
    environment: getEnvironment(),
  });

  return _client;
}

export function getDodoWebhookClient(): DodoPayments {
  if (_webhookClient) return _webhookClient;

  const apiKey = process.env.DODO_API_KEY;
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

  if (!apiKey || !webhookSecret) {
    throw new Error(
      "Missing DODO_API_KEY or DODO_WEBHOOK_SECRET. Configure Vercel env vars.",
    );
  }

  _webhookClient = new DodoPayments({
    bearerToken: apiKey,
    environment: getEnvironment(),
    webhookKey: webhookSecret,
  });

  return _webhookClient;
}