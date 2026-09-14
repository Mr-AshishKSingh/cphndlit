import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Avatar, Badge, EmptyState } from "@/components/ui";
import { leaveStatusTone, humanize } from "@/lib/status";
import { formatDate } from "@/lib/format";
import { LeaveRequestForm } from "@/components/LeaveRequestForm";
import { reviewLeave } from "@/lib/actions/leave";
import { differenceInCalendarDays } from "date-fns";

export default async function LeavePage() {
  const session = await getSession();
  if (!session) return null;
  const isAdmin = session.role === "ADMIN";

  const year = new Date().getFullYear();

  const [requests, balances] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: isAdmin ? {} : { employeeId: session.employeeId! },
      include: { employee: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    isAdmin
      ? Promise.resolve([])
      : prisma.leaveBalance.findMany({ where: { employeeId: session.employeeId!, year } }),
  ]);

  return (
    <div>
      <PageHeader title="Leave" description={isAdmin ? "Review and approve requests" : "Request and track your leave"} />

      {!isAdmin && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {balances.map((b) => (
              <div key={b.id} className="card p-4 text-center">
                <p className="text-xs text-slate-500">{humanize(b.type)}</p>
                <p className="text-xl font-semibold text-slate-900">{b.totalDays - b.usedDays}</p>
                <p className="text-xs text-slate-400">of {b.totalDays} days left</p>
              </div>
            ))}
          </div>
          <LeaveRequestForm />
        </>
      )}

      {requests.length === 0 ? (
        <EmptyState title="No leave requests" />
      ) : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {isAdmin && <th>Employee</th>}
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                {isAdmin && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const days = differenceInCalendarDays(r.endDate, r.startDate) + 1;
                return (
                  <tr key={r.id}>
                    {isAdmin && (
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={`${r.employee.firstName} ${r.employee.lastName}`} color={r.employee.avatarColor} size={6} />
                          <span className="font-medium text-slate-900">
                            {r.employee.firstName} {r.employee.lastName}
                          </span>
                        </div>
                      </td>
                    )}
                    <td>{humanize(r.type)}</td>
                    <td>{formatDate(r.startDate)}</td>
                    <td>{formatDate(r.endDate)}</td>
                    <td>{days}</td>
                    <td className="max-w-[200px] truncate">{r.reason ?? "—"}</td>
                    <td>
                      <Badge tone={leaveStatusTone[r.status]}>{humanize(r.status)}</Badge>
                    </td>
                    {isAdmin && (
                      <td>
                        {r.status === "PENDING" ? (
                          <div className="flex gap-2">
                            <form action={reviewLeave}>
                              <input type="hidden" name="requestId" value={r.id} />
                              <input type="hidden" name="decision" value="APPROVED" />
                              <button type="submit" className="btn-secondary !py-1 !px-2 !text-xs">
                                Approve
                              </button>
                            </form>
                            <form action={reviewLeave}>
                              <input type="hidden" name="requestId" value={r.id} />
                              <input type="hidden" name="decision" value="REJECTED" />
                              <button type="submit" className="btn-ghost !py-1 !px-2 !text-xs text-red-600">
                                Reject
                              </button>
                            </form>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
