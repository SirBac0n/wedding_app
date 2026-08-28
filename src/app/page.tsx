import { prisma } from "@/lib/db";

// Conditionally shows the table-lookup link based on live settings, so this
// can't be prerendered once at build time (same reasoning as /address,
// /rsvp, /table).
export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await prisma.eventSettings.findUnique({ where: { id: 1 } });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold">Our Wedding</h1>
      <p className="max-w-md text-gray-500">
        The full public site (event details, registry) is coming soon.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <a
          href="/address"
          className="rounded border border-gray-300 px-4 py-2 text-sm"
        >
          Find Your Invitation
        </a>
        <a
          href="/rsvp"
          className="rounded bg-gray-900 px-4 py-2 text-sm text-white"
        >
          RSVP
        </a>
        {settings?.tableLookupEnabled && (
          <a
            href="/table"
            className="rounded border border-gray-300 px-4 py-2 text-sm"
          >
            Find Your Table
          </a>
        )}
      </div>
      <a href="/admin/login" className="text-sm underline text-gray-400">
        Admin sign in
      </a>
    </div>
  );
}
