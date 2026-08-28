import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { TableBoard } from "./table-board";

export default async function TablesPage() {
  await verifySession();

  const [tables, households] = await Promise.all([
    prisma.table.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.household.findMany({
      include: { guests: { orderBy: { firstName: "asc" } } },
      orderBy: { displayName: "asc" },
    }),
  ]);

  // Only attending guests need a seat — households with nobody attending
  // (yet) don't clutter the board.
  const attendingHouseholds = households
    .map((h) => ({
      id: h.id,
      displayName: h.displayName,
      tableId: h.tableId,
      attendingGuests: h.guests.filter((g) => g.attending === true),
    }))
    .filter((h) => h.attendingGuests.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Table Assignments</h1>
          <p className="text-sm text-gray-500">
            Drag a household onto a table. Only attending guests are shown.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/tables/print" className="rounded border border-gray-300 px-3 py-2 text-sm">
            Print Seating Chart
          </Link>
          {/* Plain <a>, not <Link>: file download, not a page navigation. */}
          <a href="/admin/tables/chart" className="rounded border border-gray-300 px-3 py-2 text-sm">
            Export Chart (CSV)
          </a>
        </div>
      </div>

      <TableBoard
        initialTables={tables.map((t) => ({
          id: t.id,
          label: t.label,
          capacity: t.capacity,
        }))}
        households={attendingHouseholds.map((h) => ({
          id: h.id,
          displayName: h.displayName,
          tableId: h.tableId,
          guestNames: h.attendingGuests.map((g) => `${g.firstName} ${g.lastName}`),
        }))}
      />
    </div>
  );
}
