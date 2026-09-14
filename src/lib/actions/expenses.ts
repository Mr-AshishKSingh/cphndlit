"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, requireAdmin } from "@/lib/auth";
import { parseDateOnly } from "@/lib/date";

export async function submitExpense(_prevState: { error?: string }, formData: FormData) {
  const session = await requireSession();
  if (!session.employeeId) return { error: "No employee profile linked to this account." };

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const date = String(formData.get("date") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!title || !category || !date || !amount || amount <= 0) {
    return { error: "Please fill in all required fields with a valid amount." };
  }

  await prisma.expense.create({
    data: {
      employeeId: session.employeeId,
      title,
      category,
      amount,
      date: parseDateOnly(date),
      description,
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return {};
}

export async function reviewExpense(formData: FormData) {
  const session = await requireAdmin();
  const expenseId = String(formData.get("expenseId") ?? "");
  const decision = String(formData.get("decision") ?? "") as "APPROVED" | "REJECTED";
  if (!expenseId || !decision) return;

  await prisma.expense.update({
    where: { id: expenseId },
    data: { status: decision, reviewedById: session.userId, reviewedAt: new Date() },
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}
