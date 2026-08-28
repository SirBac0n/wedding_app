"use client";

import { useState, useTransition } from "react";
import { sendOutreachToHousehold } from "./outreach-actions";

export function SendInviteButton({
  householdId,
  hasContact,
}: {
  householdId: string;
  hasContact: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  if (!hasContact) {
    return (
      <p className="text-sm text-amber-700">
        No email or phone on file — can&apos;t send an invite link. Add contact info above first.
      </p>
    );
  }

  const send = (purpose: "ADDRESS_COLLECTION" | "RSVP_REMINDER") => {
    setResult(null);
    startTransition(async () => {
      const res = await sendOutreachToHousehold(householdId, purpose);
      setResult(res.ok ? `Sent via ${res.channel === "EMAIL" ? "email" : "text"}.` : res.error);
    });
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => send("ADDRESS_COLLECTION")}
        className="rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send Address Invite"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => send("RSVP_REMINDER")}
        className="rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send RSVP Invite"}
      </button>
      {result && <span className="text-sm text-gray-500">{result}</span>}
    </div>
  );
}
