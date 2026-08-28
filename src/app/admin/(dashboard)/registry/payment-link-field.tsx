"use client";

import { useState } from "react";
import {
  buildPaymentLink,
  extractPaymentHandle,
  PAYMENT_PLATFORMS,
  PAYMENT_PLATFORM_LABELS,
  PAYMENT_PLATFORM_META,
  type PaymentPlatform,
} from "@/lib/payment-link";

export function PaymentLinkField({
  idPrefix,
  defaultPlatform = "VENMO",
  defaultLink = "",
}: {
  idPrefix: string;
  defaultPlatform?: PaymentPlatform;
  defaultLink?: string;
}) {
  const [platform, setPlatform] = useState<PaymentPlatform>(defaultPlatform);
  const [handle, setHandle] = useState(() => extractPaymentHandle(defaultPlatform, defaultLink));

  const meta = PAYMENT_PLATFORM_META[platform];
  const builtLink = buildPaymentLink(platform, handle);

  function handlePlatformChange(next: PaymentPlatform) {
    setPlatform(next);
    // A Venmo handle isn't a Zelle email — starting over avoids submitting
    // a nonsense value built from the wrong platform's leftover text.
    setHandle("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-platform`} className="text-sm font-medium text-gray-700">
          Payment method
        </label>
        <select
          id={`${idPrefix}-platform`}
          value={platform}
          onChange={(e) => handlePlatformChange(e.target.value as PaymentPlatform)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          {PAYMENT_PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {PAYMENT_PLATFORM_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-handle`} className="text-sm font-medium text-gray-700">
          {meta.fieldLabel}
        </label>
        <div className="flex items-center overflow-hidden rounded border border-gray-300 text-sm focus-within:ring-1 focus-within:ring-gray-400">
          {meta.prefix && <span className="pl-3 text-gray-400">{meta.prefix}</span>}
          <input
            id={`${idPrefix}-handle`}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={meta.placeholder}
            required
            className="w-full px-3 py-2 outline-none"
          />
        </div>
        {meta.hint && <p className="text-xs text-gray-400">{meta.hint}</p>}
      </div>

      <input type="hidden" name="paymentPlatform" value={platform} />
      <input type="hidden" name="paymentLink" value={builtLink} />
    </div>
  );
}
