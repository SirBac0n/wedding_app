import Link from "next/link";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";

export default async function GuestsPage() {
  await verifySession();

  const households = await prisma.household.findMany({
    orderBy: { displayName: "asc" },
    include: { guests: { orderBy: { firstName: "asc" } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Guest List</h1>
        <div className="flex items-center gap-2">
          <a
            href="/admin/guests/export"
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >
            Export CSV
          </a>
          <Link
            href="/admin/guests/import"
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >
            Import CSV
          </Link>
          <Link
            href="/admin/guests/labels"
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >
            Print Labels
          </Link>
          <Link
            href="/admin/guests/new"
            className="rounded bg-gray-900 px-3 py-2 text-sm text-white"
          >
            + Add Household
          </Link>
        </div>
      </div>

      {households.length === 0 ? (
        <p className="text-gray-500">
          No households yet. Add your first one to get started.
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-2">Household</th>
                <th className="px-4 py-2">Guests</th>
                <th className="px-4 py-2">Contact</th>
                <th className="px-4 py-2">Address</th>
                <th className="px-4 py-2">Thank-you sent</th>
              </tr>
            </thead>
            <tbody>
              {households.map((h) => {
                const hasAddress = h.addressLine1 && h.city;
                return (
                  <tr key={h.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-2">
                      <Link
                        href={`/admin/guests/${h.id}`}
                        className="font-medium text-gray-900 underline"
                      >
                        {h.displayName}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {h.guests.length === 0
                        ? "—"
                        : h.guests
                            .map((g) => `${g.firstName} ${g.lastName}`)
                            .join(", ")}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {h.email || h.phone || "—"}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {hasAddress ? `${h.city}, ${h.state ?? ""}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {h.thankYouSent ? "Yes" : "No"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
