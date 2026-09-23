import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "amber" | "indigo" | "emerald";
  createdAt: string;
};

const SINCE_DAYS = 7;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = new Date(Date.now() - SINCE_DAYS * 24 * 60 * 60 * 1000);
  const items: NotificationItem[] = [];

  if (session.role === "ADMIN") {
    const [pendingLeave, pendingExpenses, awaitingReview] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: { status: "PENDING" },
        include: { employee: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.expense.findMany({
        where: { status: "PENDING" },
        include: { employee: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.task.findMany({
        where: { submittedAt: { not: null }, status: { not: "DONE" } },
        include: { assignedTo: true },
        orderBy: { submittedAt: "desc" },
        take: 8,
      }),
    ]);

    for (const l of pendingLeave) {
      items.push({
        id: `leave-${l.id}`,
        title: `${l.employee.firstName} ${l.employee.lastName} requested leave`,
        description: `${l.type.charAt(0)}${l.type.slice(1).toLowerCase()} leave — awaiting your approval`,
        href: "/leave",
        tone: "amber",
        createdAt: l.createdAt.toISOString(),
      });
    }
    for (const e of pendingExpenses) {
      items.push({
        id: `expense-${e.id}`,
        title: `${e.employee.firstName} ${e.employee.lastName} submitted an expense`,
        description: `"${e.title}" — awaiting your approval`,
        href: "/expenses",
        tone: "amber",
        createdAt: e.createdAt.toISOString(),
      });
    }
    for (const t of awaitingReview) {
      items.push({
        id: `task-${t.id}`,
        title: `${t.assignedTo.firstName} ${t.assignedTo.lastName} submitted work`,
        description: `Task "${t.title}" is ready for your review`,
        href: `/tasks/${t.id}`,
        tone: "indigo",
        createdAt: (t.submittedAt ?? t.updatedAt).toISOString(),
      });
    }
  } else if (session.employeeId) {
    const [reviewedLeave, reviewedExpenses, taskComments] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: { employeeId: session.employeeId, status: { not: "PENDING" }, reviewedAt: { gte: since } },
        orderBy: { reviewedAt: "desc" },
        take: 8,
      }),
      prisma.expense.findMany({
        where: { employeeId: session.employeeId, status: { not: "PENDING" }, reviewedAt: { gte: since } },
        orderBy: { reviewedAt: "desc" },
        take: 8,
      }),
      prisma.taskComment.findMany({
        where: {
          createdAt: { gte: since },
          authorId: { not: session.userId },
          task: { assignedToId: session.employeeId },
        },
        include: { task: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

    for (const l of reviewedLeave) {
      items.push({
        id: `leave-${l.id}`,
        title: `Your leave request was ${l.status.toLowerCase()}`,
        description: `${l.type.charAt(0)}${l.type.slice(1).toLowerCase()} leave`,
        href: "/leave",
        tone: l.status === "APPROVED" ? "emerald" : "amber",
        createdAt: (l.reviewedAt ?? l.createdAt).toISOString(),
      });
    }
    for (const e of reviewedExpenses) {
      items.push({
        id: `expense-${e.id}`,
        title: `Your expense was ${e.status.toLowerCase()}`,
        description: `"${e.title}"`,
        href: "/expenses",
        tone: e.status === "APPROVED" ? "emerald" : "amber",
        createdAt: (e.reviewedAt ?? e.createdAt).toISOString(),
      });
    }
    for (const c of taskComments) {
      items.push({
        id: `comment-${c.id}`,
        title:
          c.action === "APPROVED"
            ? `Your work on "${c.task.title}" was approved`
            : c.action === "CHANGES_REQUESTED"
              ? `Changes requested on "${c.task.title}"`
              : `New comment on "${c.task.title}"`,
        description: c.body.length > 80 ? `${c.body.slice(0, 80)}…` : c.body,
        href: `/tasks/${c.taskId}`,
        tone: c.action === "APPROVED" ? "emerald" : c.action === "CHANGES_REQUESTED" ? "amber" : "indigo",
        createdAt: c.createdAt.toISOString(),
      });
    }
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ count: items.length, items: items.slice(0, 12) });
}
