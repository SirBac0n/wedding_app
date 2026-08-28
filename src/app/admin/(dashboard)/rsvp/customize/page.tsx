import { prisma } from "@/lib/db";
import { requireFullAdmin } from "@/lib/dal";
import { ConfirmSubmitButton } from "../../guests/confirm-submit-button";
import {
  addMealOption,
  deleteMealOption,
  addRsvpQuestion,
  deleteRsvpQuestion,
  setRsvpQuestionActive,
  updateRsvpFieldToggles,
} from "./actions";

export default async function CustomizeRsvpPage() {
  await requireFullAdmin();

  const [mealOptions, questions, settings] = await Promise.all([
    prisma.mealOption.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.rsvpQuestion.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.eventSettings.findUnique({ where: { id: 1 } }),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Customize RSVP Form</h1>
        <p className="text-sm text-gray-500">
          Full Admin only. Changes apply immediately to the live RSVP form.
        </p>
      </div>

      <section className="flex flex-col gap-3 rounded border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-700">Built-in fields</h2>
        <form action={updateRsvpFieldToggles} className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="showSongRequest"
              defaultChecked={settings?.rsvpShowSongRequest ?? true}
            />
            Show song request field
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="showDietaryNotes"
              defaultChecked={settings?.rsvpShowDietaryNotes ?? true}
            />
            Show dietary notes field
          </label>
          <button
            type="submit"
            className="self-start rounded bg-gray-900 px-3 py-1.5 text-sm text-white"
          >
            Save
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3 rounded border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-700">
          Meal options
          <span className="ml-1 font-normal text-gray-400">
            (empty list hides the meal picker entirely)
          </span>
        </h2>
        {mealOptions.length > 0 && (
          <ul className="flex flex-col gap-1">
            {mealOptions.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <span>{m.label}</span>
                <form action={deleteMealOption.bind(null, m.id)}>
                  <button type="submit" className="text-xs text-red-600 underline">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addMealOption} className="flex gap-2">
          <input
            name="label"
            placeholder="e.g. Chicken"
            required
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <button type="submit" className="rounded border border-gray-300 px-3 py-1 text-sm">
            + Add
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3 rounded border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-700">Custom questions</h2>
        {questions.length > 0 && (
          <ul className="flex flex-col gap-2">
            {questions.map((q) => (
              <li
                key={q.id}
                className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 text-sm last:border-0"
              >
                <div>
                  <div className="font-medium">{q.label}</div>
                  <div className="text-xs text-gray-400">
                    {q.type === "TEXT" ? "Text answer" : "Yes/No"} ·{" "}
                    {q.scope === "GUEST" ? "Per guest" : "Per household"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <form
                    action={setRsvpQuestionActive.bind(null, q.id)}
                    className="flex items-center gap-1"
                  >
                    <label className="flex items-center gap-1 text-xs text-gray-500">
                      <input type="checkbox" name="active" defaultChecked={q.active} />
                      Active
                    </label>
                    <button type="submit" className="text-xs text-gray-500 underline">
                      Save
                    </button>
                  </form>
                  <form action={deleteRsvpQuestion.bind(null, q.id)}>
                    <ConfirmSubmitButton
                      confirmMessage={`Delete the question "${q.label}"? Existing answers will be deleted too.`}
                      className="text-xs text-red-600 underline"
                    >
                      Delete
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <form action={addRsvpQuestion} className="flex flex-col gap-2 sm:flex-row">
          <input
            name="label"
            placeholder="e.g. Will you need a hotel shuttle?"
            required
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <select name="type" className="rounded border border-gray-300 px-2 py-1 text-sm">
            <option value="YES_NO">Yes/No</option>
            <option value="TEXT">Text answer</option>
          </select>
          <select name="scope" className="rounded border border-gray-300 px-2 py-1 text-sm">
            <option value="GUEST">Per guest</option>
            <option value="HOUSEHOLD">Per household</option>
          </select>
          <button type="submit" className="rounded border border-gray-300 px-3 py-1 text-sm">
            + Add
          </button>
        </form>
      </section>
    </div>
  );
}
