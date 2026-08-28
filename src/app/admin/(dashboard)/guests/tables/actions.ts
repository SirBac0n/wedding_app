"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";

export async function assignTable(householdId: string, formData: FormData) {
  await verifySession();

  const raw = String(formData.get("tableNumber") ?? "").trim();
  await prisma.household.update({
    where: { id: householdId },
    data: { tableNumber: raw || null },
  });

  revalidatePath("/admin/guests/tables");
  revalidatePath("/admin/guests");
  revalidatePath(`/admin/guests/${householdId}`);
}
