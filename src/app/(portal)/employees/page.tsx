import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Avatar, Badge, EmptyState } from "@/components/ui";
import { employeeStatusTone, humanize } from "@/lib/status";
import { formatCurrency, formatDate } from "@/lib/format";
import { DeleteEmployeeButton } from "@/components/DeleteEmployeeButton";
import { Plus, Search, Pencil } from "lucide-react";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; dept?: string; status?: string }>;
}) {
  await requireAdmin();
  const { q = "", dept = "", status = "" } = await searchParams;

  const [employees, departments] = await Promise.all([
    prisma.employee.findMany({
      where: {
        AND: [
          q
            ? {
                OR: [
                  { firstName: { contains: q } },
                  { lastName: { contains: q } },
                  { email: { contains: q } },
                  { employeeCode: { contains: q } },
                ],
              }
            : {},
          dept ? { departmentId: dept } : {},
          status ? { status: status as "ACTIVE" | "INACTIVE" } : {},
        ],
      },
      include: { department: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Employees"
        description={`${employees.length} employee${employees.length === 1 ? "" : "s"}`}
        action={
          <Link href="/employees/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Add Employee
          </Link>
        }
      />

      <form className="card p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="label">Search</label>
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input name="q" defaultValue={q} placeholder="Name, email, code..." className="input pl-9" />
          </div>
        </div>
        <div>
          <label className="label">Department</label>
          <select name="dept" defaultValue={dept} className="input">
            <option value="">All</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select name="status" defaultValue={status} className="input">
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <button type="submit" className="btn-secondary">
          Filter
        </button>
      </form>

      {employees.length === 0 ? (
        <EmptyState title="No employees found" description="Try adjusting your filters or add a new employee." />
      ) : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Position</th>
                <th>Join Date</th>
                <th>Salary (Monthly)</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link href={`/employees/${e.id}`} className="flex items-center gap-3 hover:underline">
                      <Avatar name={`${e.firstName} ${e.lastName}`} color={e.avatarColor} size={8} />
                      <div>
                        <p className="font-medium text-slate-900">
                          {e.firstName} {e.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{e.employeeCode}</p>
                      </div>
                    </Link>
                  </td>
                  <td>{e.department?.name ?? "—"}</td>
                  <td>{e.position}</td>
                  <td>{formatDate(e.joinDate)}</td>
                  <td>{formatCurrency(e.basicSalary + e.allowances)}</td>
                  <td>
                    <Badge tone={employeeStatusTone[e.status]}>{humanize(e.status)}</Badge>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 justify-end">
                      <Link href={`/employees/${e.id}/edit`} className="btn-ghost !px-2" title="Edit employee">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <DeleteEmployeeButton employeeId={e.id} name={`${e.firstName} ${e.lastName}`} compact />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
