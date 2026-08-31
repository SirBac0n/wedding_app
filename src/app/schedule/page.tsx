import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatTime12h } from "@/lib/schedule-time";

// Reads live schedule data with no other dynamic API call, so it would
// otherwise get prerendered once at build time (same reasoning as /,
// /address, /rsvp, /table, /registry).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Schedule",
};

export default async function SchedulePage() {
  const items = await prisma.scheduleItem.findMany({ orderBy: { time: "asc" } });

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 px-4 py-10">
      <h1 className="text-2xl font-semibold">Schedule</h1>

      {items.length === 0 ? (
        <p className="text-gray-500">The schedule will be posted here soon — check back later!</p>
      ) : (
        <ol className="relative flex flex-col gap-8 border-l border-gray-200 pl-6">
          {items.map((item) => (
            <li key={item.id} className="relative">
              <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-white bg-gray-900" />
              <p className="text-sm font-medium text-gray-500">{formatTime12h(item.time)}</p>
              <p className="text-lg font-semibold">{item.title}</p>
              {item.location && <p className="text-sm text-gray-600">{item.location}</p>}
              {item.description && <p className="mt-1 text-sm text-gray-500">{item.description}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
