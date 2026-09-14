"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { DEFAULT_EMPLOYEE_PASSWORD } from "@/lib/constants";
import { parseDateOnly } from "@/lib/date";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function num(formData: FormData, key: string) {
  const v = str(formData, key);
  return v ? Number(v) : 0;
}

export async function createEmployee(_prevState: { error?: string }, formData: FormData) {
  await requireAdmin();

  const email = str(formData, "email")?.toLowerCase();
  const firstName = str(formData, "firstName");
  const lastName = str(formData, "lastName");
  const position = str(formData, "position");
  const joinDate = str(formData, "joinDate");
  const employeeCode = str(formData, "employeeCode");

  if (!email || !firstName || !lastName || !position || !joinDate || !employeeCode) {
    return { error: "Please fill in all required fields." };
  }

  const existing = await prisma.employee.findFirst({
    where: { OR: [{ email }, { employeeCode }] },
  });
  if (existing) {
    return { error: "An employee with this email or code already exists." };
  }

  const passwordHash = await hashPassword(DEFAULT_EMPLOYEE_PASSWORD);

  const employee = await prisma.employee.create({
    data: {
      employeeCode,
      firstName,
      lastName,
      email,
      phone: str(formData, "phone"),
      position,
      departmentId: str(formData, "departmentId"),
      joinDate: parseDateOnly(joinDate),
      dateOfBirth: str(formData, "dateOfBirth") ? parseDateOnly(str(formData, "dateOfBirth")!) : null,
      address: str(formData, "address"),
      basicSalary: num(formData, "basicSalary"),
      allowances: num(formData, "allowances"),
      bankName: str(formData, "bankName"),
      bankAccount: str(formData, "bankAccount"),
      managerId: str(formData, "managerId"),
      avatarColor: ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6", "#0ea5e9"][
        Math.floor(Math.random() * 6)
      ],
      user: {
        create: {
          email,
          passwordHash,
          role: "EMPLOYEE",
        },
      },
    },
  });

  const year = new Date().getFullYear();
  for (const type of ["SICK", "CASUAL", "VACATION"] as const) {
    await prisma.leaveBalance.create({
      data: {
        employeeId: employee.id,
        type,
        year,
        totalDays: type === "VACATION" ? 15 : 10,
        usedDays: 0,
      },
    });
  }

  revalidatePath("/employees");
  redirect(`/employees/${employee.id}?created=1`);
}

export async function updateEmployee(_prevState: { error?: string }, formData: FormData) {
  await requireAdmin();

  const id = str(formData, "id");
  const email = str(formData, "email")?.toLowerCase();
  const firstName = str(formData, "firstName");
  const lastName = str(formData, "lastName");
  const position = str(formData, "position");
  const joinDate = str(formData, "joinDate");

  if (!id || !email || !firstName || !lastName || !position || !joinDate) {
    return { error: "Please fill in all required fields." };
  }

  await prisma.employee.update({
    where: { id },
    data: {
      firstName,
      lastName,
      email,
      phone: str(formData, "phone"),
      position,
      departmentId: str(formData, "departmentId"),
      joinDate: parseDateOnly(joinDate),
      dateOfBirth: str(formData, "dateOfBirth") ? parseDateOnly(str(formData, "dateOfBirth")!) : null,
      address: str(formData, "address"),
      basicSalary: num(formData, "basicSalary"),
      allowances: num(formData, "allowances"),
      bankName: str(formData, "bankName"),
      bankAccount: str(formData, "bankAccount"),
      managerId: str(formData, "managerId") === id ? null : str(formData, "managerId"),
      status: (str(formData, "status") as "ACTIVE" | "INACTIVE") ?? "ACTIVE",
      user: {
        update: { email },
      },
    },
  });

  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  redirect(`/employees/${id}`);
}

export async function resetEmployeePassword(employeeId: string) {
  await requireAdmin();
  const passwordHash = await hashPassword(DEFAULT_EMPLOYEE_PASSWORD);
  await prisma.user.update({ where: { employeeId }, data: { passwordHash } });
  revalidatePath(`/employees/${employeeId}`);
}

export async function deleteEmployee(employeeId: string) {
  await requireAdmin();

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { documents: true },
  });
  if (!employee) return;

  // Cascades to their user login, attendance, tasks, leave, payroll, documents and
  // expenses; any employees who reported to them have managerId set to null.
  await prisma.employee.delete({ where: { id: employeeId } });

  await Promise.allSettled(employee.documents.map((doc) => del(doc.url)));

  revalidatePath("/employees");
  redirect("/employees");
}

export async function createDepartment(_prevState: { error?: string }, formData: FormData) {
  await requireAdmin();
  const name = str(formData, "name");
  if (!name) return { error: "Department name is required." };
  const existing = await prisma.department.findUnique({ where: { name } });
  if (existing) return { error: "Department already exists." };
  await prisma.department.create({ data: { name } });
  revalidatePath("/employees");
  return {};
}
