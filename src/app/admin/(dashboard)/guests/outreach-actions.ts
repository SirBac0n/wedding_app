"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { generateToken } from "@/lib/outreach-token";
import { sendEmail, sendSms } from "@/lib/outreach/send";

// Guest outreach (REQUIREMENTS.md section 4.4): send a household a
// personalized link to the address-collection form via whichever contact
// method they have on file. RSVP_REMINDER purpose is schema-ready but not
// exposed yet — the RSVP page doesn't exist until milestone 5, so a link to
// it would go nowhere.

const LINK_EXPIRY_DAYS = 90;

async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}

function buildMessage(displayName: string, link: string) {
  const subject = "We'd love your mailing address!";
  const body = `Hi ${displayName},\n\nWe're getting our wedding invitations ready and want to make sure yours goes to the right place. Could you confirm your mailing address here?\n\n${link}\n\nThanks!`;
  return { subject, body };
}

export type SendOutreachResult = { ok: true; channel: "EMAIL" | "SMS" } | { ok: false; error: string };

export async function sendOutreachToHousehold(householdId: string): Promise<SendOutreachResult> {
  await verifySession();

  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: { id: true, displayName: true, email: true, phone: true },
  });
  if (!household) {
    return { ok: false, error: "Household not found." };
  }

  const channel: "EMAIL" | "SMS" | null = household.email ? "EMAIL" : household.phone ? "SMS" : null;
  if (!channel) {
    return { ok: false, error: "No email or phone on file for this household." };
  }

  const { raw, hash } = generateToken();
  const origin = await getOrigin();
  const link = `${origin}/invite/${raw}`;
  const { subject, body } = buildMessage(household.displayName, link);

  const result =
    channel === "EMAIL"
      ? await sendEmail(household.email!, subject, body)
      : await sendSms(household.phone!, body);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  await prisma.outreachMessage.create({
    data: {
      householdId: household.id,
      channel,
      purpose: "ADDRESS_COLLECTION",
      tokenHash: hash,
      expiresAt: new Date(Date.now() + LINK_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  revalidatePath("/admin/guests");
  revalidatePath(`/admin/guests/${householdId}`);

  return { ok: true, channel };
}

export type BulkOutreachResult = { sent: number; skipped: number };

// Sends to every household missing a mailing address that has at least one
// contact method on file (section 4.4: "send an address-collection invite to
// every household missing an address").
export async function sendBulkAddressOutreach(): Promise<BulkOutreachResult> {
  await verifySession();

  const households = await prisma.household.findMany({
    where: { OR: [{ addressLine1: null }, { city: null }] },
    select: { id: true, email: true, phone: true },
  });

  let sent = 0;
  let skipped = 0;
  for (const h of households) {
    if (!h.email && !h.phone) {
      skipped += 1;
      continue;
    }
    const result = await sendOutreachToHousehold(h.id);
    if (result.ok) sent += 1;
    else skipped += 1;
  }

  revalidatePath("/admin/guests");
  return { sent, skipped };
}
