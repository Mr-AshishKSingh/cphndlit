import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ employees: [], tasks: [] });
  }

  const isAdmin = session.role === "ADMIN";

  const [employees, tasks] = await Promise.all([
    isAdmin
      ? prisma.employee.findMany({
          where: {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { employeeCode: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, firstName: true, lastName: true, position: true, avatarColor: true },
          take: 6,
        })
      : Promise.resolve([]),
    prisma.task.findMany({
      where: {
        title: { contains: q, mode: "insensitive" },
        ...(isAdmin ? {} : { assignedToId: session.employeeId ?? "" }),
      },
      select: { id: true, title: true, status: true },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ employees, tasks });
}
