import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, addDays, parseDateOnly, toDateInputValue } from "@/lib/date";
import { PageHeader, Avatar, Badge, EmptyState } from "@/components/ui";
import { attendanceTone, humanize } from "@/lib/status";
import { formatDate, formatTime } from "@/lib/format";
import { AttendanceStatusSelect } from "@/components/AttendanceStatusSelect";
import { ClockWidget } from "@/components/ClockWidget";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { date } = await searchParams;
  const selectedDate = date ? parseDateOnly(date) : new Date();

  if (session.role === "ADMIN") {
    return <AdminAttendance selectedDate={selectedDate} />;
  }
  return <EmployeeAttendance employeeId={session.employeeId!} />;
}

async function AdminAttendance({ selectedDate }: { selectedDate: Date }) {
  const d0 = startOfDay(selectedDate);
  const d1 = endOfDay(selectedDate);
  const dateInput = toDateInputValue(d0);

  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    orderBy: { firstName: "asc" },
    include: {
      attendances: { where: { date: { gte: d0, lte: d1 } } },
    },
  });

  const presentCount = employees.filter((e) =>
    e.attendances.some((a) => ["PRESENT", "LATE", "HALF_DAY"].includes(a.status))
  ).length;

  return (
    <div>
      <PageHeader
        title="Attendance"
        description={`${presentCount} of ${employees.length} present on ${formatDate(d0)}`}
      />

      <form className="card p-4 mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Date</label>
          <input type="date" name="date" defaultValue={dateInput} className="input" />
        </div>
        <button type="submit" className="btn-secondary">
          View
        </button>
        <div className="flex gap-2 ml-auto">
          <a href={`?date=${toDateInputValue(addDays(d0, -1))}`} className="btn-ghost">
            ← Previous day
          </a>
          <a href={`?date=${toDateInputValue(addDays(d0, 1))}`} className="btn-ghost">
            Next day →
          </a>
        </div>
      </form>

      <div className="card table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => {
              const a = e.attendances[0];
              return (
                <tr key={e.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={`${e.firstName} ${e.lastName}`} color={e.avatarColor} size={7} />
                      <span className="font-medium text-slate-900">
                        {e.firstName} {e.lastName}
                      </span>
                    </div>
                  </td>
                  <td>{formatTime(a?.clockIn ?? null)}</td>
                  <td>{formatTime(a?.clockOut ?? null)}</td>
                  <td>
                    <Badge tone={attendanceTone[a?.status ?? "ABSENT"]}>
                      {humanize(a?.status ?? "ABSENT")}
                    </Badge>
                  </td>
                  <td>
                    <AttendanceStatusSelect employeeId={e.id} date={dateInput} status={a?.status ?? "ABSENT"} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function EmployeeAttendance({ employeeId }: { employeeId: string }) {
  const now = new Date();
  const [today, history] = await Promise.all([
    prisma.attendance.findFirst({
      where: { employeeId, date: { gte: startOfDay(now), lte: endOfDay(now) } },
    }),
    prisma.attendance.findMany({
      where: { employeeId, date: { gte: startOfDay(addDays(now, -30)) } },
      orderBy: { date: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Attendance" description="Clock in and view your history" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <ClockWidget
            clockedIn={!!today?.clockIn}
            clockedOut={!!today?.clockOut}
            inTime={today?.clockIn ? formatTime(today.clockIn) : null}
            outTime={today?.clockOut ? formatTime(today.clockOut) : null}
          />
        </div>
        <div className="lg:col-span-2">
          <div className="card table-wrap">
            {history.length === 0 ? (
              <EmptyState title="No attendance yet" description="Your history will show up here." />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((a) => (
                    <tr key={a.id}>
                      <td>{formatDate(a.date)}</td>
                      <td>{formatTime(a.clockIn)}</td>
                      <td>{formatTime(a.clockOut)}</td>
                      <td>
                        <Badge tone={attendanceTone[a.status]}>{humanize(a.status)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
