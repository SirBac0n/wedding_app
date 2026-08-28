// Shared between the admin platform-picker (client) and the cash-fund
// server actions — the admin types just a handle/cashtag/contact, this
// builds the full paymentLink stored on CashFund. Kept dependency-free so
// it's safe to import from a client component.

export type PaymentPlatform = "VENMO" | "PAYPAL" | "CASHAPP" | "ZELLE" | "OTHER";

export const PAYMENT_PLATFORMS: PaymentPlatform[] = [
  "VENMO",
  "PAYPAL",
  "CASHAPP",
  "ZELLE",
  "OTHER",
];

export const PAYMENT_PLATFORM_LABELS: Record<PaymentPlatform, string> = {
  VENMO: "Venmo",
  PAYPAL: "PayPal",
  CASHAPP: "Cash App",
  ZELLE: "Zelle",
  OTHER: "Other",
};

// Zelle has no public/shareable payment link — it's bank-app-to-bank-app —
// so a ZELLE fund's paymentLink is contact info (email/phone) rather than a
// URL, and the public registry page renders it as text instead of a button.
export function isLinkPlatform(platform: PaymentPlatform): boolean {
  return platform !== "ZELLE";
}

export const PAYMENT_PLATFORM_META: Record<
  PaymentPlatform,
  { fieldLabel: string; prefix?: string; placeholder: string; hint?: string }
> = {
  VENMO: { fieldLabel: "Venmo username", prefix: "venmo.com/u/", placeholder: "yourname" },
  PAYPAL: { fieldLabel: "PayPal.me username", prefix: "paypal.me/", placeholder: "yourname" },
  CASHAPP: { fieldLabel: "Cash App $cashtag", prefix: "cash.app/$", placeholder: "yourname" },
  ZELLE: {
    fieldLabel: "Zelle email or phone",
    placeholder: "you@example.com",
    hint: "Zelle has no public payment link — guests send directly to this email/phone from their own bank app.",
  },
  OTHER: { fieldLabel: "Payment link", placeholder: "https://…" },
};

export function buildPaymentLink(platform: PaymentPlatform, input: string): string {
  const trimmed = input.trim();
  switch (platform) {
    case "VENMO":
      return `https://venmo.com/u/${trimmed.replace(/^@/, "")}`;
    case "PAYPAL":
      return `https://paypal.me/${trimmed.replace(/^@/, "")}`;
    case "CASHAPP":
      return `https://cash.app/$${trimmed.replace(/^\$/, "")}`;
    case "ZELLE":
      return trimmed;
    case "OTHER":
      return trimmed && !/^https?:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed;
  }
}

// Best-effort reverse of buildPaymentLink, for prefilling the handle field
// when editing an existing fund. Falls back to the raw stored value if it
// doesn't match the expected shape (e.g. a link entered before this picker
// existed) rather than losing data.
export function extractPaymentHandle(platform: PaymentPlatform, storedLink: string): string {
  switch (platform) {
    case "VENMO":
      return storedLink.replace(/^https?:\/\/(www\.)?venmo\.com\/u\//i, "");
    case "PAYPAL":
      return storedLink.replace(/^https?:\/\/(www\.)?paypal\.me\//i, "");
    case "CASHAPP":
      return storedLink.replace(/^https?:\/\/(www\.)?cash\.app\/\$?/i, "");
    case "ZELLE":
    case "OTHER":
      return storedLink;
  }
}
