import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "./db";

// Personalized-link tokens for guest outreach (REQUIREMENTS.md section 4.4).
// Unlike the RSVP "no code to lose" design, this token is generated and sent
// directly by the admin to a contact method they already trust — the guest
// never has to remember or type it, they just click the link. Only the hash
// is stored (matches the ExtensionToken/OutreachMessage pattern already used
// elsewhere), so a database read alone can't produce a usable link.

export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(24).toString("base64url");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export type ResolvedInvite = {
  householdId: string;
  greetingName: string;
};

// Resolves a raw token from an /invite/[token] link. Not single-use — a
// guest can revisit the same link to update their address until it expires,
// see REQUIREMENTS.md section 4.4. `usedAt` is updated as a last-used
// timestamp for admin visibility, not a consumption flag.
export async function resolveInviteToken(raw: string): Promise<ResolvedInvite | null> {
  const hash = hashToken(raw);
  const message = await prisma.outreachMessage.findUnique({
    where: { tokenHash: hash },
    select: {
      expiresAt: true,
      household: {
        select: {
          id: true,
          displayName: true,
          guests: { select: { firstName: true }, orderBy: { firstName: "asc" }, take: 1 },
        },
      },
    },
  });

  if (!message || message.expiresAt < new Date()) {
    return null;
  }

  await prisma.outreachMessage.update({
    where: { tokenHash: hash },
    data: { usedAt: new Date() },
  });

  return {
    householdId: message.household.id,
    greetingName: message.household.guests[0]?.firstName ?? message.household.displayName,
  };
}
