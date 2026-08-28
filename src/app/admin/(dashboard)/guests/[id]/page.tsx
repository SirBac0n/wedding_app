import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { HouseholdForm } from "../household-form";
import { GuestRow } from "../guest-row";
import { AddGuestForm } from "../add-guest-form";
import { ConfirmSubmitButton } from "../confirm-submit-button";
import { SendInviteButton } from "../send-invite-button";
import {
  updateHousehold,
  deleteHousehold,
  addGuest,
  updateGuest,
  deleteGuest,
} from "../actions";

export default async function HouseholdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifySession();
  const { id } = await params;

  const household = await prisma.household.findUnique({
    where: { id },
    include: {
      guests: { orderBy: { firstName: "asc" } },
      outreachMessages: { orderBy: { sentAt: "desc" }, take: 1 },
      table: true,
    },
  });

  if (!household) {
    notFound();
  }

  const lastOutreach = household.outreachMessages[0];

  const boundUpdateHousehold = updateHousehold.bind(null, household.id);
  const boundDeleteHousehold = deleteHousehold.bind(null, household.id);
  const boundAddGuest = addGuest.bind(null, household.id);

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{household.displayName}</h1>
          <form action={boundDeleteHousehold}>
            <ConfirmSubmitButton
              confirmMessage={`Delete household "${household.displayName}" and all its guests? This cannot be undone.`}
              className="text-sm text-red-600 underline"
            >
              Delete household
            </ConfirmSubmitButton>
          </form>
        </div>
        <HouseholdForm
          household={household}
          tableLabel={household.table?.label}
          action={boundUpdateHousehold}
          submitLabel="Save Household"
        />
      </div>

      <div className="flex flex-col gap-3 rounded border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-700">Guest Outreach</h2>
        <SendInviteButton
          householdId={household.id}
          hasContact={Boolean(household.email || household.phone)}
        />
        {lastOutreach && (
          <p className="text-xs text-gray-400">
            Last sent {lastOutreach.sentAt.toLocaleDateString()} via{" "}
            {lastOutreach.channel === "EMAIL" ? "email" : "text"}
            {lastOutreach.usedAt && " · opened"}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Guests</h2>
        {household.guests.length === 0 ? (
          <p className="text-sm text-gray-500">No guests in this household yet.</p>
        ) : (
          <div className="rounded border border-gray-200 bg-white px-4">
            {household.guests.map((guest) => (
              <GuestRow
                key={guest.id}
                guest={guest}
                updateAction={updateGuest.bind(null, household.id, guest.id)}
                deleteAction={deleteGuest.bind(null, household.id, guest.id)}
              />
            ))}
          </div>
        )}

        <div className="rounded border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-medium text-gray-700">Add a guest</h3>
          <AddGuestForm action={boundAddGuest} />
        </div>
      </div>
    </div>
  );
}
