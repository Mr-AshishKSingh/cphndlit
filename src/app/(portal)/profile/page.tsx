import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Avatar, PageHeader } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) return null;

  const employee = session.employeeId
    ? await prisma.employee.findUnique({
        where: { id: session.employeeId },
        include: { department: true, manager: true },
      })
    : null;

  return (
    <div>
      <PageHeader title="Profile" description="Your account details" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-4 mb-4">
            <Avatar name={session.name} color={employee?.avatarColor} size={14} />
            <div>
              <h2 className="font-semibold text-slate-900">{session.name}</h2>
              <p className="text-sm text-slate-500">{employee?.position ?? "CEO / Admin"}</p>
            </div>
          </div>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={session.email} />
            {employee && (
              <>
                <Row label="Employee Code" value={employee.employeeCode} />
                <Row label="Department" value={employee.department?.name ?? "—"} />
                <Row label="Phone" value={employee.phone ?? "—"} />
                <Row label="Join Date" value={formatDate(employee.joinDate)} />
                <Row label="Reports To" value={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "—"} />
                <Row label="Monthly Salary" value={formatCurrency(employee.basicSalary + employee.allowances)} />
              </>
            )}
          </dl>
        </div>

        <ChangePasswordForm />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-900">{value}</dd>
    </div>
  );
}
