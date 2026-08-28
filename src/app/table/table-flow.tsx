"use client";

import { useActionState, useEffect, useState } from "react";
import {
  searchTable,
  verifyTableIdentity,
  getTableAssignment,
  type TableSearchState,
  type TableResult,
} from "./actions";

export function TableFlow({ contactEmail }: { contactEmail: string | null }) {
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);

  if (householdId) {
    return <TableResultView householdId={householdId} contactEmail={contactEmail} />;
  }

  if (pendingName) {
    return (
      <VerifyStep
        name={pendingName}
        onVerified={setHouseholdId}
        onBack={() => setPendingName(null)}
        contactEmail={contactEmail}
      />
    );
  }

  return (
    <SearchStep
      onFound={setHouseholdId}
      onNeedsVerification={setPendingName}
      contactEmail={contactEmail}
    />
  );
}

function ContactHelp({ contactEmail }: { contactEmail: string | null }) {
  return (
    <p className="text-sm text-gray-500">
      Need help?{" "}
      {contactEmail ? (
        <a href={`mailto:${contactEmail}`} className="underline">
          Email us
        </a>
      ) : (
        "Please reach out to the couple directly."
      )}
    </p>
  );
}

function SearchStep({
  onFound,
  onNeedsVerification,
  contactEmail,
}: {
  onFound: (id: string) => void;
  onNeedsVerification: (name: string) => void;
  contactEmail: string | null;
}) {
  const [state, formAction, pending] = useActionState<TableSearchState, FormData>(
    searchTable,
    undefined,
  );

  useEffect(() => {
    if (state?.ok && state.status === "found") onFound(state.householdId);
    if (state?.ok && state.status === "needs-verification") onNeedsVerification(state.name);
  }, [state, onFound, onNeedsVerification]);

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-3">
        <label htmlFor="name" className="text-sm font-medium">
          Enter your full name
        </label>
        <input
          id="name"
          name="name"
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
          {pending ? "Searching…" : "Find my table"}
        </button>
      </form>
      {state && !state.ok && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <ContactHelp contactEmail={contactEmail} />
    </div>
  );
}

function VerifyStep({
  name,
  onVerified,
  onBack,
  contactEmail,
}: {
  name: string;
  onVerified: (id: string) => void;
  onBack: () => void;
  contactEmail: string | null;
}) {
  const [state, formAction, pending] = useActionState<TableSearchState, FormData>(
    verifyTableIdentity,
    undefined,
  );

  useEffect(() => {
    if (state?.ok && state.status === "found") onVerified(state.householdId);
  }, [state, onVerified]);

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-sm text-gray-500 underline">
        ← Start over
      </button>
      <p className="text-sm text-gray-600">
        We found more than one match for &quot;{name}&quot;. Confirm your email or the last 4
        digits of your phone number to continue.
      </p>
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="name" value={name} />
        <label htmlFor="verify" className="text-sm font-medium">
          Email or last 4 digits of phone
        </label>
        <input
          id="verify"
          name="verify"
          type="text"
          required
          placeholder="jane@example.com or 1234"
          className="rounded border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Checking…" : "Continue"}
        </button>
      </form>
      {state && !state.ok && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <ContactHelp contactEmail={contactEmail} />
    </div>
  );
}

function TableResultView({
  householdId,
  contactEmail,
}: {
  householdId: string;
  contactEmail: string | null;
}) {
  const [result, setResult] = useState<TableResult | null | undefined>(undefined);

  useEffect(() => {
    getTableAssignment(householdId).then(setResult);
  }, [householdId]);

  if (result === undefined) {
    return <p className="text-sm text-gray-400">Loading…</p>;
  }
  if (result === null) {
    return <p className="text-sm text-red-600">We couldn&apos;t find that invitation. Please search again.</p>;
  }

  return (
    <div className="flex flex-col gap-4 text-center">
      <h2 className="text-lg font-medium">{result.guestNames.join(", ")}</h2>
      {result.tableNumber ? (
        <div className="rounded border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Your table</p>
          <p className="text-4xl font-semibold">{result.tableNumber}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Table assignments aren&apos;t finalized yet — check back closer to the big day!
        </p>
      )}
      <ContactHelp contactEmail={contactEmail} />
    </div>
  );
}
