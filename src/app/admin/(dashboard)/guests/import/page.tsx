import { verifySession } from "@/lib/dal";
import { ImportForm } from "./import-form";

export default async function ImportGuestsPage() {
  await verifySession();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold">Import Guest List (CSV)</h1>

      <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
        <p className="mb-2 font-medium text-gray-800">Expected columns</p>
        <p>
          <code>household</code>, <code>firstName</code>, <code>lastName</code> are
          required. Optional: <code>alias</code>, <code>relationshipSide</code>,{" "}
          <code>isChild</code> (yes/no), <code>email</code>, <code>phone</code>,{" "}
          <code>addressLine1</code>, <code>addressLine2</code>, <code>city</code>,{" "}
          <code>state</code>, <code>postalCode</code>, <code>country</code>,{" "}
          <code>notes</code>.
        </p>
        <p className="mt-2">
          One row per guest — rows sharing the same <code>household</code> value are
          grouped into one household. Contact/address fields are taken from the first
          row that provides them for each household.
        </p>
      </div>

      <ImportForm />
    </div>
  );
}
