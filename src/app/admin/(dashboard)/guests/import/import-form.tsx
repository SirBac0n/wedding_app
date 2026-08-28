"use client";

import { useActionState } from "react";
import { parseImportCsv, commitImport, type ParseCsvState } from "./actions";

export function ImportForm() {
  const [state, formAction, parsing] = useActionState<ParseCsvState, FormData>(
    parseImportCsv,
    undefined,
  );

  const hasGroups = state?.ok && state.groups.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="file" className="text-sm font-medium">
            CSV file
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="text-sm"
          />
        </div>
        {state && !state.ok && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={parsing}
          className="self-start rounded bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {parsing ? "Parsing…" : "Preview Import"}
        </button>
      </form>

      {state?.ok && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            {state.validCount} guest{state.validCount === 1 ? "" : "s"} across{" "}
            {state.groups.length} household{state.groups.length === 1 ? "" : "s"} ready
            to import.
            {state.errorCount > 0 &&
              ` ${state.errorCount} row${state.errorCount === 1 ? "" : "s"} will be skipped due to errors — see below.`}
          </p>

          {hasGroups && (
            <div className="overflow-x-auto rounded border border-gray-200 bg-white">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-2">Household</th>
                    <th className="px-4 py-2">Guests</th>
                    <th className="px-4 py-2">Address</th>
                  </tr>
                </thead>
                <tbody>
                  {state.groups.map((g) => (
                    <tr key={g.displayName} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-2 font-medium">{g.displayName}</td>
                      <td className="px-4 py-2 text-gray-600">
                        {g.guests.map((gu) => `${gu.firstName} ${gu.lastName}`).join(", ")}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {g.city ? `${g.city}, ${g.state ?? ""}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {state.errorCount > 0 && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p className="mb-1 font-medium">Skipped rows:</p>
              <ul className="list-inside list-disc">
                {state.rows
                  .filter((r) => r.error)
                  .map((r) => (
                    <li key={r.rowNumber}>
                      Row {r.rowNumber}: {r.error}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {hasGroups && (
            <form action={commitImport}>
              <input type="hidden" name="groups" value={JSON.stringify(state.groups)} />
              <button
                type="submit"
                className="rounded bg-gray-900 px-4 py-2 text-sm text-white"
              >
                Confirm Import
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
