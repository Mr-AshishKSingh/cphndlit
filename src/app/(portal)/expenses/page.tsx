import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Avatar, Badge, EmptyState } from "@/components/ui";
import { expenseStatusTone, humanize } from "@/lib/status";
import { formatCurrency, formatDate } from "@/lib/format";
import { ExpenseForm } from "@/components/ExpenseForm";
import { reviewExpense } from "@/lib/actions/expenses";

export default async function ExpensesPage() {
  const session = await getSession();
  if (!session) return null;
  const isAdmin = session.role === "ADMIN";

  const expenses = await prisma.expense.findMany({
    where: isAdmin ? {} : { employeeId: session.employeeId! },
    include: { employee: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const totalApproved = expenses.filter((e) => e.status === "APPROVED").reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        description={isAdmin ? `${formatCurrency(totalApproved)} approved` : "Submit and track your expense claims"}
      />

      {!isAdmin && <ExpenseForm />}

      {expenses.length === 0 ? (
        <EmptyState title="No expenses found" />
      ) : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {isAdmin && <th>Employee</th>}
                <th>Title</th>
                <th>Category</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                {isAdmin && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  {isAdmin && (
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={`${e.employee.firstName} ${e.employee.lastName}`} color={e.employee.avatarColor} size={6} />
                        <span className="font-medium text-slate-900">
                          {e.employee.firstName} {e.employee.lastName}
                        </span>
                      </div>
                    </td>
                  )}
                  <td>
                    <p className="text-slate-900">{e.title}</p>
                    {e.description && <p className="text-xs text-slate-500">{e.description}</p>}
                  </td>
                  <td>{e.category}</td>
                  <td>{formatDate(e.date)}</td>
                  <td className="font-medium text-slate-900">{formatCurrency(e.amount)}</td>
                  <td>
                    <Badge tone={expenseStatusTone[e.status]}>{humanize(e.status)}</Badge>
                  </td>
                  {isAdmin && (
                    <td>
                      {e.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <form action={reviewExpense}>
                            <input type="hidden" name="expenseId" value={e.id} />
                            <input type="hidden" name="decision" value="APPROVED" />
                            <button type="submit" className="btn-secondary !py-1 !px-2 !text-xs">
                              Approve
                            </button>
                          </form>
                          <form action={reviewExpense}>
                            <input type="hidden" name="expenseId" value={e.id} />
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
