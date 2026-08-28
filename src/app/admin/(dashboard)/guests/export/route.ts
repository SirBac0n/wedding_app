import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { toCsvRow } from "@/lib/csv";

// Mail-merge-ready mailing list export (REQUIREMENTS.md section 4.3): one row
// per household, name + full address, ready to drop into a label/mail-merge
// template for addressing invites.
export async function GET() {
  await verifySession();

  const households = await prisma.household.findMany({
    orderBy: { displayName: "asc" },
    include: { guests: { orderBy: { firstName: "asc" } } },
  });

  const header = toCsvRow([
    "Household",
    "Guest Names",
    "Address Line 1",
    "Address Line 2",
    "City",
    "State",
    "Postal Code",
    "Country",
    "Email",
    "Phone",
  ]);

  const rows = households.map((h) =>
    toCsvRow([
      h.displayName,
      h.guests.map((g) => `${g.firstName} ${g.lastName}`).join("; "),
      h.addressLine1,
      h.addressLine2,
      h.city,
      h.state,
      h.postalCode,
      h.country,
      h.email,
      h.phone,
    ]),
  );

  const csv = [header, ...rows].join("\r\n") + "\r\n";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="guest-mailing-list.csv"`,
    },
  });
}
