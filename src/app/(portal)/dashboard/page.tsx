import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, addDays, shortWeekday } from "@/lib/date";
import { PageHeader, StatCard, Badge, EmptyState } from "@/components/ui";
import { AttendanceTrendChart, DepartmentPieChart, TaskStatusChart } from "@/components/DashboardCharts";
import { formatCurrency, formatDate, monthName } from "@/lib/format";
import { taskStatusTone, taskPriorityTone, humanize } from "@/lib/status";
import {
  Users,
  CalendarCheck,
  ListChecks,
  Wallet,
  CalendarOff,
  Receipt,
  Pin,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  return session.role === "ADMIN" ? <AdminDashboard /> : <EmployeeDashboard employeeId={session.employeeId!} />;
}

async function AdminDashboard() {
  const now = new Date();
  const today0 = startOfDay(now);
  const today1 = endOfDay(now);

  const [
    totalEmployees,
    presentToday,
    pendingLeave,
    pendingExpenses,
    openTasks,
    payrollAgg,
    departments,
    taskGroups,
    announcements,
  ] = await Promise.all([
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.attendance.count({
      where: { date: { gte: today0, lte: today1 }, status: { in: ["PRESENT", "LATE", "HALF_DAY"] } },
    }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.expense.count({ where: { status: "PENDING" } }),
    prisma.task.count({ where: { status: { in: ["TODO", "IN_PROGRESS"] } } }),
    prisma.payroll.aggregate({
      where: { month: now.getMonth() + 1, year: now.getFullYear() },
      _sum: { netPay: true },
    }),
    prisma.department.findMany({ include: { _count: { select: { employees: true } } } }),
    prisma.task.groupBy({ by: ["status"], _count: true }),
    prisma.announcement.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: { author: { include: { employee: true } } },
    }),
  ]);

  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const day = addDays(now, -i);
    const d0 = startOfDay(day);
    const d1 = endOfDay(day);
    const [present, absent] = await Promise.all([
      prisma.attendance.count({
        where: { date: { gte: d0, lte: d1 }, status: { in: ["PRESENT", "LATE", "HALF_DAY"] } },
      }),
      prisma.attendance.count({ where: { date: { gte: d0, lte: d1 }, status: "ABSENT" } }),
    ]);
    trend.push({ day: shortWeekday(day), present, absent });
  }

  const deptData = departments.map((d) => ({ name: d.name, value: d._count.employees }));
  const taskData = taskGroups.map((g) => ({ name: humanize(g.status), value: g._count }));

  return (
    <div>
      <PageHeader title="Dashboard" description="Company-wide overview" />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard label="Active Employees" value={totalEmployees} icon={Users} tone="indigo" href="/employees" />
        <StatCard label="Present Today" value={presentToday} icon={CalendarCheck} tone="emerald" href="/attendance" />
        <StatCard label="Open Tasks" value={openTasks} icon={ListChecks} tone="sky" href="/tasks" />
        <StatCard label="Pending Leave" value={pendingLeave} icon={CalendarOff} tone="amber" href="/leave" />
        <StatCard label="Pending Expenses" value={pendingExpenses} icon={Receipt} tone="rose" href="/expenses" />
        <StatCard
          label={`Payroll (${monthName(now.getMonth() + 1)})`}
          value={formatCurrency(payrollAgg._sum.netPay ?? 0)}
          icon={Wallet}
          tone="indigo"
          href="/payroll"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Attendance — last 7 days</h2>
          <AttendanceTrendChart data={trend} />
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Headcount by Department</h2>
          <DepartmentPieChart data={deptData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Task Status</h2>
          <TaskStatusChart data={taskData} />
        </div>
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Recent Announcements</h2>
            <Link href="/announcements" className="text-xs text-indigo-600 font-medium hover:underline">
              View all
            </Link>
          </div>
          <AnnouncementList announcements={announcements} />
        </div>
      </div>
    </div>
  );
}

async function EmployeeDashboard({ employeeId }: { employeeId: string }) {
  const now = new Date();
  const today0 = startOfDay(now);
  const today1 = endOfDay(now);
  const year = now.getFullYear();

  const [employee, todayAttendance, openTasks, upcomingTasks, leaveBalances, announcements] = await Promise.all([
    prisma.employee.findUnique({ where: { id: employeeId }, include: { department: true } }),
    prisma.attendance.findFirst({ where: { employeeId, date: { gte: today0, lte: today1 } } }),
    prisma.task.count({ where: { assignedToId: employeeId, status: { in: ["TODO", "IN_PROGRESS"] } } }),
    prisma.task.findMany({
      where: { assignedToId: employeeId, status: { not: "DONE" } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.leaveBalance.findMany({ where: { employeeId, year } }),
    prisma.announcement.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: { author: { include: { employee: true } } },
    }),
  ]);

  const totalRemaining = leaveBalances.reduce((sum, b) => sum + (b.totalDays - b.usedDays), 0);

  return (
    <div>
      <PageHeader title={`Welcome back, ${employee?.firstName ?? ""}`} description={employee?.position} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Today's Status"
          value={todayAttendance ? humanize(todayAttendance.status) : "Not marked"}
          icon={CalendarCheck}
          tone="emerald"
          href="/attendance"
        />
        <StatCard label="Open Tasks" value={openTasks} icon={ListChecks} tone="sky" href="/tasks" />
        <StatCard label="Leave Days Left" value={totalRemaining} icon={CalendarOff} tone="amber" href="/leave" />
        <StatCard label="Department" value={employee?.department?.name ?? "—"} icon={Users} tone="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">My Upcoming Tasks</h2>
            <Link href="/tasks" className="text-xs text-indigo-600 font-medium hover:underline">
              View all
            </Link>
          </div>
          {upcomingTasks.length === 0 ? (
            <EmptyState title="No open tasks" description="You're all caught up." />
          ) : (
            <ul className="space-y-2">
              {upcomingTasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 border border-slate-100 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{t.title}</p>
                    <p className="text-xs text-slate-500">{t.dueDate ? `Due ${formatDate(t.dueDate)}` : "No due date"}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Badge tone={taskPriorityTone[t.priority]}>{humanize(t.priority)}</Badge>
                    <Badge tone={taskStatusTone[t.status]}>{humanize(t.status)}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Announcements</h2>
            <Link href="/announcements" className="text-xs text-indigo-600 font-medium hover:underline">
              View all
            </Link>
          </div>
          <AnnouncementList announcements={announcements} />
        </div>
      </div>
    </div>
  );
}

function AnnouncementList({
  announcements,
}: {
  announcements: {
    id: string;
    title: string;
    body: string;
    pinned: boolean;
    createdAt: Date;
    author: { employee: { firstName: string; lastName: string } | null };
  }[];
}) {
  if (announcements.length === 0) {
    return <EmptyState title="No announcements yet" />;
  }
  return (
    <ul className="space-y-3">
      {announcements.map((a) => (
        <li key={a.id} className="border border-slate-100 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-2">
            {a.pinned && <Pin className="h-3 w-3 text-indigo-600" />}
            <p className="text-sm font-medium text-slate-900">{a.title}</p>
          </div>
          <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{a.body}</p>
          <p className="text-xs text-slate-400 mt-1">
            {a.author.employee ? `${a.author.employee.firstName} ${a.author.employee.lastName}` : "CEO"} ·{" "}
            {formatDate(a.createdAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
