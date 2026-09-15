import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Avatar, EmptyState } from "@/components/ui";
import { startOfDay, endOfDay } from "@/lib/date";
import { formatDateTime, formatDuration, timeAgo } from "@/lib/format";
import { clsx } from "clsx";
import { LogIn, LogOut, Eye, Zap, Circle } from "lucide-react";

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  PAGE_VIEW: Eye,
  ACTION: Zap,
};

const TYPE_COLOR: Record<string, string> = {
  LOGIN: "text-emerald-600 bg-emerald-50",
  LOGOUT: "text-slate-500 bg-slate-100",
  PAGE_VIEW: "text-sky-600 bg-sky-50",
  ACTION: "text-indigo-600 bg-indigo-50",
};

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ employee?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  if (session.role !== "ADMIN") redirect("/dashboard");

  const { employee: employeeFilter } = await searchParams;

  const now = new Date();
  const today0 = startOfDay(now);
  const today1 = endOfDay(now);

  const [employees, lastLogins, todaySpans, activities] = await Promise.all([
    prisma.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, avatarColor: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.activityLog.groupBy({
      by: ["employeeId"],
      where: { type: "LOGIN", employeeId: { not: null } },
      _max: { createdAt: true },
    }),
    prisma.activityLog.groupBy({
      by: ["employeeId"],
      where: { employeeId: { not: null }, createdAt: { gte: today0, lte: today1 } },
      _min: { createdAt: true },
      _max: { createdAt: true },
    }),
    prisma.activityLog.findMany({
      where: employeeFilter ? { employeeId: employeeFilter } : {},
      orderBy: { createdAt: "desc" },
      take: 150,
      include: { user: { include: { employee: true } } },
    }),
  ]);

  const lastLoginMap = new Map(lastLogins.map((l) => [l.employeeId, l._max.createdAt]));
  const todaySpanMap = new Map(
    todaySpans.map((s) => [s.employeeId, { first: s._min.createdAt!, last: s._max.createdAt! }])
  );

  return (
    <div>
      <PageHeader title="Activity" description="Login times, actions, and time spent per employee" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {employees.map((e) => {
          const lastLogin = lastLoginMap.get(e.id);
          const span = todaySpanMap.get(e.id);
          const isOnline = span && now.getTime() - span.last.getTime() < 10 * 60 * 1000;
          const activeName = employeeFilter === e.id;
          return (
            <Link
              key={e.id}
              href={activeName ? "/activity" : `/activity?employee=${e.id}`}
              className={clsx("card p-4 card-interactive block", activeName && "ring-2 ring-indigo-500/50")}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar name={`${e.firstName} ${e.lastName}`} color={e.avatarColor} size={9} />
                  {isOnline && (
                    <Circle className="h-3 w-3 absolute -bottom-0.5 -right-0.5 text-emerald-500 fill-emerald-500 stroke-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {e.firstName} {e.lastName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lastLogin ? `Last login ${timeAgo(lastLogin)}` : "Never logged in"}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Active today</span>
                <span className="font-medium text-slate-900">
                  {span ? formatDuration(span.last.getTime() - span.first.getTime()) : "—"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">
            {employeeFilter
              ? `Activity — ${employees.find((e) => e.id === employeeFilter)?.firstName ?? ""}`
              : "All activity"}
          </h2>
          {employeeFilter && (
            <Link href="/activity" className="text-xs text-indigo-600 font-medium hover:underline">
              Clear filter
            </Link>
          )}
        </div>

        {activities.length === 0 ? (
          <EmptyState title="No activity recorded yet" />
        ) : (
          <ul className="space-y-2">
            {activities.map((a) => {
              const Icon = TYPE_ICON[a.type] ?? Zap;
              const name = a.user.employee ? `${a.user.employee.firstName} ${a.user.employee.lastName}` : "CEO";
              return (
                <li key={a.id} className="flex items-center gap-3 py-1.5">
                  <div className={clsx("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", TYPE_COLOR[a.type])}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium text-slate-900">{name}</span> — {a.description}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{formatDateTime(a.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
