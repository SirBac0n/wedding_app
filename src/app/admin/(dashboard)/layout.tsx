import Link from "next/link";
import { getCurrentAdmin } from "@/lib/dal";
import { logout } from "../actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/admin/guests">Guests</Link>
          </nav>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>
              {admin.name} · {admin.role === "FULL_ADMIN" ? "Full Admin" : "Family Admin"}
            </span>
            <form action={logout}>
              <button type="submit" className="text-gray-500 underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
