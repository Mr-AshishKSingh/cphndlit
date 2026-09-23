"use server";

import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { checkTaskAccess } from "@/lib/task-access";
import { logActivity } from "@/lib/activity";

export async function saveSubmissionNotes(_prevState: { error?: string; success?: boolean }, formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!taskId) return { error: "Missing task." };

  const access = await checkTaskAccess(taskId);
  if (!access) return { error: "You don't have access to this task." };

  await prisma.task.update({
    where: { id: taskId },
    data: { submissionNotes: notes, submittedAt: new Date() },
  });

  await logActivity({
    userId: access.session.userId,
    employeeId: access.session.employeeId,
    type: "ACTION",
    description: `Submitted write-up for task "${access.task.title}"`,
  });

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/tasks");
  return { success: true };
}

export async function uploadTaskAttachment(_prevState: { error?: string }, formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "");
  const file = formData.get("file") as File | null;

  if (!taskId || !file || file.size === 0) {
    return { error: "Please choose a file to upload." };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { error: "File must be under 20MB." };
  }

  const access = await checkTaskAccess(taskId);
  if (!access) return { error: "You don't have access to this task." };

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blob = await put(`tasks/${taskId}/${Date.now()}-${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  await prisma.task.update({
    where: { id: taskId },
    data: { submittedAt: new Date() },
  });

  await prisma.taskAttachment.create({
    data: {
      taskId,
      name: file.name,
      url: blob.url,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
      uploadedById: access.session.userId,
    },
  });

  await logActivity({
    userId: access.session.userId,
    employeeId: access.session.employeeId,
    type: "ACTION",
    description: `Uploaded "${file.name}" to task "${access.task.title}"`,
  });

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/tasks");
  return {};
}

export async function reviewTaskAttachment(_prevState: { error?: string }, formData: FormData) {
  const attachmentId = String(formData.get("attachmentId") ?? "");
  const taskId = String(formData.get("taskId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!attachmentId || !taskId || (decision !== "APPROVED" && decision !== "CHANGES_REQUESTED")) {
    return { error: "Invalid request." };
  }

  const access = await checkTaskAccess(taskId);
  if (!access || access.session.role !== "ADMIN") {
    return { error: "Only an admin can review files." };
  }
  if (decision === "CHANGES_REQUESTED" && !note) {
    return { error: "Explain what needs to be fixed on this file." };
  }

  const attachment = await prisma.taskAttachment.findUnique({ where: { id: attachmentId } });
  if (!attachment || attachment.taskId !== taskId) {
    return { error: "File not found." };
  }

  await prisma.taskAttachment.update({
    where: { id: attachmentId },
    data: {
      reviewStatus: decision,
      reviewNote: note,
      reviewedById: access.session.userId,
      reviewedAt: new Date(),
    },
  });

  if (decision === "CHANGES_REQUESTED") {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "IN_PROGRESS", completedAt: null },
    });
  }

  await logActivity({
    userId: access.session.userId,
    employeeId: access.session.employeeId,
    type: "ACTION",
    description:
      decision === "APPROVED"
        ? `Approved file "${attachment.name}" on task "${access.task.title}"`
        : `Requested changes on file "${attachment.name}" on task "${access.task.title}"`,
  });

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/tasks");
  return { success: true };
}

export async function deleteTaskAttachment(attachmentId: string, taskId: string) {
  const access = await checkTaskAccess(taskId);
  if (!access) return;

  const attachment = await prisma.taskAttachment.findUnique({ where: { id: attachmentId } });
  if (!attachment || attachment.taskId !== taskId) return;

  try {
    await del(attachment.url);
  } catch {
    // blob already missing, ignore
  }
  await prisma.taskAttachment.delete({ where: { id: attachmentId } });

  revalidatePath(`/tasks/${taskId}`);
}
