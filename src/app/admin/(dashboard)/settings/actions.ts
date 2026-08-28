"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireFullAdmin } from "@/lib/dal";

const SettingsSchema = z.object({
  weddingDate: z.string().optional().or(z.literal("")),
  timezone: z.string().trim().min(1, { error: "Required" }),
  rsvpCutoffAt: z.string().optional().or(z.literal("")),
  contactEmail: z.email().trim().optional().or(z.literal("")),
});

export async function updateSettings(formData: FormData) {
  await requireFullAdmin();

  const parsed = SettingsSchema.parse({
    weddingDate: formData.get("weddingDate"),
    timezone: formData.get("timezone"),
    rsvpCutoffAt: formData.get("rsvpCutoffAt"),
    contactEmail: formData.get("contactEmail"),
  });

  await prisma.eventSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      weddingDate: parsed.weddingDate ? new Date(parsed.weddingDate) : null,
      timezone: parsed.timezone,
      rsvpCutoffAt: parsed.rsvpCutoffAt ? new Date(parsed.rsvpCutoffAt) : null,
      contactEmail: parsed.contactEmail || null,
    },
    update: {
      weddingDate: parsed.weddingDate ? new Date(parsed.weddingDate) : null,
      timezone: parsed.timezone,
      rsvpCutoffAt: parsed.rsvpCutoffAt ? new Date(parsed.rsvpCutoffAt) : null,
      contactEmail: parsed.contactEmail || null,
    },
  });

  revalidatePath("/admin/settings");
}
