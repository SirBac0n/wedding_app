import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSessionCookie } from "./session";
import { prisma } from "./db";

// Data Access Layer — centralizes auth checks so every Server Action / Server
// Component / Route Handler that touches admin data goes through the same
// verification, per REQUIREMENTS.md section 5 (roles must be enforced
// server-side, not just hidden in the UI).

export const verifySession = cache(async () => {
  const session = await readSessionCookie();
  if (!session?.adminId) {
    redirect("/admin/login");
  }
  return session;
});

// Optimistic-only variant for places that want to branch without forcing a
// redirect (e.g. the login page checking if already signed in).
export const getOptionalSession = cache(async () => {
  return readSessionCookie();
});

export const getCurrentAdmin = cache(async () => {
  const session = await verifySession();
  const admin = await prisma.admin.findUnique({
    where: { id: session.adminId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!admin) {
    redirect("/admin/login");
  }
  return admin;
});

// Full Admin-only actions (registry/cash-fund mgmt, content editing, role
// management, browser-extension tokens — REQUIREMENTS.md section 3).
export async function requireFullAdmin() {
  const admin = await getCurrentAdmin();
  if (admin.role !== "FULL_ADMIN") {
    throw new Error("Forbidden: this action requires Full Admin access");
  }
  return admin;
}
