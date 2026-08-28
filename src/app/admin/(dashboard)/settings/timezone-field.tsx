"use client";

import { useState } from "react";
import { COMMON_TIMEZONES } from "@/lib/timezones";

const OTHER = "__other__";

export function TimezoneField({ defaultValue }: { defaultValue: string }) {
  const isKnown = COMMON_TIMEZONES.some((tz) => tz.value === defaultValue);
  const [selected, setSelected] = useState(isKnown ? defaultValue : OTHER);
  const [custom, setCustom] = useState(isKnown ? "" : defaultValue);

  const value = selected === OTHER ? custom : selected;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="timezone-select" className="text-sm font-medium text-gray-700">
        Timezone
      </label>
      <select
        id="timezone-select"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
      >
        {COMMON_TIMEZONES.map((tz) => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
        <option value={OTHER}>Other (enter manually)</option>
      </select>
      {selected === OTHER && (
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="IANA timezone, e.g. Europe/London"
          required
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
      )}
      <input type="hidden" name="timezone" value={value} />
      <p className="text-xs text-gray-400">Drives the RSVP cutoff and reminder timing.</p>
    </div>
  );
}
