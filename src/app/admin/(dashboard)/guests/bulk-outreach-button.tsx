"use client";

import { useState, useTransition } from "react";
import { sendBulkOutreach } from "./outreach-actions";
import type { OutreachPurpose } from "@generated/prisma/enums";

export function BulkOutreachButton({
  purpose,
  count,
  label,
  confirmLabel,
}: {
  purpose: OutreachPurpose;
  count: number;
  label: string;
  confirmLabel: string;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(confirmLabel)) return;
          setResult(null);
          startTransition(async () => {
            const res = await sendBulkOutreach(purpose);
            setResult(`Sent ${res.sent}, skipped ${res.skipped} (no contact info on file).`);
          });
        }}
        className="rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
      >
        {pending ? "Sending…" : label}
      </button>
      {result && <span className="text-sm text-gray-500">{result}</span>}
    </div>
  );
}
