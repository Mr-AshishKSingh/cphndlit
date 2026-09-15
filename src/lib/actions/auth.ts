"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession, destroySession, getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export type LoginState = { error?: string };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { employee: true },
  });

  if (!user) {
    return { error: "Invalid email or password." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  await createSession({
    userId: user.id,
    role: user.role,
    employeeId: user.employeeId,
    email: user.email,
    name: user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : "CEO Admin",
  });

  await logActivity({ userId: user.id, employeeId: user.employeeId, type: "LOGIN", description: "Logged in" });

  redirect("/dashboard");
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await logActivity({ userId: session.userId, employeeId: session.employeeId, type: "LOGOUT", description: "Logged out" });
  }
  await destroySession();
  redirect("/login");
}
