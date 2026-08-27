import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

// Optimistic auth check only — every Server Action / Server Component still
// re-verifies via the DAL (src/lib/dal.ts). See REQUIREMENTS.md section 5:
// this exists to keep unauthenticated visitors out of /admin/*, not as the
// sole line of defense.
const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (PUBLIC_ADMIN_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("admin_session")?.value;
  const session = await decrypt(cookie);

  if (!session?.adminId) {
    const loginUrl = new URL("/admin/login", req.nextUrl);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
