export function AddGuestForm({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <input
        name="firstName"
        placeholder="First name"
        required
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      />
      <input
        name="lastName"
        placeholder="Last name"
        required
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      />
      <input
        name="relationshipSide"
        placeholder="Side (e.g. Bride's side)"
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      />
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" name="isChild" />
        Child
      </label>
      <button
        type="submit"
        className="col-span-2 rounded bg-gray-900 px-3 py-1 text-sm text-white sm:col-span-4"
      >
        + Add Guest
      </button>
    </form>
  );
}
