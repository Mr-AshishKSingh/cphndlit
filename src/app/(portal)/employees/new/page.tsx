import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { EmployeeForm } from "@/components/EmployeeForm";

export default async function NewEmployeePage() {
  await requireAdmin();
  const [departments, managers] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Add Employee" description="New hires get a portal login automatically." />
      <EmployeeForm mode="create" departments={departments} managers={managers} />
    </div>
  );
}
