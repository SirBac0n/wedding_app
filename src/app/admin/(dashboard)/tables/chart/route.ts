import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { toCsvRow } from "@/lib/csv";

// Table/seating chart export for the venue/caterer (REQUIREMENTS.md section
// 4.6): one row per household, table + guest names, sorted by table so it
// reads like an actual floor plan reference sheet.
export async function GET() {
  await verifySession();

  const households = await prisma.household.findMany({
    include: {
      table: true,
      guests: { where: { attending: true }, orderBy: { firstName: "asc" } },
    },
  });

  const attending = households.filter((h) => h.guests.length > 0);

  const sorted = attending.sort((a, b) => {
    const aOrder = a.table?.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.table?.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.displayName.localeCompare(b.displayName);
  });

  const header = toCsvRow(["Table", "Household", "Guest Names"]);
  const rows = sorted.map((h) =>
    toCsvRow([
      h.table?.label ?? "Unassigned",
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
