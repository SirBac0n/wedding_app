import { redirect } from "next/navigation";
import { getOptionalSession } from "@/lib/dal";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getOptionalSession();
  if (session?.adminId) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Admin Sign In</h1>
        <p className="text-sm text-gray-500">
          Wedding site admin dashboard
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
