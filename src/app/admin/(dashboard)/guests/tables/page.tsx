import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { assignTable } from "./actions";

export default async function TableAssignmentsPage() {
  await verifySession();

  const households = await prisma.household.findMany({
    include: { guests: { orderBy: { firstName: "asc" } } },
    orderBy: { displayName: "asc" },
  });

  // Only attending guests need a seat — non-attending/no-response households
  // are left out of this workflow entirely.
  const attendingHouseholds = households
    .map((h) => ({ ...h, attendingGuests: h.guests.filter((g) => g.attending === true) }))
    .filter((h) => h.attendingGuests.length > 0)
    .sort((a, b) => {
      if (a.tableNumber === b.tableNumber) return a.displayName.localeCompare(b.displayName);
      if (!a.tableNumber) return 1;
      if (!b.tableNumber) return -1;
      return a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true });
    });

  const totalGuests = attendingHouseholds.reduce((n, h) => n + h.attendingGuests.length, 0);
  const unassignedCount = attendingHouseholds.filter((h) => !h.tableNumber).length;

  const tableCounts = new Map<string, number>();
  for (const h of attendingHouseholds) {
    if (!h.tableNumber) continue;
    tableCounts.set(h.tableNumber, (tableCounts.get(h.tableNumber) ?? 0) + h.attendingGuests.length);
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Table Assignments</h1>
        <p className="text-sm text-gray-500">
          {totalGuests} attending guest{totalGuests === 1 ? "" : "s"} across{" "}
          {attendingHouseholds.length} household{attendingHouseholds.length === 1 ? "" : "s"}
          {unassignedCount > 0 && ` · ${unassignedCount} unassigned`}
        </p>
      </div>

      {tableCounts.size > 0 && (
        <div className="rounded border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-gray-700">Guests per table</h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
            {Array.from(tableCounts.entries())
              .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
              .map(([table, count]) => (
                <li key={table}>
                  Table {table}: {count}
                </li>
              ))}
          </ul>
        </div>
      )}

      {attendingHouseholds.length === 0 ? (
        <p className="text-sm text-gray-400">
          No attending guests yet — this fills in as RSVPs come in.
        </p>
      ) : (
        <div className="rounded border border-gray-200 bg-white">
          {attendingHouseholds.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 last:border-0"
            >
              <div>
                <div className="font-medium">{h.displayName}</div>
                <div className="text-sm text-gray-500">
                  {h.attendingGuests.map((g) => `${g.firstName} ${g.lastName}`).join(", ")}
                </div>
              </div>
              <form action={assignTable.bind(null, h.id)} className="flex items-center gap-2">
                <input
                  name="tableNumber"
                  defaultValue={h.tableNumber ?? ""}
                  placeholder="Table #"
                  className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                />
                <button type="submit" className="rounded bg-gray-100 px-3 py-1 text-sm">
                  Save
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
