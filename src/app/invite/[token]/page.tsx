import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { resolveInviteToken } from "@/lib/outreach-token";
import { AddressFlow } from "../../address/address-flow";

export const metadata: Metadata = {
  title: "Find Your Invitation",
  robots: { index: false, follow: false },
};

// A token can expire or be revoked, so this must check on every request, not
// be prerendered once at build time.
export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [resolved, settings] = await Promise.all([
    resolveInviteToken(token),
    prisma.eventSettings.findUnique({ where: { id: 1 } }),
  ]);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Find Your Invitation</h1>
        {!resolved && (
          <p className="mt-1 text-sm text-gray-500">
            This link has expired. Enter your name below and we&apos;ll find your invitation.
          </p>
        )}
      </div>
      <AddressFlow
        contactEmail={settings?.contactEmail ?? null}
        initialSelection={
          resolved
            ? { householdId: resolved.householdId, greetingName: resolved.greetingName }
            : undefined
        }
      />
    </div>
  );
}
