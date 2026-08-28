import Link from "next/link";
import type { Household } from "@generated/prisma/client";

export function HouseholdForm({
  household,
  tableLabel,
  action,
  submitLabel,
}: {
  household?: Household;
  tableLabel?: string | null;
  action: (formData: FormData) => void;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Household display name" name="displayName" required defaultValue={household?.displayName} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email" name="email" type="email" defaultValue={household?.email ?? ""} />
        <Field label="Phone" name="phone" defaultValue={household?.phone ?? ""} />
      </div>

      <Field label="Address line 1" name="addressLine1" defaultValue={household?.addressLine1 ?? ""} />
      <Field label="Address line 2" name="addressLine2" defaultValue={household?.addressLine2 ?? ""} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="City" name="city" defaultValue={household?.city ?? ""} />
        <Field label="State" name="state" defaultValue={household?.state ?? ""} />
        <Field label="Postal code" name="postalCode" defaultValue={household?.postalCode ?? ""} />
      </div>
      <Field label="Country" name="country" defaultValue={household?.country ?? ""} />

      <Field label="Notes / allergies" name="notes" textarea defaultValue={household?.notes ?? ""} />
      <Field label="Song request" name="songRequest" defaultValue={household?.songRequest ?? ""} />

      {household && (
        <p className="text-sm text-gray-600">
          Table: {tableLabel ?? "Unassigned"} —{" "}
          <Link href="/admin/tables" className="underline">
            manage in Table Assignments
          </Link>
        </p>
      )}

      {household && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="thankYouSent"
            defaultChecked={household.thankYouSent}
          />
          Thank-you sent
        </label>
      )}

      <button
        type="submit"
        className="mt-2 self-start rounded bg-gray-900 px-4 py-2 text-sm text-white"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  textarea,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | null;
  textarea?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue ?? ""}
          rows={3}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue ?? ""}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
