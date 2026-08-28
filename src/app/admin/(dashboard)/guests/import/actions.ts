"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { parseGuestCsv, type ParseGuestCsvResult } from "@/lib/csv-import";

export type { ParsedGuestRow, ParsedHouseholdGroup } from "@/lib/csv-import";
export type ParseCsvState = ParseGuestCsvResult | undefined;

export async function parseImportCsv(
  _prevState: ParseCsvState,
  formData: FormData,
): Promise<ParseCsvState> {
  await verifySession();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a CSV file to upload." };
  }

  const text = await file.text();
  return parseGuestCsv(text);
}

const GroupSchema = z.object({
  displayName: z.string().min(1),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postalCode: z.string().nullable(),
  country: z.string().nullable(),
  notes: z.string().nullable(),
  guests: z
    .array(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        alias: z.string().nullable(),
        relationshipSide: z.string().nullable(),
        isChild: z.boolean(),
      }),
    )
    .min(1),
});
const GroupsSchema = z.array(GroupSchema);

export async function commitImport(formData: FormData) {
  await verifySession();

  const raw = formData.get("groups");
  if (typeof raw !== "string") {
    throw new Error("Missing import data");
  }

  const groups = GroupsSchema.parse(JSON.parse(raw));

  await prisma.$transaction(
    groups.map((group) =>
      prisma.household.create({
        data: {
          displayName: group.displayName,
          email: group.email,
          phone: group.phone,
          addressLine1: group.addressLine1,
          addressLine2: group.addressLine2,
          city: group.city,
          state: group.state,
          postalCode: group.postalCode,
          country: group.country,
          notes: group.notes,
          guests: { create: group.guests },
        },
      }),
    ),
  );

  revalidatePath("/admin/guests");
  redirect("/admin/guests");
}
