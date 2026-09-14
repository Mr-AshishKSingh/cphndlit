"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin, requireSession } from "@/lib/auth";

export async function createTask(_prevState: { error?: string }, formData: FormData) {
  const session = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const assignedToId = String(formData.get("assignedToId") ?? "");
  const priority = String(formData.get("priority") ?? "MEDIUM") as "LOW" | "MEDIUM" | "HIGH";
  const dueDate = String(formData.get("dueDate") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!title || !assignedToId) {
    return { error: "Title and assignee are required." };
  }

  await prisma.task.create({
    data: {
      title,
      description,
      assignedToId,
      assignedById: session.userId,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return {};
}

export async function updateTaskStatus(formData: FormData) {
  const session = await requireSession();
  const taskId = String(formData.get("taskId") ?? "");
  const status = String(formData.get("status") ?? "TODO") as "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  if (!taskId) return;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return;
  if (session.role !== "ADMIN" && task.assignedToId !== session.employeeId) return;

  await prisma.task.update({
    where: { id: taskId },
    data: { status, completedAt: status === "DONE" ? new Date() : null },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTask(taskId: string) {
  await requireAdmin();
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
