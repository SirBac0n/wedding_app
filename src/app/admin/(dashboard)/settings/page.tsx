import { prisma } from "@/lib/db";
import { requireFullAdmin } from "@/lib/dal";
import { updateSettings } from "./actions";

function toDateInputValue(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export default async function SettingsPage() {
  await requireFullAdmin();

  const settings = await prisma.eventSettings.findUnique({ where: { id: 1 } });

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <h1 className="text-xl font-semibold">Event Settings</h1>
      <p className="text-sm text-gray-500">
        Full Admin only. Drives the RSVP edit-lock, reminder schedule, table-lookup
        timing, and the contact-fallback shown to guests who can&apos;t find their name.
      </p>

      <form action={updateSettings} className="flex flex-col gap-4">
        <Field
          label="Wedding date"
          name="weddingDate"
          type="date"
          defaultValue={toDateInputValue(settings?.weddingDate)}
        />
        <Field
          label="Timezone"
          name="timezone"
          defaultValue={settings?.timezone ?? "America/Chicago"}
          required
          hint="IANA timezone, e.g. America/Chicago"
        />
        <Field
          label="RSVP cutoff date"
          name="rsvpCutoffAt"
          type="date"
          defaultValue={toDateInputValue(settings?.rsvpCutoffAt)}
          hint="Leave a buffer before your caterer/venue deadline (see REQUIREMENTS.md section 7)"
        />
        <Field
          label="Contact email"
          name="contactEmail"
          type="email"
          defaultValue={settings?.contactEmail ?? ""}
          hint="Shown to guests who can't find their name in the lookup"
        />

        <button
          type="submit"
          className="self-start rounded bg-gray-900 px-4 py-2 text-sm text-white"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
