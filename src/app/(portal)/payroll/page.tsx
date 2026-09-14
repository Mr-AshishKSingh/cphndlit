import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Avatar, Badge, EmptyState } from "@/components/ui";
import { payrollStatusTone, humanize } from "@/lib/status";
import { formatCurrency, monthName } from "@/lib/format";
import { generatePayroll, updatePayrollEntry, markPayrollPaid } from "@/lib/actions/payroll";
import { Settings2 } from "lucide-react";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  await requireAdmin();
  const now = new Date();
  const { month: monthParam, year: yearParam } = await searchParams;
  const month = Number(monthParam) || now.getMonth() + 1;
  const year = Number(yearParam) || now.getFullYear();

  const [entries, employeeCount] = await Promise.all([
    prisma.payroll.findMany({
      where: { month, year },
      include: { employee: true },
      orderBy: { employee: { firstName: "asc" } },
    }),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
  ]);

  const totalCost = entries.reduce((sum, e) => sum + e.netPay, 0);

  return (
    <div>
      <PageHeader
        title="Payroll"
        description={`${monthName(month)} ${year} · ${entries.length}/${employeeCount} generated · Total ${formatCurrency(totalCost)}`}
      />

      <div className="card p-4 mb-4 flex flex-wrap items-end gap-3">
        <form className="flex items-end gap-3">
          <div>
            <label className="label">Month</label>
            <select name="month" defaultValue={month} className="input">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {monthName(m)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <select name="year" defaultValue={year} className="input">
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-secondary">
            View
          </button>
        </form>
        <form action={generatePayroll} className="ml-auto">
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="year" value={year} />
          <button type="submit" className="btn-primary">
            Generate Payroll for {monthName(month)}
          </button>
        </form>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="No payroll generated for this period"
          description="Click Generate Payroll to create draft entries for all active employees."
        />
      ) : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Basic</th>
                <th>Allowances</th>
                <th>Bonus</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={`${p.employee.firstName} ${p.employee.lastName}`} color={p.employee.avatarColor} size={6} />
                        <span className="font-medium text-slate-900">
                          {p.employee.firstName} {p.employee.lastName}
                        </span>
                      </div>
                    </td>
                    <td>{formatCurrency(p.basicSalary)}</td>
                    <td>{formatCurrency(p.allowances)}</td>
                    <td>{formatCurrency(p.bonus)}</td>
                    <td>{formatCurrency(p.deductions)}</td>
                    <td className="font-semibold text-slate-900">{formatCurrency(p.netPay)}</td>
                    <td>
                      <Badge tone={payrollStatusTone[p.status]}>{humanize(p.status)}</Badge>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <details className="relative">
                          <summary className="btn-ghost !px-2 list-none cursor-pointer inline-flex">
                            <Settings2 className="h-4 w-4" />
                          </summary>
                          <form
                            action={updatePayrollEntry}
                            className="absolute right-0 mt-2 w-64 card p-3 space-y-2 z-10 shadow-lg"
                          >
                            <input type="hidden" name="id" value={p.id} />
                            <div>
                              <label className="label">Bonus</label>
                              <input type="number" name="bonus" defaultValue={p.bonus} className="input !py-1 !text-sm" />
                            </div>
                            <div>
                              <label className="label">Deductions</label>
                              <input
                                type="number"
                                name="deductions"
                                defaultValue={p.deductions}
                                className="input !py-1 !text-sm"
                              />
                            </div>
                            <div>
                              <label className="label">Notes</label>
                              <input name="notes" defaultValue={p.notes ?? ""} className="input !py-1 !text-sm" />
                            </div>
                            <button type="submit" className="btn-primary w-full !py-1.5 !text-sm">
                              Save
                            </button>
                          </form>
                        </details>
                        {p.status !== "PAID" && (
                          <form action={markPayrollPaid}>
                            <input type="hidden" name="id" value={p.id} />
                            <button type="submit" className="btn-secondary !py-1 !px-2 !text-xs">
                              Mark Paid
                            </button>
                          </form>
                        )}
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
