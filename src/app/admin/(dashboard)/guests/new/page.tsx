import { verifySession } from "@/lib/dal";
import { HouseholdForm } from "../household-form";
import { createHousehold } from "../actions";

export default async function NewHouseholdPage() {
  await verifySession();

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <h1 className="text-xl font-semibold">Add Household</h1>
      <HouseholdForm action={createHousehold} submitLabel="Create Household" />
    </div>
  );
}
