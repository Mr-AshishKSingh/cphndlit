import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { EmployeeForm } from "@/components/EmployeeForm";
import { toDateInputValue } from "@/lib/date";

function toDateInput(d: Date | null) {
  if (!d) return "";
  return toDateInputValue(d);
}

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [employee, departments, managers] = await Promise.all([
    prisma.employee.findUnique({ where: { id } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  if (!employee) notFound();

  return (
    <div className="max-w-3xl">
      <PageHeader title={`Edit ${employee.firstName} ${employee.lastName}`} />
      <EmployeeForm
        mode="edit"
        departments={departments}
        managers={managers}
        defaults={{
          id: employee.id,
          employeeCode: employee.employeeCode,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          position: employee.position,
          departmentId: employee.departmentId,
          joinDate: toDateInput(employee.joinDate),
          dateOfBirth: toDateInput(employee.dateOfBirth),
          address: employee.address,
          basicSalary: employee.basicSalary,
          allowances: employee.allowances,
          bankName: employee.bankName,
          bankAccount: employee.bankAccount,
          managerId: employee.managerId,
          status: employee.status,
        }}
      />
    </div>
  );
}
