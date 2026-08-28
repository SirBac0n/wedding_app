"use server";

import * as z from "zod";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/outreach/send";
import { findHouseholdIdsByName, verifyHouseholdByNameAndContact } from "@/lib/household-lookup";

// Public guest-facing RSVP (REQUIREMENTS.md section 4.5). Stricter than
// address collection (4.3): RSVP data (attendance, meal, dietary) is more
// sensitive than a mailing address, so a name match that spans more than one
// household requires a disambiguator — last 4 digits of phone, or full email
// if only email is on file — before anything is revealed. A name match
// within a single household needs no extra step.

async function getRsvpCutoff(): Promise<Date | null> {
  const settings = await prisma.eventSettings.findUnique({ where: { id: 1 } });
  return settings?.rsvpCutoffAt ?? null;
}

export type RsvpSearchState =
  | { ok: true; status: "found"; householdId: string }
  | { ok: true; status: "needs-verification"; name: string }
  | { ok: false; error: string }
  | undefined;

export async function searchRsvp(
  _prevState: RsvpSearchState,
  formData: FormData,
): Promise<RsvpSearchState> {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { ok: false, error: "Enter at least 2 characters of your name." };
  }

  const clientKey = await getClientKey();
  const { allowed } = await checkRateLimit(`rsvp-search:${clientKey}`, {
    limit: 15,
    windowMs: 5 * 60 * 1000,
  });
  if (!allowed) {
    return { ok: false, error: "Too many attempts — please wait a few minutes and try again." };
  }

  const householdIds = await findHouseholdIdsByName(name);

  if (householdIds.length === 0) {
    return { ok: false, error: "We couldn't find that name. Check the spelling, or use the contact link below." };
  }
  if (householdIds.length === 1) {
    return { ok: true, status: "found", householdId: householdIds[0] };
  }
  return { ok: true, status: "needs-verification", name };
}

export async function verifyRsvpIdentity(
  _prevState: RsvpSearchState,
  formData: FormData,
): Promise<RsvpSearchState> {
  const name = String(formData.get("name") ?? "").trim();
  const verify = String(formData.get("verify") ?? "").trim();

  if (!verify) {
    return { ok: false, error: "Enter your email or phone number to continue." };
  }

  const clientKey = await getClientKey();
  const { allowed } = await checkRateLimit(`rsvp-verify:${clientKey}`, {
    limit: 10,
    windowMs: 5 * 60 * 1000,
  });
  if (!allowed) {
    return { ok: false, error: "Too many attempts — please wait a few minutes and try again." };
  }

  const householdId = await verifyHouseholdByNameAndContact(name, verify);
  if (!householdId) {
    return {
      ok: false,
      error: "That didn't match our records. Please check it and try again, or use the contact link below.",
    };
  }

  return { ok: true, status: "found", householdId };
}

export type RsvpQuestionAnswer = {
  id: string;
  label: string;
  type: "TEXT" | "YES_NO";
  value: string | null;
};

export type RsvpGuest = {
  id: string;
  firstName: string;
  lastName: string;
  attending: boolean | null;
  mealChoice: string | null;
  dietaryNotes: string | null;
  questions: RsvpQuestionAnswer[];
};

export type RsvpHouseholdData = {
  displayName: string;
  email: string | null;
  notes: string | null;
  songRequest: string | null;
  guests: RsvpGuest[];
  rsvpOpen: boolean;
  cutoffDate: string | null;
  mealOptions: string[];
  showSongRequest: boolean;
  showDietaryNotes: boolean;
  householdQuestions: RsvpQuestionAnswer[];
};

