"use client";

import { useState, useTransition } from "react";
import { sendBulkAddressOutreach } from "./outreach-actions";

export function BulkOutreachButton({ missingCount }: { missingCount: number }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  if (missingCount === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              `Send an address-collection invite to ${missingCount} household${missingCount === 1 ? "" : "s"} missing an address?`,
            )
          ) {
            return;
          }
          setResult(null);
          startTransition(async () => {
            const res = await sendBulkAddressOutreach();
            setResult(
              `Sent ${res.sent}, skipped ${res.skipped} (no contact info on file).`,
            );
          });
        }}
        className="rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
      >
        {pending ? "Sending…" : `Invite ${missingCount} Missing Address${missingCount === 1 ? "" : "es"}`}
      </button>
      {result && <span className="text-sm text-gray-500">{result}</span>}
    </div>
  );
}
