"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";

function revalidateAll() {
  revalidatePath("/admin/tables");
  revalidatePath("/admin/guests");
}

export async function createTable(label: string, capacity: number | null) {
  await verifySession();
  if (!label.trim()) return null;

  const count = await prisma.table.count();
  const table = await prisma.table.create({
    data: { label: label.trim(), capacity, sortOrder: count },
  });

  revalidateAll();
  return { id: table.id, label: table.label, capacity: table.capacity };
}

export async function deleteTable(tableId: string) {
  await verifySession();
  // onDelete: SetNull on Household.tableId — households here go back to
  // Unassigned automatically, nothing to reassign manually first.
  await prisma.table.delete({ where: { id: tableId } });
  revalidateAll();
}

export async function assignHouseholdToTable(householdId: string, tableId: string | null) {
  await verifySession();
  await prisma.household.update({
    where: { id: householdId },
    data: { tableId },
  });
  revalidateAll();
}