export async function getRsvpHouseholdData(householdId: string): Promise<RsvpHouseholdData | null> {
  const [household, cutoff, settings, mealOptions, guestQuestions, householdQuestions] = await Promise.all([
    prisma.household.findUnique({
      where: { id: householdId },
      select: {
        displayName: true,
        email: true,
        notes: true,
        songRequest: true,
        guests: {
          orderBy: { firstName: "asc" },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            attending: true,
            mealChoice: true,
            dietaryNotes: true,
            rsvpAnswers: { select: { questionId: true, value: true } },
          },
        },
        rsvpAnswers: { select: { questionId: true, value: true } },
      },
    }),
    getRsvpCutoff(),
    prisma.eventSettings.findUnique({ where: { id: 1 } }),
    prisma.mealOption.findMany({ orderBy: { sortOrder: "asc" }, select: { label: true } }),
    prisma.rsvpQuestion.findMany({
      where: { scope: "GUEST", active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.rsvpQuestion.findMany({
      where: { scope: "HOUSEHOLD", active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!household) return null;

  const rsvpOpen = !cutoff || cutoff.getTime() > Date.now();

  return {
    displayName: household.displayName,
    email: household.email,
    notes: household.notes,
    songRequest: household.songRequest,
    rsvpOpen,
    cutoffDate: cutoff ? cutoff.toISOString() : null,
    mealOptions: mealOptions.map((m) => m.label),
    showSongRequest: settings?.rsvpShowSongRequest ?? true,
    showDietaryNotes: settings?.rsvpShowDietaryNotes ?? true,
    householdQuestions: householdQuestions.map((q) => ({
      id: q.id,
      label: q.label,
      type: q.type,
      value: household.rsvpAnswers.find((a) => a.questionId === q.id)?.value ?? null,
    })),
    guests: household.guests.map((g) => ({
      id: g.id,
      firstName: g.firstName,
      lastName: g.lastName,
      attending: g.attending,
      mealChoice: g.mealChoice,
      dietaryNotes: g.dietaryNotes,
      questions: guestQuestions.map((q) => ({
        id: q.id,
        label: q.label,
        type: q.type,
        value: g.rsvpAnswers.find((a) => a.questionId === q.id)?.value ?? null,
      })),
    })),
  };
}

async function assertRsvpOpen(): Promise<string | null> {
  const cutoff = await getRsvpCutoff();
  if (cutoff && cutoff.getTime() <= Date.now()) {
    return "RSVPs have closed. Please use the contact link below if you need to make a change.";
  }
  return null;
}

async function saveQuestionAnswers(
  formData: FormData,
  scope: "GUEST" | "HOUSEHOLD",
  target: { guestId?: string; householdId?: string },
) {
  const questions = await prisma.rsvpQuestion.findMany({ where: { scope, active: true } });
  for (const q of questions) {
    const raw = formData.get(`q_${q.id}`);
    if (raw === null) continue;
    const value = String(raw).trim();
    if (!value) continue;

    if (target.guestId) {
      await prisma.rsvpAnswer.upsert({
        where: { questionId_guestId: { questionId: q.id, guestId: target.guestId } },
        create: { questionId: q.id, guestId: target.guestId, value },
        update: { value },
      });
    } else if (target.householdId) {
      await prisma.rsvpAnswer.upsert({
        where: { questionId_householdId: { questionId: q.id, householdId: target.householdId } },
        create: { questionId: q.id, householdId: target.householdId, value },
        update: { value },
      });
    }
  }
}

const GuestRsvpSchema = z.object({
  attending: z.enum(["yes", "no"]),
  mealChoice: z.string().trim().optional().or(z.literal("")),
  dietaryNotes: z.string().trim().optional().or(z.literal("")),
});

export type SaveGuestRsvpState = { ok: true } | { ok: false; error: string } | undefined;

export async function saveGuestRsvp(
  householdId: string,
  guestId: string,
  _prevState: SaveGuestRsvpState,
  formData: FormData,
): Promise<SaveGuestRsvpState> {
  const clientKey = await getClientKey();
  const { allowed } = await checkRateLimit(`rsvp-save:${clientKey}`, {
    limit: 40,
    windowMs: 5 * 60 * 1000,
  });
  if (!allowed) {
    return { ok: false, error: "Too many attempts — please wait a few minutes and try again." };
  }

  const closedMessage = await assertRsvpOpen();
  if (closedMessage) {
    return { ok: false, error: closedMessage };
  }

  const guest = await prisma.guest.findUnique({ where: { id: guestId }, select: { householdId: true } });
  if (!guest || guest.householdId !== householdId) {
    return { ok: false, error: "We couldn't find that guest. Please search again." };
  }

  const parsed = GuestRsvpSchema.safeParse({
    attending: formData.get("attending"),
    mealChoice: formData.get("mealChoice"),
    dietaryNotes: formData.get("dietaryNotes"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please select whether this guest is attending." };
  }

  const attending = parsed.data.attending === "yes";
  const updated = await prisma.guest.update({
    where: { id: guestId },
    data: {
      attending,
      mealChoice: attending ? parsed.data.mealChoice || null : null,
      dietaryNotes: attending ? parsed.data.dietaryNotes || null : null,
    },
  });

  await saveQuestionAnswers(formData, "GUEST", { guestId });

  await prisma.rsvpAuditLog.create({
    data: {
      householdId,
      source: "GUEST",
      summary: `Guest RSVP: ${updated.firstName} ${updated.lastName} — ${attending ? "attending" : "not attending"}`,
    },
  });

  return { ok: true };
}

const HouseholdRsvpSchema = z.object({
  notes: z.string().trim().optional().or(z.literal("")),
  songRequest: z.string().trim().optional().or(z.literal("")),
});

export type SaveHouseholdRsvpState = { ok: true } | { ok: false; error: string } | undefined;

export async function saveHouseholdRsvpDetails(
  householdId: string,
  _prevState: SaveHouseholdRsvpState,
  formData: FormData,
): Promise<SaveHouseholdRsvpState> {
  const closedMessage = await assertRsvpOpen();
  if (closedMessage) {
    return { ok: false, error: closedMessage };
  }

  const parsed = HouseholdRsvpSchema.safeParse({
    notes: formData.get("notes"),
    songRequest: formData.get("songRequest"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check your entries." };
  }

  await prisma.household.update({
    where: { id: householdId },
    data: {
      notes: parsed.data.notes || null,
      songRequest: parsed.data.songRequest || null,
    },
  });

  await saveQuestionAnswers(formData, "HOUSEHOLD", { householdId });

  await prisma.rsvpAuditLog.create({
    data: { householdId, source: "GUEST", summary: "Guest updated household notes/song request" },
  });

  return { ok: true };
}

export async function sendRsvpConfirmationEmail(householdId: string): Promise<{ ok: boolean; error?: string }> {
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: {
      displayName: true,
      email: true,
      guests: { select: { firstName: true, lastName: true, attending: true, mealChoice: true } },
    },
  });
  if (!household) return { ok: false, error: "Household not found." };
  if (!household.email) return { ok: false, error: "No email on file to send a confirmation to." };

  const lines = household.guests.map((g) => {
    if (g.attending === null) return `- ${g.firstName} ${g.lastName}: no response yet`;
    if (!g.attending) return `- ${g.firstName} ${g.lastName}: not attending`;
    return `- ${g.firstName} ${g.lastName}: attending${g.mealChoice ? ` (${g.mealChoice})` : ""}`;
  });

  const body = `Hi ${household.displayName},\n\nHere's your current RSVP:\n\n${lines.join("\n")}\n\nYou can update this anytime before the RSVP deadline by searching your name again.\n\nThanks!`;

  const result = await sendEmail(household.email, "Your RSVP confirmation", body);
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
