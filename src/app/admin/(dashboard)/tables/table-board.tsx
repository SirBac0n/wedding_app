"use client";

import { useState, useTransition } from "react";
import { createTable, deleteTable, assignHouseholdToTable } from "./actions";

type TableInfo = { id: string; label: string; capacity: number | null };
type HouseholdInfo = {
  id: string;
  displayName: string;
  tableId: string | null;
  guestNames: string[];
};

const UNASSIGNED = "unassigned" as const;

export function TableBoard({
  initialTables,
  households: initialHouseholds,
}: {
  initialTables: TableInfo[];
  households: HouseholdInfo[];
}) {
  const [tables, setTables] = useState<TableInfo[]>(initialTables);
  const [households, setHouseholds] = useState<HouseholdInfo[]>(initialHouseholds);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function moveHousehold(householdId: string, tableId: string | null) {
    setHouseholds((prev) => prev.map((h) => (h.id === householdId ? { ...h, tableId } : h)));
    startTransition(async () => {
      await assignHouseholdToTable(householdId, tableId);
    });
  }

  function handleDrop(e: React.DragEvent, tableId: string | null) {
    e.preventDefault();
    setDragOverKey(null);
    const householdId = e.dataTransfer.getData("text/plain");
    if (householdId) moveHousehold(householdId, tableId);
  }

  async function handleAddTable() {
    const label = window.prompt("Table name/number:");
    if (!label) return;
    const capacityRaw = window.prompt("Capacity (optional, leave blank to skip):");
    const capacity = capacityRaw ? parseInt(capacityRaw, 10) || null : null;
    const table = await createTable(label, capacity);
    if (table) setTables((prev) => [...prev, table]);
  }

  async function handleDeleteTable(tableId: string) {
    if (!window.confirm("Remove this table? Assigned households go back to Unassigned."))
      return;
    setTables((prev) => prev.filter((t) => t.id !== tableId));
    setHouseholds((prev) =>
      prev.map((h) => (h.tableId === tableId ? { ...h, tableId: null } : h)),
    );
    await deleteTable(tableId);
  }

  const unassigned = households.filter((h) => h.tableId === null);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      <Column
        title="Unassigned"
        count={unassigned.length}
        isDragOver={dragOverKey === UNASSIGNED}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverKey(UNASSIGNED);
        }}
        onDragLeave={() => setDragOverKey(null)}
        onDrop={(e) => handleDrop(e, null)}
      >
        {unassigned.map((h) => (
          <HouseholdCard key={h.id} household={h} tables={tables} onMove={moveHousehold} />
        ))}
      </Column>

      {tables.map((t) => {
        const here = households.filter((h) => h.tableId === t.id);
        const headcount = here.reduce((n, h) => n + h.guestNames.length, 0);
        const overCapacity = t.capacity != null && headcount > t.capacity;
        return (
          <Column
            key={t.id}
            title={t.label}
            count={t.capacity != null ? `${headcount}/${t.capacity}` : headcount}
            overCapacity={overCapacity}
            isDragOver={dragOverKey === t.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverKey(t.id);
            }}
            onDragLeave={() => setDragOverKey(null)}
            onDrop={(e) => handleDrop(e, t.id)}
            onDelete={() => handleDeleteTable(t.id)}
          >
            {here.map((h) => (
              <HouseholdCard key={h.id} household={h} tables={tables} onMove={moveHousehold} />
            ))}
          </Column>
        );
      })}

      <button
        type="button"
        onClick={handleAddTable}
        className="h-fit shrink-0 rounded border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-gray-400"
      >
        + Add table
      </button>
    </div>
  );
}

function Column({
  title,
  count,
  overCapacity,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onDelete,
  children,
}: {
  title: string;
  count: number | string;
  overCapacity?: boolean;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDelete?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex w-64 shrink-0 flex-col gap-2 rounded border bg-gray-50 p-3 ${
        isDragOver ? "border-gray-900" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${overCapacity ? "font-semibold text-red-600" : "text-gray-400"}`}>
            {count}
          </span>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-gray-400 hover:text-red-600"
              title="Remove table"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="flex min-h-[3rem] flex-col gap-2">{children}</div>
    </div>
  );
}

function HouseholdCard({
  household,
  tables,
  onMove,
}: {
  household: HouseholdInfo;
  tables: TableInfo[];
  onMove: (householdId: string, tableId: string | null) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", household.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="cursor-move rounded border border-gray-200 bg-white p-2 text-sm shadow-sm"
    >
      <div className="font-medium">{household.displayName}</div>
      <div className="text-xs text-gray-500">{household.guestNames.join(", ")}</div>
      {/* Non-drag fallback — keyboard/touch accessible, and handy when you
          just want to jump a household straight to a table. */}
      <select
        value={household.tableId ?? ""}
        onChange={(e) => onMove(household.id, e.target.value || null)}
        className="mt-1 w-full rounded border border-gray-200 text-xs"
      >
        <option value="">Unassigned</option>
        {tables.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
