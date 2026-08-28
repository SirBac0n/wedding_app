"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  searchRsvp,
  verifyRsvpIdentity,
  getRsvpHouseholdData,
  saveGuestRsvp,
  saveHouseholdRsvpDetails,
  sendRsvpConfirmationEmail,
  type RsvpSearchState,
  type RsvpHouseholdData,
  type RsvpGuest,
  type RsvpQuestionAnswer,
} from "./actions";

export function RsvpFlow({
  contactEmail,
  initialHouseholdId,
}: {
  contactEmail: string | null;
  initialHouseholdId?: string;
}) {
  const [householdId, setHouseholdId] = useState<string | null>(initialHouseholdId ?? null);
  const [pendingName, setPendingName] = useState<string | null>(null);

  if (householdId) {
    return <RsvpForm householdId={householdId} contactEmail={contactEmail} />;
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
  const [state, formAction, pending] = useActionState<RsvpSearchState, FormData>(
    searchRsvp,
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
          {pending ? "Searching…" : "Find my RSVP"}
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
  const [state, formAction, pending] = useActionState<RsvpSearchState, FormData>(
    verifyRsvpIdentity,
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

function RsvpForm({ householdId, contactEmail }: { householdId: string; contactEmail: string | null }) {
  const [data, setData] = useState<RsvpHouseholdData | null | undefined>(undefined);

  const refetch = () => {
    getRsvpHouseholdData(householdId).then(setData);
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId]);

  if (data === undefined) {
    return <p className="text-sm text-gray-400">Loading…</p>;
  }
  if (data === null) {
    return <p className="text-sm text-red-600">We couldn&apos;t find that invitation. Please search again.</p>;
  }

  const answeredCount = data.guests.filter((g) => g.attending !== null).length;

  if (!data.rsvpOpen) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">RSVPs are closed</h2>
        <p className="text-sm text-gray-600">
          The RSVP deadline for {data.displayName} has passed. If you need to make a change,
          please reach out directly.
        </p>
        <ContactHelp contactEmail={contactEmail} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-medium">{data.displayName}</h2>
        <p className="text-sm text-gray-500">
          {answeredCount} of {data.guests.length} guest{data.guests.length === 1 ? "" : "s"} answered
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {data.guests.map((g) => (
          <GuestCard
            key={g.id}
            householdId={householdId}
            guest={g}
            mealOptions={data.mealOptions}
            showDietaryNotes={data.showDietaryNotes}
            onSaved={refetch}
          />
        ))}
      </div>

      <HouseholdDetailsForm
        householdId={householdId}
        notes={data.notes}
        songRequest={data.songRequest}
        showSongRequest={data.showSongRequest}
        householdQuestions={data.householdQuestions}
        onSaved={refetch}
      />

      {data.email && <ConfirmationEmailButton householdId={householdId} />}

      <ContactHelp contactEmail={contactEmail} />
    </div>
  );
}

function GuestCard({
  householdId,
  guest,
  mealOptions,
  showDietaryNotes,
  onSaved,
}: {
  householdId: string;
  guest: RsvpGuest;
  mealOptions: string[];
  showDietaryNotes: boolean;
  onSaved: () => void;
}) {
  const boundAction = saveGuestRsvp.bind(null, householdId, guest.id);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  const [attending, setAttending] = useState(guest.attending);

  useEffect(() => {
    if (state?.ok) onSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded border border-gray-200 bg-white p-4"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">
          {guest.firstName} {guest.lastName}
        </span>
        {guest.attending !== null && (
          <span className="text-xs text-gray-400">
            {guest.attending ? "Attending" : "Not attending"}
          </span>
        )}
      </div>

      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="attending"
            value="yes"
            defaultChecked={guest.attending === true}
            onChange={() => setAttending(true)}
            required
          />
          Attending
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="attending"
            value="no"
            defaultChecked={guest.attending === false}
            onChange={() => setAttending(false)}
            required
          />
          Not attending
        </label>
      </div>

      {attending && (
        <div className="flex flex-col gap-3">
          {(mealOptions.length > 0 || showDietaryNotes) && (
            <div className="flex flex-col gap-2 sm:flex-row">
              {mealOptions.length > 0 && (
                <select
                  name="mealChoice"
                  defaultValue={guest.mealChoice ?? ""}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="">Select a meal…</option>
                  {mealOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              )}
              {showDietaryNotes && (
                <input
                  name="dietaryNotes"
                  defaultValue={guest.dietaryNotes ?? ""}
                  placeholder="Dietary restrictions / allergies"
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                />
              )}
            </div>
          )}

          {guest.questions.map((q) => (
            <QuestionField key={q.id} question={q} />
          ))}
        </div>
      )}

      {state && !state.ok && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-gray-100 px-3 py-1 text-sm disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function HouseholdDetailsForm({
  householdId,
  notes,
  songRequest,
  showSongRequest,
  householdQuestions,
  onSaved,
}: {
  householdId: string;
  notes: string | null;
  songRequest: string | null;
  showSongRequest: boolean;
  householdQuestions: RsvpQuestionAnswer[];
  onSaved: () => void;
}) {
  const boundAction = saveHouseholdRsvpDetails.bind(null, householdId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  useEffect(() => {
    if (state?.ok) onSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-medium text-gray-700">A few more things</h3>
      {showSongRequest && (
        <div className="flex flex-col gap-1">
          <label htmlFor="songRequest" className="text-sm text-gray-600">
            Song request (optional)
          </label>
          <input
            id="songRequest"
            name="songRequest"
            defaultValue={songRequest ?? ""}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm text-gray-600">
          Anything else we should know?
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={notes ?? ""}
          rows={2}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </div>
      {householdQuestions.map((q) => (
        <QuestionField key={q.id} question={q} />
      ))}
      {state && !state.ok && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-gray-100 px-3 py-1 text-sm disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function QuestionField({ question }: { question: RsvpQuestionAnswer }) {
  const name = `q_${question.id}`;
  if (question.type === "YES_NO") {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm text-gray-600">{question.label}</span>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name={name} value="Yes" defaultChecked={question.value === "Yes"} />
            Yes
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name={name} value="No" defaultChecked={question.value === "No"} />
            No
          </label>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm text-gray-600">
        {question.label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={question.value ?? ""}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      />
    </div>
  );
}

function ConfirmationEmailButton({ householdId }: { householdId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setResult(null);
          startTransition(async () => {
            const res = await sendRsvpConfirmationEmail(householdId);
            setResult(res.ok ? "Confirmation sent!" : (res.error ?? "Something went wrong."));
          });
        }}
        className="self-start rounded border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
      >
        {pending ? "Sending…" : "Email me a confirmation"}
      </button>
      {result && <span className="text-sm text-gray-500">{result}</span>}
    </div>
  );
}
