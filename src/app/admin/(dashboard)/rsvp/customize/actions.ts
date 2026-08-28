"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireFullAdmin } from "@/lib/dal";

// RSVP form customization (Full Admin only, per user decision): meal
// options, custom questions, and field show/hide toggles.

function revalidateAll() {
  revalidatePath("/admin/rsvp/customize");
  revalidatePath("/rsvp");
}

export async function addMealOption(formData: FormData) {
  await requireFullAdmin();

  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;

  const count = await prisma.mealOption.count();
  await prisma.mealOption.create({ data: { label, sortOrder: count } });

  revalidateAll();
}

export async function deleteMealOption(id: string) {
  await requireFullAdmin();
  await prisma.mealOption.delete({ where: { id } });
  revalidateAll();
}

const QuestionSchema = z.object({
  label: z.string().trim().min(1, { error: "Required" }),
  type: z.enum(["TEXT", "YES_NO"]),
  scope: z.enum(["GUEST", "HOUSEHOLD"]),
});

export async function addRsvpQuestion(formData: FormData) {
  await requireFullAdmin();

  const parsed = QuestionSchema.safeParse({
    label: formData.get("label"),
    type: formData.get("type"),
    scope: formData.get("scope"),
  });
  if (!parsed.success) return;

  const count = await prisma.rsvpQuestion.count();
  await prisma.rsvpQuestion.create({
    data: { ...parsed.data, sortOrder: count },
  });

  revalidateAll();
}

export async function deleteRsvpQuestion(id: string) {
  await requireFullAdmin();
  await prisma.rsvpQuestion.delete({ where: { id } });
  revalidateAll();
}

export async function setRsvpQuestionActive(id: string, formData: FormData) {
  await requireFullAdmin();
  const active = formData.get("active") === "on";
  await prisma.rsvpQuestion.update({ where: { id }, data: { active } });
  revalidateAll();
}

export async function updateRsvpFieldToggles(formData: FormData) {
  await requireFullAdmin();

  await prisma.eventSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      rsvpShowSongRequest: formData.get("showSongRequest") === "on",
      rsvpShowDietaryNotes: formData.get("showDietaryNotes") === "on",
    },
    update: {
      rsvpShowSongRequest: formData.get("showSongRequest") === "on",
      rsvpShowDietaryNotes: formData.get("showDietaryNotes") === "on",
    },
  });

  revalidateAll();
}
