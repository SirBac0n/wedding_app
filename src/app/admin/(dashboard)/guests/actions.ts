"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { normalizePhone } from "@/lib/phone";

const HouseholdSchema = z.object({
  displayName: z.string().trim().min(1, { error: "Required" }),
  email: z.email().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  addressLine1: z.string().trim().optional().or(z.literal("")),
  addressLine2: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  state: z.string().trim().optional().or(z.literal("")),
  postalCode: z.string().trim().optional().or(z.literal("")),
  country: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  songRequest: z.string().trim().optional().or(z.literal("")),
  tableNumber: z.string().trim().optional().or(z.literal("")),
  thankYouSent: z.string().optional(),
});

function emptyToNull(v: string | undefined) {
  return v && v.length > 0 ? v : null;
}

// FormData.get() returns null (not undefined) for a missing key — notably for
// unchecked checkboxes, which browsers omit from the submission entirely.
// Zod's .optional() only accepts undefined, so every read needs this coalesce.
function fd(formData: FormData, name: string) {
  return formData.get(name) ?? undefined;
}

function householdDataFromForm(formData: FormData) {
  const parsed = HouseholdSchema.parse({
    displayName: fd(formData, "displayName"),
    email: fd(formData, "email"),
    phone: fd(formData, "phone"),
    addressLine1: fd(formData, "addressLine1"),
    addressLine2: fd(formData, "addressLine2"),
    city: fd(formData, "city"),
    state: fd(formData, "state"),
    postalCode: fd(formData, "postalCode"),
    country: fd(formData, "country"),
    notes: fd(formData, "notes"),
    songRequest: fd(formData, "songRequest"),
    tableNumber: fd(formData, "tableNumber"),
    thankYouSent: fd(formData, "thankYouSent"),
  });

  const normalizedPhone = parsed.phone
    ? normalizePhone(parsed.phone)
    : null;

  return {
    displayName: parsed.displayName,
    email: emptyToNull(parsed.email),
    phone: normalizedPhone,
    addressLine1: emptyToNull(parsed.addressLine1),
    addressLine2: emptyToNull(parsed.addressLine2),
    city: emptyToNull(parsed.city),
    state: emptyToNull(parsed.state),
    postalCode: emptyToNull(parsed.postalCode),
    country: emptyToNull(parsed.country),
    notes: emptyToNull(parsed.notes),
    songRequest: emptyToNull(parsed.songRequest),
    tableNumber: emptyToNull(parsed.tableNumber),
    thankYouSent: parsed.thankYouSent === "on",
  };
}

export async function createHousehold(formData: FormData) {
  await verifySession();

  const data = householdDataFromForm(formData);
  const household = await prisma.household.create({ data });

  revalidatePath("/admin/guests");
  redirect(`/admin/guests/${household.id}`);
}

export async function updateHousehold(householdId: string, formData: FormData) {
  await verifySession();

  const data = householdDataFromForm(formData);
  await prisma.household.update({ where: { id: householdId }, data });

  revalidatePath("/admin/guests");
  revalidatePath(`/admin/guests/${householdId}`);
}

export async function deleteHousehold(householdId: string) {
  await verifySession();

  await prisma.household.delete({ where: { id: householdId } });

  revalidatePath("/admin/guests");
  redirect("/admin/guests");
}

const GuestSchema = z.object({
  firstName: z.string().trim().min(1, { error: "Required" }),
  lastName: z.string().trim().min(1, { error: "Required" }),
  alias: z.string().trim().optional().or(z.literal("")),
  relationshipSide: z.string().trim().optional().or(z.literal("")),
  isChild: z.string().optional(),
  attending: z.string().optional(),
  mealChoice: z.string().trim().optional().or(z.literal("")),
  dietaryNotes: z.string().trim().optional().or(z.literal("")),
});

function guestDataFromForm(formData: FormData) {
  const parsed = GuestSchema.parse({
    firstName: fd(formData, "firstName"),
    lastName: fd(formData, "lastName"),
    alias: fd(formData, "alias"),
    relationshipSide: fd(formData, "relationshipSide"),
    isChild: fd(formData, "isChild"),
    attending: fd(formData, "attending"),
    mealChoice: fd(formData, "mealChoice"),
    dietaryNotes: fd(formData, "dietaryNotes"),
  });

  const attending =
    parsed.attending === "yes" ? true : parsed.attending === "no" ? false : null;

  return {
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    alias: emptyToNull(parsed.alias),
    relationshipSide: emptyToNull(parsed.relationshipSide),
    isChild: parsed.isChild === "on",
    attending,
    mealChoice: emptyToNull(parsed.mealChoice),
    dietaryNotes: emptyToNull(parsed.dietaryNotes),
  };
}

export async function addGuest(householdId: string, formData: FormData) {
  const session = await verifySession();

  const data = guestDataFromForm(formData);
  await prisma.guest.create({ data: { ...data, householdId } });

  await prisma.rsvpAuditLog.create({
    data: {
      householdId,
      source: "ADMIN",
      adminId: session.adminId,
      summary: `Admin added guest ${data.firstName} ${data.lastName}`,
    },
  });

  revalidatePath(`/admin/guests/${householdId}`);
}

export async function updateGuest(
  householdId: string,
  guestId: string,
  formData: FormData,
) {
  const session = await verifySession();

  const data = guestDataFromForm(formData);
  await prisma.guest.update({ where: { id: guestId }, data });

  await prisma.rsvpAuditLog.create({
    data: {
      householdId,
      source: "ADMIN",
      adminId: session.adminId,
      summary: `Admin updated guest ${data.firstName} ${data.lastName} (proxy-entry, RSVP/details)`,
    },
  });

  revalidatePath(`/admin/guests/${householdId}`);
}

export async function deleteGuest(householdId: string, guestId: string) {
  await verifySession();

  await prisma.guest.delete({ where: { id: guestId } });

  revalidatePath(`/admin/guests/${householdId}`);
}
