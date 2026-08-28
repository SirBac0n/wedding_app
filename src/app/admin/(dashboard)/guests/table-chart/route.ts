import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { toCsvRow } from "@/lib/csv";

// Table/seating chart export for the venue/caterer (REQUIREMENTS.md section
// 4.6): one row per household, table number + guest names, sorted by table
// so it reads like an actual floor plan reference sheet.
export async function GET() {
  await verifySession();

  const households = await prisma.household.findMany({
    include: { guests: { orderBy: { firstName: "asc" } } },
  });

  const sorted = households.sort((a, b) => {
    if (a.tableNumber === b.tableNumber) return a.displayName.localeCompare(b.displayName);
    if (!a.tableNumber) return 1;
    if (!b.tableNumber) return -1;
    return a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true });
  });

  const header = toCsvRow(["Table", "Household", "Guest Names"]);
  const rows = sorted.map((h) =>
    toCsvRow([
      h.tableNumber ?? "Unassigned",
      h.displayName,
      h.guests.map((g) => `${g.firstName} ${g.lastName}`).join("; "),
    ]),
  );

  const csv = [header, ...rows].join("\r\n") + "\r\n";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="table-seating-chart.csv"`,
    },
  });
}
