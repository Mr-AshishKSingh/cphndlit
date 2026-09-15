import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function checkTaskAccess(taskId: string) {
  const session = await requireSession();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return null;
  const isOwner = task.assignedToId === session.employeeId;
  if (session.role !== "ADMIN" && !isOwner) return null;
  return { session, task };
}
