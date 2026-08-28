"use client";

import { useActionState, useEffect, useState } from "react";
import {
  searchGuests,
  submitAddress,
  getHouseholdInfo,
  type GuestMatch,
  type HouseholdInfo,
  type SearchState,
  type SubmitAddressState,
} from "./actions";

type Selection = { householdId: string; greetingName: string };

export function AddressFlow({
  contactEmail,
  initialSelection,
}: {
  contactEmail: string | null;
  // Set when arriving via a personalized outreach link (section 4.4) — skips
  // the search step entirely since the household is already known.
  initialSelection?: Selection;
}) {
  const [selected, setSelected] = useState<Selection | null>(initialSelection ?? null);

  if (selected) {
    return (
      <AddressForm
        selection={selected}
        onBack={initialSelection ? undefined : () => setSelected(null)}
        contactEmail={contactEmail}
      />
    );
  }

  return <SearchStep onSelect={setSelected} contactEmail={contactEmail} />;
}

function SearchStep({
  onSelect,
  contactEmail,
}: {
  onSelect: (s: Selection) => void;
  contactEmail: string | null;
}) {
  const [state, formAction, pending] = useActionState<SearchState, FormData>(
    searchGuests,
    undefined,
  );

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-3">
        <label htmlFor="query" className="text-sm font-medium">
          Enter your name
        </label>
        <input
          id="query"
          name="query"
          type="text"
          required
          placeholder="e.g. Jane Smith"
          className="rounded border border-gray-300 px-3 py-2"
          autoComplete="name"
        />
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Searching…" : "Find my invitation"}
        </button>
      </form>

      {state && !state.ok && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      {state?.ok && state.matches.length === 0 && (
        <NotFoundHelp contactEmail={contactEmail} />
      )}

      {state?.ok && state.matches.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">Is one of these you?</p>
          {state.matches.map((m: GuestMatch) => (
            <button
              key={m.guestId}
              type="button"
              onClick={() =>
                onSelect({ householdId: m.householdId, greetingName: m.firstName })
              }
              className="rounded border border-gray-300 px-4 py-3 text-left hover:bg-gray-50"
            >
              <div className="font-medium">
                {m.firstName} {m.lastName}
              </div>
              {m.relationshipSide && (
                <div className="text-sm text-gray-500">{m.relationshipSide}</div>
              )}
            </button>
          ))}
          <NotFoundHelp contactEmail={contactEmail} label="Not you?" />
        </div>
      )}
    </div>
  );
}

function NotFoundHelp({
  contactEmail,
  label = "Can't find your name?",
}: {
  contactEmail: string | null;
  label?: string;
}) {
  return (
    <p className="text-sm text-gray-500">
      {label}{" "}
      {contactEmail ? (
        <a href={`mailto:${contactEmail}`} className="underline">
          Email us
        </a>
      ) : (
        "Please reach out to the couple directly."
      )}{" "}
      and we&apos;ll help sort it out.
    </p>
  );
}

function AddressForm({
  selection,
  onBack,
  contactEmail,
}: {
  selection: Selection;
  onBack?: () => void;
  contactEmail: string | null;
}) {
  const boundAction = submitAddress.bind(null, selection.householdId);
  const [state, formAction, pending] = useActionState<SubmitAddressState, FormData>(
    boundAction,
    undefined,
  );
  const [existing, setExisting] = useState<HouseholdInfo | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getHouseholdInfo(selection.householdId).then((info) => {
      if (!cancelled) setExisting(info);
    });
    return () => {
      cancelled = true;
    };
  }, [selection.householdId]);

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Thanks, {selection.greetingName}!</h2>
        <p className="text-sm text-gray-600">
          We&apos;ve saved your address. You can come back and update it anytime by
          searching your name again.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        {onBack && (
          <button type="button" onClick={onBack} className="text-sm text-gray-500 underline">
            ← Not {selection.greetingName}?
          </button>
        )}
        <h2 className="mt-2 text-lg font-medium">
          Confirm your mailing address, {selection.greetingName}
        </h2>
        <p className="text-sm text-gray-500">
          Used to send your invitation — we&apos;ll never share it.
        </p>
      </div>

      {existing === undefined ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email" name="email" type="email" defaultValue={existing?.email ?? ""} />
            <Field label="Phone" name="phone" defaultValue={existing?.phone ?? ""} />
          </div>
          <p className="-mt-2 text-xs text-gray-400">
            Enter at least one — used to verify it&apos;s you if you RSVP later.
          </p>

          <Field
            label="Address line 1"
            name="addressLine1"
            required
            defaultValue={existing?.addressLine1 ?? ""}
          />
          <Field
            label="Address line 2"
            name="addressLine2"
            defaultValue={existing?.addressLine2 ?? ""}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="City" name="city" required defaultValue={existing?.city ?? ""} />
            <Field label="State" name="state" defaultValue={existing?.state ?? ""} />
            <Field
              label="Postal code"
              name="postalCode"
              defaultValue={existing?.postalCode ?? ""}
            />
          </div>
          <Field label="Country" name="country" defaultValue={existing?.country ?? ""} />

          {state && !state.ok && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="self-start rounded bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save my address"}
          </button>
        </form>
      )}

      <NotFoundHelp contactEmail={contactEmail} label="Something not right?" />
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
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
    </div>
  );
}
