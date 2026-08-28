import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { isLinkPlatform, PAYMENT_PLATFORM_LABELS } from "@/lib/payment-link";

// Reads live registry/cash-fund data with no other dynamic API call, so it
// would otherwise get prerendered once at build time (same reasoning as
// /, /address, /rsvp, /table, /invite/[token]).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Registry",
};

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function RegistryPage() {
  const [registryItems, cashFunds] = await Promise.all([
    prisma.registryItem.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.cashFund.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const hasContent = registryItems.length > 0 || cashFunds.length > 0;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-10">
      <h1 className="text-2xl font-semibold">Registry</h1>

      {!hasContent && <p className="text-gray-500">Our registry is coming soon — check back later!</p>}

      {registryItems.length > 0 && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {registryItems.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-400"
            >
              {item.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- external URL, no image domain config
                <img src={item.logoUrl} alt="" className="h-10 w-10 rounded object-contain" />
              )}
              <span className="font-medium">{item.title}</span>
            </a>
          ))}
        </section>
      )}

      {cashFunds.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Cash Funds</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {cashFunds.map((fund) => {
              const pct =
                fund.goalAmountCents && fund.goalAmountCents > 0
                  ? Math.min(100, Math.round((fund.amountRaisedCents / fund.goalAmountCents) * 100))
                  : null;
              return (
                <div
                  key={fund.id}
                  className="flex flex-col gap-2 rounded border border-gray-200 bg-white p-4 shadow-sm"
                >
                  {fund.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- external URL, no image domain config
                    <img src={fund.imageUrl} alt="" className="h-32 w-full rounded object-cover" />
                  )}
                  <span className="font-medium">{fund.title}</span>
                  {fund.description && <p className="text-sm text-gray-600">{fund.description}</p>}
                  {pct !== null && (
                    <div className="flex flex-col gap-1">
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div className="h-2 rounded-full bg-gray-900" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatCents(fund.amountRaisedCents)} of {formatCents(fund.goalAmountCents!)} raised
                      </p>
                    </div>
                  )}
                  {fund.status === "FULFILLED" ? (
                    <p className="text-sm font-medium text-green-700">Fully funded — thank you!</p>
                  ) : fund.status === "RESERVED" ? (
                    <p className="text-sm font-medium text-amber-700">
                      Already claimed by another guest — thank you!
                    </p>
                  ) : isLinkPlatform(fund.paymentPlatform) ? (
                    <a
                      href={fund.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 self-start rounded bg-gray-900 px-4 py-2 text-sm text-white"
                    >
                      {fund.paymentPlatform === "OTHER"
                        ? "Contribute"
                        : `Pay with ${PAYMENT_PLATFORM_LABELS[fund.paymentPlatform]}`}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Send via Zelle to{" "}
                      <a
                        href={
                          fund.paymentLink.includes("@")
                            ? `mailto:${fund.paymentLink}`
                            : `tel:${fund.paymentLink}`
                        }
                        className="font-medium underline"
                      >
                        {fund.paymentLink}
                      </a>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
