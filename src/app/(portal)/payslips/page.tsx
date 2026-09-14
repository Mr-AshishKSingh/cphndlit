import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import { payrollStatusTone, humanize } from "@/lib/status";
import { formatCurrency, monthName } from "@/lib/format";

export default async function PayslipsPage() {
  const session = await getSession();
  if (!session?.employeeId) return null;

  const payslips = await prisma.payroll.findMany({
    where: { employeeId: session.employeeId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return (
    <div>
      <PageHeader title="Payslips" description="Your monthly salary history" />

      {payslips.length === 0 ? (
        <EmptyState title="No payslips yet" description="They'll appear here once payroll is generated." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {payslips.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  {monthName(p.month)} {p.year}
                </h3>
                <Badge tone={payrollStatusTone[p.status]}>{humanize(p.status)}</Badge>
              </div>
              <dl className="space-y-1.5 text-sm">
                <Row label="Basic Salary" value={formatCurrency(p.basicSalary)} />
                <Row label="Allowances" value={formatCurrency(p.allowances)} />
                <Row label="Bonus" value={formatCurrency(p.bonus)} />
                <Row label="Deductions" value={`- ${formatCurrency(p.deductions)}`} />
                <div className="border-t border-slate-100 my-2" />
                <Row label="Net Pay" value={formatCurrency(p.netPay)} bold />
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className={bold ? "font-semibold text-slate-900" : "text-slate-700"}>{value}</dd>
    </div>
  );
}
