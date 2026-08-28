import "server-only";
import { prisma } from "./db";
import { lastFourDigits } from "./phone";

// Shared name + disambiguator lookup (REQUIREMENTS.md section 4.5, reused by
// 4.6 table lookup "the exact same name + disambiguator flow as RSVP"). A
// name match within one household needs no extra step; a match spanning
// multiple households requires the last 4 digits of phone (or full email if
// only email is on file) before anything is revealed.

function tokenize(name: string): string[] {
  return name.toLowerCase().split(/\s+/).filter(Boolean);
}

export async function findHouseholdIdsByName(name: string): Promise<string[]> {
  const words = tokenize(name);
  const guests = await prisma.guest.findMany({
    select: { householdId: true, firstName: true, lastName: true, alias: true },
  });
  const ids = new Set<string>();
  for (const g of guests) {
    const haystack = `${g.firstName} ${g.lastName} ${g.alias ?? ""}`.toLowerCase();
    if (words.every((w) => haystack.includes(w))) {
      ids.add(g.householdId);
    }
  }
  return Array.from(ids);
}

// Resolves a name to a single household, verifying against phone/email when
// the name alone matches more than one. Returns null on no match; throws no
// errors — callers decide how to phrase "needs verification" vs "not found".
export async function verifyHouseholdByNameAndContact(
  name: string,
  verify: string,
): Promise<string | null> {
  const householdIds = await findHouseholdIdsByName(name);
  if (householdIds.length === 0) return null;

  const households = await prisma.household.findMany({
    where: { id: { in: householdIds } },
    select: { id: true, email: true, phone: true },
  });

  const isEmail = verify.includes("@");
  const matches = households.filter((h) => {
    if (isEmail) return h.email?.toLowerCase() === verify.toLowerCase();
    return h.phone ? lastFourDigits(h.phone) === verify.replace(/\D/g, "") : false;
  });

  return matches.length === 1 ? matches[0].id : null;
}
