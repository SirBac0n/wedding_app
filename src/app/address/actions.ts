"use server";

import * as z from "zod";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

// Public guest-facing address collection (REQUIREMENTS.md section 4.3).
// Deliberately minimal-disclosure: search only ever returns the matched
// guest's own name + side, never the rest of their household or a browsable
// list — see the trade-off note in section 4.5 that this design leans on.
//
// Household-scoped throughout (not guest-scoped): the address itself belongs
// to the household, and a personalized outreach link (section 4.4) already
// knows the household directly without a name search — a single model keeps
// the search-confirmed and link-confirmed paths consistent.

export type GuestMatch = {
  guestId: string;
  householdId: string;
  firstName: string;
  lastName: string;
  relationshipSide: string | null;
};

export type SearchState =
  | { ok: true; matches: GuestMatch[] }
  | { ok: false; error: string }
  | undefined;

export async function searchGuests(
  _prevState: SearchState,
  formData: FormData,
): Promise<SearchState> {
  const query = String(formData.get("query") ?? "").trim();

  if (query.length < 2) {
    return { ok: false, error: "Enter at least 2 characters of your name." };
  }

  const clientKey = await getClientKey();
  const { allowed } = await checkRateLimit(`address-search:${clientKey}`, {
    limit: 15,
    windowMs: 5 * 60 * 1000,
  });
  if (!allowed) {
    return {
      ok: false,
      error: "Too many attempts — please wait a few minutes and try again.",
    };
  }

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);

  // Fetched and matched in application code (not a DB `contains`/`mode`
  // filter) so behavior is identical on SQLite (dev) and Postgres (prod)
  // without provider-specific query branches. Guest-list scale here (a few
  // hundred rows) makes this cheap.
  const guests = await prisma.guest.findMany({
    select: {
      id: true,
      householdId: true,
      firstName: true,
      lastName: true,
      alias: true,
      relationshipSide: true,
    },
  });

  const matches = guests
    .filter((g) => {
      const haystack = `${g.firstName} ${g.lastName} ${g.alias ?? ""}`.toLowerCase();
      return words.every((w) => haystack.includes(w));
    })
    .slice(0, 5)
    .map((g) => ({
      guestId: g.id,
      householdId: g.householdId,
      firstName: g.firstName,
      lastName: g.lastName,
      relationshipSide: g.relationshipSide,
    }));

  return { ok: true, matches };
}

export type HouseholdInfo = {
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

// Lets a returning guest see their previously submitted info pre-filled
// rather than a blank form (section 4.3: "guests can return and edit").
// Gated behind a confirmed householdId from a real search match or a
// personalized outreach link, not a separately guessable endpoint.
export async function getHouseholdInfo(householdId: string): Promise<HouseholdInfo | null> {
  return prisma.household.findUnique({
    where: { id: householdId },
    select: {
      email: true,
      phone: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
    },
  });
}

const AddressSchema = z
  .object({
    email: z.email().trim().optional().or(z.literal("")),
    phone: z.string().trim().optional().or(z.literal("")),
    addressLine1: z.string().trim().min(1, { error: "Required" }),
    addressLine2: z.string().trim().optional().or(z.literal("")),
    city: z.string().trim().min(1, { error: "Required" }),
    state: z.string().trim().optional().or(z.literal("")),
    postalCode: z.string().trim().optional().or(z.literal("")),
    country: z.string().trim().optional().or(z.literal("")),
  })
  .refine((data) => data.email || data.phone, {
    error: "Enter an email or phone number (at least one is required).",
    path: ["email"],
  });

export type SubmitAddressState =
  | { ok: true }
  | { ok: false; error: string }
  | undefined;

export async function submitAddress(
  householdId: string,
  _prevState: SubmitAddressState,
  formData: FormData,
): Promise<SubmitAddressState> {
  const clientKey = await getClientKey();
  const { allowed } = await checkRateLimit(`address-submit:${clientKey}`, {
    limit: 20,
    windowMs: 5 * 60 * 1000,
  });
  if (!allowed) {
    return {
      ok: false,
      error: "Too many attempts — please wait a few minutes and try again.",
    };
  }

  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: { id: true },
  });
  if (!household) {
    return { ok: false, error: "We couldn't find that invitation. Please search again." };
  }

  const parsed = AddressSchema.safeParse({
    email: formData.get("email"),
    phone: formData.get("phone"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your entries." };
  }

  const { email, phone, addressLine1, addressLine2, city, state, postalCode, country } =
    parsed.data;

  await prisma.household.update({
    where: { id: household.id },
    data: {
      email: email || undefined,
      phone: phone ? (normalizePhone(phone) ?? undefined) : undefined,
      addressLine1,
      addressLine2: addressLine2 || null,
      city,
      state: state || null,
      postalCode: postalCode || null,
      country: country || null,
    },
  });

  return { ok: true };
}
