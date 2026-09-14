import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Avatar, Badge, EmptyState, PageHeader } from "@/components/ui";
import { employeeStatusTone, taskStatusTone, attendanceTone, humanize } from "@/lib/status";
import { formatCurrency, formatDate, formatDateTime, formatTime } from "@/lib/format";
import { DocumentUploadForm } from "@/components/DocumentUploadForm";
import { resetEmployeePassword } from "@/lib/actions/employees";
import { DEFAULT_EMPLOYEE_PASSWORD } from "@/lib/constants";
import { deleteDocument } from "@/lib/actions/documents";
import { DeleteEmployeeButton } from "@/components/DeleteEmployeeButton";
import { Pencil, KeyRound, FileText, Trash2, Download } from "lucide-react";

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      department: true,
      manager: true,
      reports: { select: { id: true, firstName: true, lastName: true, position: true } },
      documents: { orderBy: { uploadedAt: "desc" } },
      leaveBalances: { where: { year: new Date().getFullYear() } },
      attendances: { orderBy: { date: "desc" }, take: 8 },
      tasks: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!employee) notFound();

  const resetPasswordAction = resetEmployeePassword.bind(null, employee.id);

  return (
    <div>
      {created === "1" && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 mb-4">
          Employee created. Login email <strong>{employee.email}</strong>, default password{" "}
          <strong>{DEFAULT_EMPLOYEE_PASSWORD}</strong> — ask them to sign in and change it.
        </div>
      )}

      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description={employee.employeeCode}
        action={
          <div className="flex gap-2">
            <form action={resetPasswordAction}>
              <button type="submit" className="btn-secondary">
                <KeyRound className="h-4 w-4" /> Reset Password
              </button>
            </form>
            <Link href={`/employees/${employee.id}/edit`} className="btn-primary">
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            <DeleteEmployeeButton employeeId={employee.id} name={`${employee.firstName} ${employee.lastName}`} />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5 flex flex-col items-center text-center">
            <Avatar name={`${employee.firstName} ${employee.lastName}`} color={employee.avatarColor} size={16} />
            <h2 className="mt-3 font-semibold text-slate-900">
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-sm text-slate-500">{employee.position}</p>
            <div className="mt-2">
              <Badge tone={employeeStatusTone[employee.status]}>{humanize(employee.status)}</Badge>
            </div>
            <dl className="w-full mt-5 space-y-2 text-left text-sm">
              <Row label="Email" value={employee.email} />
              <Row label="Phone" value={employee.phone ?? "—"} />
              <Row label="Department" value={employee.department?.name ?? "—"} />
              <Row label="Join Date" value={formatDate(employee.joinDate)} />
              <Row label="Reports To" value={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "—"} />
              <Row label="Address" value={employee.address ?? "—"} />
            </dl>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Compensation</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Basic Salary" value={formatCurrency(employee.basicSalary)} />
              <Row label="Allowances" value={formatCurrency(employee.allowances)} />
              <Row label="Monthly Total" value={formatCurrency(employee.basicSalary + employee.allowances)} bold />
              <Row label="Bank" value={employee.bankName ?? "—"} />
              <Row label="Account No." value={employee.bankAccount ?? "—"} />
            </dl>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Leave Balance ({new Date().getFullYear()})</h3>
            {employee.leaveBalances.length === 0 ? (
              <p className="text-sm text-slate-500">No balances set.</p>
            ) : (
              <dl className="space-y-2 text-sm">
                {employee.leaveBalances.map((b) => (
                  <Row
                    key={b.id}
                    label={humanize(b.type)}
                    value={`${b.totalDays - b.usedDays} / ${b.totalDays} days left`}
                  />
                ))}
              </dl>
            )}
          </div>

          {employee.reports.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Direct Reports</h3>
              <ul className="space-y-2">
                {employee.reports.map((r) => (
                  <li key={r.id}>
                    <Link href={`/employees/${r.id}`} className="text-sm text-indigo-600 hover:underline">
                      {r.firstName} {r.lastName}
                    </Link>{" "}
                    <span className="text-xs text-slate-500">{r.position}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Documents</h3>
            <DocumentUploadForm employeeId={employee.id} />
            {employee.documents.length === 0 ? (
              <p className="text-sm text-slate-500 mt-4">No documents uploaded yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {employee.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-slate-900 truncate">{doc.name}</p>
                        <p className="text-xs text-slate-500">{formatDate(doc.uploadedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer" className="btn-ghost !px-2">
                        <Download className="h-4 w-4" />
                      </a>
                      <form action={deleteDocument.bind(null, doc.id, employee.id)}>
                        <button type="submit" className="btn-ghost !px-2 text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Recent Attendance</h3>
              <Link href="/attendance" className="text-xs text-indigo-600 hover:underline">
                View all
              </Link>
            </div>
            {employee.attendances.length === 0 ? (
              <EmptyState title="No attendance records yet" />
            ) : (
              <div className="table-wrap">
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
                    {employee.attendances.map((a) => (
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
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Recent Tasks</h3>
              <Link href="/tasks" className="text-xs text-indigo-600 hover:underline">
                View all
              </Link>
            </div>
            {employee.tasks.length === 0 ? (
              <EmptyState title="No tasks assigned yet" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {employee.tasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-2.5 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-900 truncate">{t.title}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(t.createdAt)}</p>
                    </div>
                    <Badge tone={taskStatusTone[t.status]}>{humanize(t.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={bold ? "font-semibold text-slate-900" : "text-slate-900 text-right"}>{value}</dd>
    </div>
  );
}
