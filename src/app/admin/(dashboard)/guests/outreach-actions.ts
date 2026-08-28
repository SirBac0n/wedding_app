"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { generateToken } from "@/lib/outreach-token";
import { sendEmail, sendSms } from "@/lib/outreach/send";
import type { OutreachPurpose } from "@generated/prisma/enums";

// Guest outreach (REQUIREMENTS.md section 4.4): send a household a
// personalized link to the address-collection form or RSVP form via
// whichever contact method they have on file. Automatic scheduled reminders
// (the 6wk/3wk/3d cadence in section 4.9) need a real cron trigger in
// production and aren't wired up here — these are the manual one-off/bulk
// sends the admin can trigger anytime.

const LINK_EXPIRY_DAYS = 90;

async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}

function buildMessage(purpose: OutreachPurpose, displayName: string, link: string) {
  if (purpose === "RSVP_REMINDER") {
    return {
      subject: "Please RSVP for our wedding!",
      body: `Hi ${displayName},\n\nWe can't wait to celebrate with you! If you haven't already, please let us know if you can make it.\n\n${link}\n\nThanks!`,
    };
  }
  return {
    subject: "We'd love your mailing address!",
    body: `Hi ${displayName},\n\nWe're getting our wedding invitations ready and want to make sure yours goes to the right place. Could you confirm your mailing address here?\n\n${link}\n\nThanks!`,
  };
}

export type SendOutreachResult = { ok: true; channel: "EMAIL" | "SMS" } | { ok: false; error: string };

export async function sendOutreachToHousehold(
  householdId: string,
  purpose: OutreachPurpose = "ADDRESS_COLLECTION",
): Promise<SendOutreachResult> {
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
  const { subject, body } = buildMessage(purpose, household.displayName, link);

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
      purpose,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + LINK_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  revalidatePath("/admin/guests");
  revalidatePath(`/admin/guests/${householdId}`);

  return { ok: true, channel };
}

export type BulkOutreachResult = { sent: number; skipped: number };

// Sends to every household matching the purpose's "still needs this" filter
// that has at least one contact method on file (section 4.4).
export async function sendBulkOutreach(purpose: OutreachPurpose): Promise<BulkOutreachResult> {
  await verifySession();

  const households =
    purpose === "ADDRESS_COLLECTION"
      ? await prisma.household.findMany({
          where: { OR: [{ addressLine1: null }, { city: null }] },
          select: { id: true, email: true, phone: true },
        })
      : await prisma.household.findMany({
          where: { guests: { some: { attending: null } } },
          select: { id: true, email: true, phone: true },
        });

  let sent = 0;
  let skipped = 0;
  for (const h of households) {
    if (!h.email && !h.phone) {
      skipped += 1;
      continue;
    }
    const result = await sendOutreachToHousehold(h.id, purpose);
    if (result.ok) sent += 1;
    else skipped += 1;
  }

  revalidatePath("/admin/guests");
  return { sent, skipped };
}
