"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireFullAdmin } from "@/lib/dal";

// FormData.get() returns null (not undefined) for a missing field. Zod's
// .optional() only accepts undefined, so every read needs this coalesce.
function fd(formData: FormData, name: string) {
  return formData.get(name) ?? undefined;
}

function emptyToNull(v: string | undefined) {
  return v && v.length > 0 ? v : null;
}

function revalidateSchedule() {
  revalidatePath("/admin/schedule");
  revalidatePath("/schedule");
}

const ScheduleItemSchema = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/, { error: "Required" }),
  title: z.string().trim().min(1, { error: "Required" }),
  location: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().optional().or(z.literal("")),
});

export async function createScheduleItem(formData: FormData) {
  await requireFullAdmin();
  const parsed = ScheduleItemSchema.parse({
    time: fd(formData, "time"),
    title: fd(formData, "title"),
    location: fd(formData, "location"),
    description: fd(formData, "description"),
  });

  await prisma.scheduleItem.create({
    data: {
      time: parsed.time,
      title: parsed.title,
      location: emptyToNull(parsed.location),
      description: emptyToNull(parsed.description),
    },
  });

  revalidateSchedule();
}

export async function updateScheduleItem(itemId: string, formData: FormData) {
  await requireFullAdmin();
  const parsed = ScheduleItemSchema.parse({
    time: fd(formData, "time"),
    title: fd(formData, "title"),
    location: fd(formData, "location"),
    description: fd(formData, "description"),
  });

  await prisma.scheduleItem.update({
    where: { id: itemId },
    data: {
      time: parsed.time,
      title: parsed.title,
      location: emptyToNull(parsed.location),
      description: emptyToNull(parsed.description),
    },
  });

  revalidateSchedule();
}

export async function deleteScheduleItem(itemId: string) {
  await requireFullAdmin();
  await prisma.scheduleItem.delete({ where: { id: itemId } });
  revalidateSchedule();
}
