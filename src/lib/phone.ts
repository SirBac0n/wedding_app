// Normalizes phone numbers to E.164-ish format so last-4-digit disambiguation
// (REQUIREMENTS.md section 4.5) doesn't silently break on formatting
// differences ("(555) 123-4567" vs "555-123-4567" vs "+15551234567").
//
// This is a pragmatic normalizer, not a full E.164 validator — it assumes US/
// Canada numbers by default (10 digits -> +1XXXXXXXXXX) since that covers the
// vast majority of a US wedding guest list, and passes through anything that
// already looks like a full international number. Swap in a library like
// libphonenumber-js if international guests turn out to be common.
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return null;

  if (digits.startsWith("+")) {
    const rest = digits.slice(1).replace(/\D/g, "");
    return rest.length >= 7 ? `+${rest}` : null;
  }

  const numeric = digits.replace(/\D/g, "");
  if (numeric.length === 10) {
    return `+1${numeric}`;
  }
  if (numeric.length === 11 && numeric.startsWith("1")) {
    return `+${numeric}`;
  }
  if (numeric.length >= 7) {
    // Unrecognized country format — keep the digits so it's still usable for
    // last-4 matching, just without a country code prefix.
    return numeric;
  }
  return null;
}

export function lastFourDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-4);
}
