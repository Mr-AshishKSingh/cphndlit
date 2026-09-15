"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, requireAdmin } from "@/lib/auth";
import { startOfDay, endOfDay, parseDateOnly } from "@/lib/date";
import { logActivity } from "@/lib/activity";

export async function clockIn() {
  const session = await requireSession();
  if (!session.employeeId) return { error: "No employee profile linked to this account." };

  const now = new Date();
  const today0 = startOfDay(now);

  const existing = await prisma.attendance.findFirst({
    where: { employeeId: session.employeeId, date: { gte: today0, lte: endOfDay(now) } },
  });
  if (existing?.clockIn) return { error: "Already clocked in today." };

  const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);

  if (existing) {
    await prisma.attendance.update({
      where: { id: existing.id },
      data: { clockIn: now, status: isLate ? "LATE" : "PRESENT" },
    });
  } else {
    await prisma.attendance.create({
      data: {
        employeeId: session.employeeId,
        date: today0,
        clockIn: now,
        status: isLate ? "LATE" : "PRESENT",
      },
    });
  }

  await logActivity({
    userId: session.userId,
    employeeId: session.employeeId,
    type: "ACTION",
    description: isLate ? "Clocked in (late)" : "Clocked in",
  });

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return {};
}

export async function clockOut() {
  const session = await requireSession();
  if (!session.employeeId) return { error: "No employee profile linked to this account." };

  const now = new Date();
  const existing = await prisma.attendance.findFirst({
    where: { employeeId: session.employeeId, date: { gte: startOfDay(now), lte: endOfDay(now) } },
  });
  if (!existing || !existing.clockIn) return { error: "You haven't clocked in yet today." };
  if (existing.clockOut) return { error: "Already clocked out today." };

  await prisma.attendance.update({ where: { id: existing.id }, data: { clockOut: now } });
  await logActivity({
    userId: session.userId,
    employeeId: session.employeeId,
    type: "ACTION",
    description: "Clocked out",
  });
  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return {};
}

export async function markAttendance(formData: FormData) {
  await requireAdmin();
  const employeeId = String(formData.get("employeeId") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  const status = String(formData.get("status") ?? "PRESENT") as
    | "PRESENT"
    | "ABSENT"
    | "LATE"
    | "HALF_DAY"
    | "ON_LEAVE";
  if (!employeeId || !dateStr) return;

  const date = parseDateOnly(dateStr);

  await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId, date } },
    update: { status },
    create: { employeeId, date, status },
  });

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
}
