"use client";

import { useState } from "react";

const LABELS_PER_PAGE = 30; // Avery 5160: 3 columns x 10 rows

type LabelHousehold = {
  id: string;
  displayName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

export function LabelSheet({ households }: { households: LabelHousehold[] }) {
  const [startPosition, setStartPosition] = useState(1);

  // Lets you finish off a partially-used sheet: the first (startPosition - 1)
  // cells render blank so printing lines up with the labels you have left.
  const leadingBlanks = Math.max(0, Math.min(startPosition - 1, LABELS_PER_PAGE - 1));

  const cells: (LabelHousehold | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...households,
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="no-print flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="startPosition" className="text-sm font-medium">
            Start at label #
          </label>
          <input
            id="startPosition"
            type="number"
            min={1}
            max={LABELS_PER_PAGE}
            value={startPosition}
            onChange={(e) => setStartPosition(Number(e.target.value) || 1)}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
        <p className="pb-1 text-sm text-gray-500">
          (1 = top-left. Use this to finish off a sheet that's already partly used.)
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto rounded bg-gray-900 px-4 py-2 text-sm text-white"
        >
          Print
        </button>
      </div>

      <div className="label-page">
        {cells.map((h, i) => (
          <div key={h?.id ?? `blank-${i}`} className="label-cell">
            {h && (
              <>
                <div>{h.displayName}</div>
                <div>{h.addressLine1}</div>
                {h.addressLine2 && <div>{h.addressLine2}</div>}
                <div>
                  {h.city}
                  {h.state ? `, ${h.state}` : ""} {h.postalCode ?? ""}
                </div>
                {h.country && h.country.toUpperCase() !== "USA" && (
                  <div>{h.country}</div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .label-page {
          display: grid;
          grid-template-columns: repeat(3, 2.625in);
          grid-auto-rows: 1in;
          column-gap: 0.125in;
          row-gap: 0;
        }
        .label-cell {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0.08in 0.15in;
          font-size: 11pt;
          line-height: 1.3;
          overflow: hidden;
        }
        @media screen {
          .label-page {
            border: 1px dashed #d1d5db;
          }
          .label-cell {
            border: 1px dotted #e5e7eb;
          }
        }
        @media print {
          .no-print {
            display: none !important;
          }
          @page {
            size: letter;
            margin: 0.5in 0.1875in;
          }
          .label-cell {
            border: none;
          }
        }
      `}</style>
    </div>
  );
}
