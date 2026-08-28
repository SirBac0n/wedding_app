import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { RsvpFlow } from "./rsvp-flow";

export const metadata: Metadata = {
  title: "RSVP",
  robots: { index: false, follow: false },
};

// Reads live cutoff/settings data — must not be prerendered once at build
// time (same reasoning as /address).
export const dynamic = "force-dynamic";

export default async function RsvpPage() {
  const settings = await prisma.eventSettings.findUnique({ where: { id: 1 } });

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">RSVP</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your name to find your invitation and let us know if you can make it.
        </p>
      </div>
      <RsvpFlow contactEmail={settings?.contactEmail ?? null} />
    </div>
  );
}
