"use server";

import { revalidatePath } from "next/cache";
import { differenceInCalendarDays } from "date-fns";
import { prisma } from "@/lib/db";
import { requireSession, requireAdmin } from "@/lib/auth";
import { parseDateOnly } from "@/lib/date";
import { logActivity } from "@/lib/activity";
import { humanize } from "@/lib/status";

export async function requestLeave(_prevState: { error?: string }, formData: FormData) {
  const session = await requireSession();
  if (!session.employeeId) return { error: "No employee profile linked to this account." };

  const type = String(formData.get("type") ?? "") as "SICK" | "CASUAL" | "VACATION" | "UNPAID" | "OTHER";
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!type || !startDate || !endDate) {
    return { error: "Please fill in all required fields." };
  }
  if (parseDateOnly(endDate) < parseDateOnly(startDate)) {
    return { error: "End date must be after start date." };
  }

  await prisma.leaveRequest.create({
    data: {
      employeeId: session.employeeId,
      type,
      startDate: parseDateOnly(startDate),
      endDate: parseDateOnly(endDate),
      reason,
    },
  });

  await logActivity({
    userId: session.userId,
    employeeId: session.employeeId,
    type: "ACTION",
    description: `Requested ${humanize(type)} leave`,
  });

  revalidatePath("/leave");
  revalidatePath("/dashboard");
  return {};
}

export async function reviewLeave(formData: FormData) {
  const session = await requireAdmin();
  const requestId = String(formData.get("requestId") ?? "");
  const decision = String(formData.get("decision") ?? "") as "APPROVED" | "REJECTED";
  if (!requestId || !decision) return;

  const leave = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
  if (!leave || leave.status !== "PENDING") return;

  await prisma.leaveRequest.update({
    where: { id: requestId },
    data: { status: decision, reviewedById: session.userId, reviewedAt: new Date() },
  });

  if (decision === "APPROVED" && leave.type !== "UNPAID" && leave.type !== "OTHER") {
    const days = differenceInCalendarDays(leave.endDate, leave.startDate) + 1;
    const year = leave.startDate.getFullYear();
    await prisma.leaveBalance.upsert({
      where: { employeeId_type_year: { employeeId: leave.employeeId, type: leave.type, year } },
      update: { usedDays: { increment: days } },
      create: { employeeId: leave.employeeId, type: leave.type, year, totalDays: 10, usedDays: days },
    });
  }

  revalidatePath("/leave");
  revalidatePath("/dashboard");
  revalidatePath(`/employees/${leave.employeeId}`);
}
