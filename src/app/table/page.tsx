import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { TableFlow } from "./table-flow";

export const metadata: Metadata = {
  title: "Find Your Table",
  robots: { index: false, follow: false },
};

// Reads live settings/table data — must not be prerendered once at build
// time (same reasoning as /address and /rsvp).
export const dynamic = "force-dynamic";

export default async function TablePage() {
  const settings = await prisma.eventSettings.findUnique({ where: { id: 1 } });

  // Not visible until the admin has enabled it (REQUIREMENTS.md section 4.6:
  // "entirely absent from the public site until the admin has assigned at
  // least one table" — here made an explicit toggle set in Settings rather
  // than auto-detected, so the couple controls exactly when it appears
  // instead of it going live the moment a single table gets assigned).
  if (!settings?.tableLookupEnabled) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-2 px-4 text-center">
        <h1 className="text-2xl font-semibold">Find Your Table</h1>
        <p className="text-sm text-gray-500">
          Table assignments aren&apos;t available yet — check back closer to the wedding.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Find Your Table</h1>
        <p className="mt-1 text-sm text-gray-500">Enter your name to find your seat.</p>
      </div>
      <TableFlow contactEmail={settings.contactEmail ?? null} />
    </div>
  );
}
