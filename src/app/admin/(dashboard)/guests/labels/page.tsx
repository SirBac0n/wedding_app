import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { LabelSheet } from "./label-sheet";

export default async function LabelsPage() {
  await verifySession();

  const households = await prisma.household.findMany({
    orderBy: { displayName: "asc" },
  });

  const addressable = households.filter((h) => h.addressLine1 && h.city);
  const missingAddress = households.filter((h) => !h.addressLine1 || !h.city);

  return (
    <div className="flex flex-col gap-6">
      <div className="no-print flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Address Labels</h1>
        <p className="text-sm text-gray-500">
          Formatted for Avery 5160 label sheets (3 × 10, 30 per page). Print
          directly onto labels, or use them as a reference for hand-addressing
          envelopes.
        </p>
        {missingAddress.length > 0 && (
          <p className="text-sm text-amber-700">
            Skipping {missingAddress.length} household
            {missingAddress.length === 1 ? "" : "s"} without a full address on
            file: {missingAddress.map((h) => h.displayName).join(", ")}.
          </p>
        )}
      </div>

      <LabelSheet
        households={addressable.map((h) => ({
          id: h.id,
          displayName: h.displayName,
          addressLine1: h.addressLine1!,
          addressLine2: h.addressLine2,
          city: h.city!,
          state: h.state,
          postalCode: h.postalCode,
          country: h.country,
        }))}
      />
    </div>
  );
}
