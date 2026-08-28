import Link from "next/link";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { BulkOutreachButton } from "./bulk-outreach-button";

export default async function GuestsPage() {
  await verifySession();

  const households = await prisma.household.findMany({
    orderBy: { displayName: "asc" },
    include: { guests: { orderBy: { firstName: "asc" } } },
  });

  const missingAddressCount = households.filter(
    (h) => (!h.addressLine1 || !h.city) && (h.email || h.phone),
  ).length;
  const missingRsvpCount = households.filter(
    (h) => h.guests.some((g) => g.attending === null) && (h.email || h.phone),
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Guest List</h1>
        <div className="flex items-center gap-2">
          {/* Plain <a>, not <Link>: this is a file download, not a page
              navigation — Link's prefetching would trigger the CSV
              generation route on hover/viewport-enter. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
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
          {/* Plain <a>, not <Link>: this is a file download, not a page
              navigation — see the Export CSV note above. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/admin/guests/table-chart"
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >
            Table Chart
          </a>
          <Link
            href="/admin/guests/new"
            className="rounded bg-gray-900 px-3 py-2 text-sm text-white"
          >
            + Add Household
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <BulkOutreachButton
          purpose="ADDRESS_COLLECTION"
          count={missingAddressCount}
          label={`Invite ${missingAddressCount} Missing Address${missingAddressCount === 1 ? "" : "es"}`}
          confirmLabel={`Send an address-collection invite to ${missingAddressCount} household${missingAddressCount === 1 ? "" : "s"} missing an address?`}
        />
        <BulkOutreachButton
          purpose="RSVP_REMINDER"
          count={missingRsvpCount}
          label={`Remind ${missingRsvpCount} Household${missingRsvpCount === 1 ? "" : "s"} to RSVP`}
          confirmLabel={`Send an RSVP reminder to ${missingRsvpCount} household${missingRsvpCount === 1 ? "" : "s"} with at least one guest who hasn't responded?`}
        />
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
                <th className="px-4 py-2">Table</th>
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
                      {h.email || h.phone || (
                        <span className="text-amber-700">No contact info</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {hasAddress ? `${h.city}, ${h.state ?? ""}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{h.tableNumber ?? "—"}</td>
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
