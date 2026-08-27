"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";

const LoginSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }),
  password: z.string().min(1, { error: "Password is required." }),
});

export type LoginState = { error?: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const { email, password } = parsed.data;

  const admin = await prisma.admin.findUnique({ where: { email } });
  // Compare against a dummy hash when no admin is found so the response
  // timing doesn't reveal whether the email exists.
  const passwordMatches = await verifyPassword(
    password,
    admin?.passwordHash ??
      "$2a$12$CwTycUXWue0Thq9StjUM0uJ8nOwFFwFsjLC1Q0hHoxSDDsQhkNyLm",
  );

  if (!admin || !passwordMatches) {
    return { error: "Incorrect email or password." };
  }

  await createSession({ adminId: admin.id, role: admin.role });
  redirect("/admin");
}
