"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin, requireSession } from "@/lib/auth";
import { parseDateOnly } from "@/lib/date";
import { logActivity } from "@/lib/activity";
import { humanize } from "@/lib/status";

export async function createTask(_prevState: { error?: string }, formData: FormData) {
  const session = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const assignedToId = String(formData.get("assignedToId") ?? "");
  const assignToAll = formData.get("assignToAll") === "on";
  const priority = String(formData.get("priority") ?? "MEDIUM") as "LOW" | "MEDIUM" | "HIGH";
  const dueDateStr = String(formData.get("dueDate") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;
  const dueDate = dueDateStr ? parseDateOnly(dueDateStr) : null;

  if (!title) {
    return { error: "Title is required." };
  }
  if (!assignToAll && !assignedToId) {
    return { error: "Choose an employee, or assign to all employees." };
  }

  if (assignToAll) {
    const employees = await prisma.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    });
    if (employees.length === 0) {
      return { error: "There are no active employees to assign this to." };
    }
    await prisma.task.createMany({
      data: employees.map((e) => ({
        title,
        description,
        assignedToId: e.id,
        assignedById: session.userId,
        priority,
        dueDate,
      })),
    });
  } else {
    await prisma.task.create({
      data: {
        title,
        description,
        assignedToId,
        assignedById: session.userId,
        priority,
        dueDate,
      },
    });
  }

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

  await logActivity({
    userId: session.userId,
    employeeId: session.employeeId,
    type: "ACTION",
    description: `Changed task "${task.title}" to ${humanize(status)}`,
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/dashboard");
}

export async function deleteTask(taskId: string) {
  await requireAdmin();
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  redirect("/tasks");
}
