import Link from "next/link";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { formatCalendarDate } from "@/lib/date";

export default async function RsvpDashboardPage() {
  await verifySession();

  const [households, settings] = await Promise.all([
    prisma.household.findMany({
      include: { guests: true },
      orderBy: { displayName: "asc" },
    }),
    prisma.eventSettings.findUnique({ where: { id: 1 } }),
  ]);

  const guests = households.flatMap((h) => h.guests.map((g) => ({ ...g, household: h })));
  const total = guests.length;
  const attending = guests.filter((g) => g.attending === true).length;
  const notAttending = guests.filter((g) => g.attending === false).length;
  const noResponse = guests.filter((g) => g.attending === null).length;
  const responseRate = total === 0 ? 0 : Math.round(((attending + notAttending) / total) * 100);

  const mealCounts = new Map<string, number>();
  for (const g of guests) {
    if (g.attending && g.mealChoice) {
      mealCounts.set(g.mealChoice, (mealCounts.get(g.mealChoice) ?? 0) + 1);
    }
  }

  const dietaryNotes = guests.filter((g) => g.attending && g.dietaryNotes);
  const songRequests = households.filter((h) => h.songRequest);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">RSVP Dashboard</h1>
        {settings?.rsvpCutoffAt ? (
          <p className="text-sm text-gray-500">
            Cutoff: {formatCalendarDate(settings.rsvpCutoffAt)}
          </p>
        ) : (
          <Link href="/admin/settings" className="text-sm text-amber-700 underline">
            No RSVP cutoff set
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Response rate" value={`${responseRate}%`} />
        <Stat label="Attending" value={attending} />
        <Stat label="Not attending" value={notAttending} />
        <Stat label="No response" value={noResponse} />
      </div>

      <div className="rounded border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-medium text-gray-700">Meal choices (attending guests)</h2>
        {mealCounts.size === 0 ? (
          <p className="text-sm text-gray-400">No meal choices submitted yet.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-gray-600">
            {Array.from(mealCounts.entries()).map(([meal, count]) => (
              <li key={meal} className="flex justify-between">
                <span>{meal}</span>
                <span>{count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-medium text-gray-700">Dietary restrictions</h2>
        {dietaryNotes.length === 0 ? (
          <p className="text-sm text-gray-400">None submitted yet.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-gray-600">
            {dietaryNotes.map((g) => (
              <li key={g.id}>
                {g.firstName} {g.lastName}: {g.dietaryNotes}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-medium text-gray-700">Song requests</h2>
        {songRequests.length === 0 ? (
          <p className="text-sm text-gray-400">None submitted yet.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-gray-600">
            {songRequests.map((h) => (
              <li key={h.id}>
                {h.displayName}: {h.songRequest}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-medium text-gray-700">No response yet</h2>
        {noResponse === 0 ? (
          <p className="text-sm text-gray-400">Everyone has responded.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-gray-600">
            {guests
              .filter((g) => g.attending === null)
              .map((g) => (
                <li key={g.id}>
                  <Link href={`/admin/guests/${g.householdId}`} className="underline">
                    {g.firstName} {g.lastName}
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
