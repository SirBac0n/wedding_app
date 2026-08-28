import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { AddressFlow } from "./address-flow";

// Keep guest names/search out of search-engine indexes and crawlable
// sitemaps (REQUIREMENTS.md section 5, bot/abuse protection).
export const metadata: Metadata = {
  title: "Find Your Invitation",
  robots: { index: false, follow: false },
};

// Reads live contactEmail/settings from the DB — must not be prerendered
// once and baked into the build, or admin changes to Settings would never
// show up without a redeploy.
export const dynamic = "force-dynamic";

export default async function AddressPage() {
  const settings = await prisma.eventSettings.findUnique({ where: { id: 1 } });

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Find Your Invitation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your name so we can send you an invitation.
        </p>
      </div>
      <AddressFlow contactEmail={settings?.contactEmail ?? null} />
    </div>
  );
}
