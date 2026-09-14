"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function generatePayroll(formData: FormData) {
  await requireAdmin();
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  if (!month || !year) return;

  const employees = await prisma.employee.findMany({ where: { status: "ACTIVE" } });

  for (const e of employees) {
    const existing = await prisma.payroll.findUnique({
      where: { employeeId_month_year: { employeeId: e.id, month, year } },
    });
    if (existing) continue;

    await prisma.payroll.create({
      data: {
        employeeId: e.id,
        month,
        year,
        basicSalary: e.basicSalary,
        allowances: e.allowances,
        bonus: 0,
        deductions: 0,
        netPay: e.basicSalary + e.allowances,
        status: "GENERATED",
      },
    });
  }

  revalidatePath("/payroll");
  revalidatePath("/dashboard");
}

export async function updatePayrollEntry(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const bonus = Number(formData.get("bonus") ?? 0);
  const deductions = Number(formData.get("deductions") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!id) return;

  const payroll = await prisma.payroll.findUnique({ where: { id } });
  if (!payroll) return;

  const netPay = payroll.basicSalary + payroll.allowances + bonus - deductions;

  await prisma.payroll.update({
    where: { id },
    data: { bonus, deductions, notes, netPay },
  });

  revalidatePath("/payroll");
  revalidatePath("/dashboard");
}

export async function markPayrollPaid(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.payroll.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } });
  revalidatePath("/payroll");
}
