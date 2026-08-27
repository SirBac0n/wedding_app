import type { Guest } from "@generated/prisma/client";
import { ConfirmSubmitButton } from "./confirm-submit-button";

export function GuestRow({
  guest,
  updateAction,
  deleteAction,
}: {
  guest: Guest;
  updateAction: (formData: FormData) => void;
  deleteAction: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-gray-100 py-4 last:border-0">
      <form action={updateAction} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <input
          name="firstName"
          defaultValue={guest.firstName}
          placeholder="First name"
          required
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <input
          name="lastName"
          defaultValue={guest.lastName}
          placeholder="Last name"
          required
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <input
          name="alias"
          defaultValue={guest.alias ?? ""}
          placeholder="Alias / nickname"
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <input
          name="relationshipSide"
          defaultValue={guest.relationshipSide ?? ""}
          placeholder="Side (e.g. Bride's side)"
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />

        <label className="col-span-2 flex items-center gap-2 text-sm text-gray-700 sm:col-span-1">
          <input type="checkbox" name="isChild" defaultChecked={guest.isChild} />
          Child
        </label>

        <select
          name="attending"
          defaultValue={
            guest.attending === true ? "yes" : guest.attending === false ? "no" : ""
          }
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="">No response</option>
          <option value="yes">Attending</option>
          <option value="no">Not attending</option>
        </select>

        <input
          name="mealChoice"
          defaultValue={guest.mealChoice ?? ""}
          placeholder="Meal choice"
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <input
          name="dietaryNotes"
          defaultValue={guest.dietaryNotes ?? ""}
          placeholder="Dietary notes"
          className="col-span-2 rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-4"
        />

        <button
          type="submit"
          className="col-span-2 rounded bg-gray-100 px-3 py-1 text-sm sm:col-span-1"
        >
          Save
        </button>
      </form>
      <form action={deleteAction}>
        <ConfirmSubmitButton
          confirmMessage={`Remove ${guest.firstName} ${guest.lastName} from this household?`}
          className="text-xs text-red-600 underline"
        >
          Remove guest
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
