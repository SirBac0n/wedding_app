import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireFullAdmin } from "@/lib/dal";
import { ConfirmSubmitButton } from "../guests/confirm-submit-button";
import { createScheduleItem, updateScheduleItem, deleteScheduleItem } from "./actions";

export default async function ScheduleAdminPage() {
  await requireFullAdmin();

  const items = await prisma.scheduleItem.findMany({ orderBy: { time: "asc" } });

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Schedule</h1>
        <p className="text-sm text-gray-500">
          Full Admin only. Guests see this at{" "}
          <Link href="/schedule" className="underline">
            /schedule
          </Link>
          . Sorted automatically by time.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded border border-gray-200 bg-white p-4"
          >
            <form action={updateScheduleItem.bind(null, item.id)} className="flex flex-col gap-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr]">
                <TimeInput id={`time-${item.id}`} label="Time" name="time" defaultValue={item.time} />
                <TextInput
                  id={`title-${item.id}`}
                  label="Title"
                  name="title"
                  defaultValue={item.title}
                  placeholder="Ceremony"
                  required
                />
              </div>
              <TextInput
                id={`location-${item.id}`}
                label="Location (optional)"
                name="location"
                defaultValue={item.location ?? ""}
                placeholder="Garden Terrace"
              />
              <TextArea
                id={`description-${item.id}`}
                label="Description (optional)"
                name="description"
                defaultValue={item.description ?? ""}
              />
              <button
                type="submit"
                className="self-start rounded bg-gray-900 px-3 py-1.5 text-sm text-white"
              >
                Save
              </button>
            </form>
            <form action={deleteScheduleItem.bind(null, item.id)}>
              <ConfirmSubmitButton
                confirmMessage={`Remove "${item.title}" from the schedule?`}
                className="text-sm text-red-600 underline"
              >
                Delete
              </ConfirmSubmitButton>
            </form>
          </div>
        ))}

        <div className="rounded border border-dashed border-gray-300 p-4">
          <h3 className="mb-2 text-sm font-medium text-gray-700">Add a schedule item</h3>
          <form action={createScheduleItem} className="flex flex-col gap-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr]">
              <TimeInput id="new-item-time" label="Time" name="time" />
              <TextInput
                id="new-item-title"
                label="Title"
                name="title"
                placeholder="Ceremony"
                required
              />
            </div>
            <TextInput
              id="new-item-location"
              label="Location (optional)"
              name="location"
              placeholder="Garden Terrace"
            />
            <TextArea id="new-item-description" label="Description (optional)" name="description" />
            <button
              type="submit"
              className="self-start rounded bg-gray-900 px-3 py-1.5 text-sm text-white"
            >
              + Add Item
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function TimeInput({
  id,
  label,
  name,
  defaultValue,
}: {
  id: string;
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="time"
        required
        defaultValue={defaultValue}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function TextInput({
  id,
  label,
  name,
  required,
  defaultValue,
  placeholder,
}: {
  id: string;
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function TextArea({
  id,
  label,
  name,
  defaultValue,
}: {
  id: string;
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        defaultValue={defaultValue}
        rows={2}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
