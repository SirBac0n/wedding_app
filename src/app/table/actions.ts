"use server";

import { prisma } from "@/lib/db";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { findHouseholdIdsByName, verifyHouseholdByNameAndContact } from "@/lib/household-lookup";

// Public table/seating lookup (REQUIREMENTS.md section 4.6). Reuses the same
// name + disambiguator flow as RSVP (4.5) rather than inventing a second
// pattern for guests to learn.

export type TableSearchState =
  | { ok: true; status: "found"; householdId: string }
  | { ok: true; status: "needs-verification"; name: string }
  | { ok: false; error: string }
  | undefined;

export async function searchTable(
  _prevState: TableSearchState,
  formData: FormData,
): Promise<TableSearchState> {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { ok: false, error: "Enter at least 2 characters of your name." };
  }

  const clientKey = await getClientKey();
  const { allowed } = await checkRateLimit(`table-search:${clientKey}`, {
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

export async function verifyTableIdentity(
  _prevState: TableSearchState,
  formData: FormData,
): Promise<TableSearchState> {
  const name = String(formData.get("name") ?? "").trim();
  const verify = String(formData.get("verify") ?? "").trim();

  if (!verify) {
    return { ok: false, error: "Enter your email or phone number to continue." };
  }

  const clientKey = await getClientKey();
  const { allowed } = await checkRateLimit(`table-verify:${clientKey}`, {
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

export type TableResult = {
  displayName: string;
  tableNumber: string | null;
  guestNames: string[];
};

export async function getTableAssignment(householdId: string): Promise<TableResult | null> {
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: {
      displayName: true,
      tableNumber: true,
      guests: { orderBy: { firstName: "asc" }, select: { firstName: true, lastName: true } },
    },
  });
  if (!household) return null;

  return {
    displayName: household.displayName,
    tableNumber: household.tableNumber,
    guestNames: household.guests.map((g) => `${g.firstName} ${g.lastName}`),
  };
}

export async function isTableLookupEnabled(): Promise<boolean> {
  const settings = await prisma.eventSettings.findUnique({ where: { id: 1 } });
  return settings?.tableLookupEnabled ?? false;
}
