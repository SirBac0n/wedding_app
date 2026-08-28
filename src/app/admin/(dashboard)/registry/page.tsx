import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireFullAdmin } from "@/lib/dal";
import { ConfirmSubmitButton } from "../guests/confirm-submit-button";
import { PaymentLinkField } from "./payment-link-field";
import {
  createRegistryItem,
  updateRegistryItem,
  deleteRegistryItem,
  createCashFund,
  updateCashFund,
  deleteCashFund,
} from "./actions";

export default async function RegistryAdminPage() {
  await requireFullAdmin();

  const [registryItems, cashFunds] = await Promise.all([
    prisma.registryItem.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.cashFund.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <div>
        <h1 className="text-xl font-semibold">Registry</h1>
        <p className="text-sm text-gray-500">
          Full Admin only. Guests see this at{" "}
          <Link href="/registry" className="underline">
            /registry
          </Link>
          .
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">External Registries</h2>

        {registryItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded border border-gray-200 bg-white p-4"
          >
            <form action={updateRegistryItem.bind(null, item.id)} className="flex flex-col gap-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <TextInput
                  id={`title-${item.id}`}
                  label="Title"
                  name="title"
                  defaultValue={item.title}
                  required
                />
                <TextInput
                  id={`url-${item.id}`}
                  label="URL"
                  name="url"
                  type="url"
                  defaultValue={item.url}
                  required
                />
              </div>
              <TextInput
                id={`logoUrl-${item.id}`}
                label="Logo URL (optional)"
                name="logoUrl"
                type="url"
                defaultValue={item.logoUrl ?? ""}
              />
              <button
                type="submit"
                className="self-start rounded bg-gray-900 px-3 py-1.5 text-sm text-white"
              >
                Save
              </button>
            </form>
            <form action={deleteRegistryItem.bind(null, item.id)}>
              <ConfirmSubmitButton
                confirmMessage={`Remove "${item.title}" from the registry?`}
                className="text-sm text-red-600 underline"
              >
                Delete
              </ConfirmSubmitButton>
            </form>
          </div>
        ))}

        <div className="rounded border border-dashed border-gray-300 p-4">
          <h3 className="mb-2 text-sm font-medium text-gray-700">Add an external registry</h3>
          <form action={createRegistryItem} className="flex flex-col gap-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <TextInput
                id="new-registry-title"
                label="Title"
                name="title"
                placeholder="Amazon"
                required
              />
              <TextInput
                id="new-registry-url"
                label="URL"
                name="url"
                type="url"
                placeholder="https://…"
                required
              />
            </div>
            <TextInput
              id="new-registry-logoUrl"
              label="Logo URL (optional)"
              name="logoUrl"
              type="url"
            />
            <button
              type="submit"
              className="self-start rounded bg-gray-900 px-3 py-1.5 text-sm text-white"
            >
              + Add Registry
            </button>
          </form>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Cash Funds</h2>
        <p className="-mt-2 text-xs text-gray-400">
          &quot;Raised&quot; is admin-updated manually — mark a fund Reserved as soon as
          you&apos;re notified of a contribution, before formally marking it Fulfilled, so
          two guests don&apos;t buy the same item.
        </p>

        {cashFunds.map((fund) => (
          <div
            key={fund.id}
            className="flex flex-col gap-3 rounded border border-gray-200 bg-white p-4"
          >
            <form action={updateCashFund.bind(null, fund.id)} className="flex flex-col gap-2">
              <TextInput
                id={`fund-title-${fund.id}`}
                label="Title"
                name="title"
                defaultValue={fund.title}
                required
              />
              <TextArea
                id={`fund-description-${fund.id}`}
                label="Description"
                name="description"
                defaultValue={fund.description ?? ""}
              />
              <TextInput
                id={`fund-imageUrl-${fund.id}`}
                label="Image URL (optional)"
                name="imageUrl"
                type="url"
                defaultValue={fund.imageUrl ?? ""}
              />
              <PaymentLinkField
                idPrefix={`fund-payment-${fund.id}`}
                defaultPlatform={fund.paymentPlatform}
                defaultLink={fund.paymentLink}
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <TextInput
                  id={`fund-goal-${fund.id}`}
                  label="Goal ($, optional)"
                  name="goalAmount"
                  type="number"
                  step="0.01"
                  defaultValue={
                    fund.goalAmountCents != null ? (fund.goalAmountCents / 100).toFixed(2) : ""
                  }
                />
                <TextInput
                  id={`fund-raised-${fund.id}`}
                  label="Raised ($)"
                  name="amountRaised"
                  type="number"
                  step="0.01"
                  defaultValue={(fund.amountRaisedCents / 100).toFixed(2)}
                />
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor={`fund-status-${fund.id}`}
                    className="text-sm font-medium text-gray-700"
                  >
                    Status
                  </label>
                  <select
                    id={`fund-status-${fund.id}`}
                    name="status"
                    defaultValue={fund.status}
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="OPEN">Open</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="FULFILLED">Fulfilled</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="self-start rounded bg-gray-900 px-3 py-1.5 text-sm text-white"
              >
                Save
              </button>
            </form>
            <form action={deleteCashFund.bind(null, fund.id)}>
              <ConfirmSubmitButton
                confirmMessage={`Remove "${fund.title}" cash fund?`}
                className="text-sm text-red-600 underline"
              >
                Delete
              </ConfirmSubmitButton>
            </form>
          </div>
        ))}

        <div className="rounded border border-dashed border-gray-300 p-4">
          <h3 className="mb-2 text-sm font-medium text-gray-700">Add a cash fund</h3>
          <form action={createCashFund} className="flex flex-col gap-2">
            <TextInput
              id="new-fund-title"
              label="Title"
              name="title"
              placeholder="Honeymoon Fund"
              required
            />
            <TextArea id="new-fund-description" label="Description (optional)" name="description" />
            <TextInput id="new-fund-imageUrl" label="Image URL (optional)" name="imageUrl" type="url" />
            <PaymentLinkField idPrefix="new-fund-payment" />
            <TextInput
              id="new-fund-goal"
              label="Goal ($, optional)"
              name="goalAmount"
              type="number"
              step="0.01"
            />
            <button
              type="submit"
              className="self-start rounded bg-gray-900 px-3 py-1.5 text-sm text-white"
            >
              + Add Cash Fund
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function TextInput({
  id,
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  step,
  hint,
}: {
  id: string;
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  step?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        step={step}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function TextArea({
  id,
  label,
  name,
  defaultValue,
}: {
  id: string;
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        defaultValue={defaultValue}
        rows={2}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
