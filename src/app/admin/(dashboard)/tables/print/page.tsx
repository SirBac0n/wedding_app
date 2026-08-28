import Link from "next/link";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { PrintButton } from "./print-button";

// Printable seating chart (REQUIREMENTS.md section 4.6): a day-of reference
// — each table heading followed by the individual guests seated there — as
// opposed to /admin/tables/chart, which is a household-per-row CSV meant for
// the caterer/venue rather than for posting or handing to a coordinator.
export default async function TableSeatingChartPrintPage() {
  await verifySession();

  const households = await prisma.household.findMany({
    include: {
      table: true,
      guests: { where: { attending: true }, orderBy: { firstName: "asc" } },
    },
  });

  const attending = households.filter((h) => h.guests.length > 0);

  type SeatEntry = { id: string; name: string };
  type TableGroup = { id: string; label: string; sortOrder: number; guests: SeatEntry[] };

  const byTable = new Map<string, TableGroup>();
  const unassigned: SeatEntry[] = [];

  for (const h of attending) {
    const entries = h.guests.map((g) => ({ id: g.id, name: `${g.firstName} ${g.lastName}` }));
    if (h.table) {
      const bucket = byTable.get(h.table.id) ?? {
        id: h.table.id,
        label: h.table.label,
        sortOrder: h.table.sortOrder,
        guests: [],
      };
      bucket.guests.push(...entries);
      byTable.set(h.table.id, bucket);
    } else {
      unassigned.push(...entries);
    }
  }

  const tables = [...byTable.values()]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((t) => ({ ...t, guests: t.guests.sort((a, b) => a.name.localeCompare(b.name)) }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-semibold">Seating Chart</h1>
          <Link href="/admin/tables" className="text-sm underline">
            Back to Table Assignments
          </Link>
        </div>
        <PrintButton />
      </div>

      <h1 className="hidden text-center text-xl font-semibold print:block">Seating Chart</h1>

      {unassigned.length > 0 && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 print:border-red-500">
          <p className="font-medium">
            {unassigned.length} attending guest{unassigned.length === 1 ? "" : "s"} not yet
            assigned to a table:
          </p>
          <p>{unassigned.map((g) => g.name).join(", ")}</p>
        </div>
      )}

      {tables.length === 0 ? (
        <p className="text-sm text-gray-500 print:hidden">
          No tables have attending guests assigned yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 print:grid-cols-2">
          {tables.map((t) => (
            <div key={t.id} className="break-inside-avoid">
              <h2 className="border-b border-gray-300 pb-1 text-base font-semibold">
                {t.label}
              </h2>
              <ul className="mt-2 text-sm">
                {t.guests.map((g) => (
                  <li key={g.id}>{g.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
