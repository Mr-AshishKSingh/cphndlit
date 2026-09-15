"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { checkTaskAccess } from "@/lib/task-access";

export async function postTaskComment(_prevState: { error?: string }, formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const decision = String(formData.get("decision") ?? "");
  if (!taskId) return { error: "Missing task." };

  const access = await checkTaskAccess(taskId);
  if (!access) return { error: "You don't have access to this task." };

  if (decision === "APPROVE" || decision === "REQUEST_CHANGES") {
    if (access.session.role !== "ADMIN") {
      return { error: "Only an admin can approve work or request changes." };
    }
    if (decision === "REQUEST_CHANGES" && !body) {
      return { error: "Explain what needs to be improved." };
    }

    await prisma.taskComment.create({
      data: {
        taskId,
        authorId: access.session.userId,
        body: body || "Approved — nice work.",
        action: decision === "APPROVE" ? "APPROVED" : "CHANGES_REQUESTED",
      },
    });

    await prisma.task.update({
      where: { id: taskId },
      data:
        decision === "APPROVE"
          ? { status: "DONE", completedAt: new Date() }
          : { status: "IN_PROGRESS", completedAt: null },
    });

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
  } else {
    if (!body) return { error: "Write something before posting." };
    await prisma.taskComment.create({
      data: { taskId, authorId: access.session.userId, body },
    });
  }

  revalidatePath(`/tasks/${taskId}`);
  return {};
}
