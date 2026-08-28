import Papa from "papaparse";
import { normalizePhone } from "./phone";

// Pure CSV-parsing/grouping logic for guest-list bulk import
// (REQUIREMENTS.md section 4.2), kept separate from the server action so it
// can be unit-tested without a Next.js request context (verifySession()
// relies on next/headers, which only works inside a real request).

const EXPECTED_COLUMNS = [
  "household",
  "firstName",
  "lastName",
  "alias",
  "relationshipSide",
  "isChild",
  "email",
  "phone",
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "postalCode",
  "country",
  "notes",
] as const;

// Accepts common header variations: case-insensitive, spaces/underscores/
// hyphens ignored (so "First Name", "first_name", "firstname" all match).
function normalizeHeader(header: string): string {
  const key = header.trim().toLowerCase().replace(/[\s_-]/g, "");
  const match = EXPECTED_COLUMNS.find((c) => c.toLowerCase() === key);
  return match ?? header;
}

function parseBoolean(v: string | undefined): boolean {
  if (!v) return false;
  return ["true", "yes", "y", "1"].includes(v.trim().toLowerCase());
}

export type ParsedGuestRow = {
  rowNumber: number;
  household: string;
  firstName: string;
  lastName: string;
  alias: string;
  relationshipSide: string;
  isChild: boolean;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
  error?: string;
};

export type ParsedHouseholdGroup = {
  displayName: string;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  notes: string | null;
  guests: {
    firstName: string;
    lastName: string;
    alias: string | null;
    relationshipSide: string | null;
    isChild: boolean;
  }[];
};

export type ParseGuestCsvResult =
  | {
      ok: true;
      rows: ParsedGuestRow[];
      groups: ParsedHouseholdGroup[];
      validCount: number;
      errorCount: number;
    }
  | { ok: false; error: string };

export function parseGuestCsv(text: string): ParseGuestCsvResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    return { ok: false, error: "Could not parse that file as CSV." };
  }

  const rows: ParsedGuestRow[] = parsed.data.map((raw, i) => {
    const get = (key: string) => (raw[key] ?? "").trim();
    const household = get("household");
    const firstName = get("firstName");
    const lastName = get("lastName");

    let error: string | undefined;
    if (!household) error = "Missing household name";
    else if (!firstName) error = "Missing first name";
    else if (!lastName) error = "Missing last name";

    return {
      rowNumber: i + 2, // +1 for 0-index, +1 for header row
      household,
      firstName,
      lastName,
      alias: get("alias"),
      relationshipSide: get("relationshipSide"),
      isChild: parseBoolean(get("isChild")),
      email: get("email"),
      phone: get("phone"),
      addressLine1: get("addressLine1"),
      addressLine2: get("addressLine2"),
      city: get("city"),
      state: get("state"),
      postalCode: get("postalCode"),
      country: get("country"),
      notes: get("notes"),
      error,
    };
  });

  const groupsByName = new Map<string, ParsedHouseholdGroup>();
  for (const row of rows) {
    if (row.error) continue;
    const key = row.household.trim().toLowerCase();
    let group = groupsByName.get(key);
    if (!group) {
      group = {
        displayName: row.household,
        email: row.email ? row.email : null,
        phone: row.phone ? normalizePhone(row.phone) : null,
        addressLine1: row.addressLine1 || null,
        addressLine2: row.addressLine2 || null,
        city: row.city || null,
        state: row.state || null,
        postalCode: row.postalCode || null,
        country: row.country || null,
        notes: row.notes || null,
        guests: [],
      };
      groupsByName.set(key, group);
    }
    group.guests.push({
      firstName: row.firstName,
      lastName: row.lastName,
      alias: row.alias || null,
      relationshipSide: row.relationshipSide || null,
      isChild: row.isChild,
    });
  }

  return {
    ok: true,
    rows,
    groups: Array.from(groupsByName.values()),
    validCount: rows.filter((r) => !r.error).length,
    errorCount: rows.filter((r) => r.error).length,
  };
}
