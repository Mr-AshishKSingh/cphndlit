import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const departments = ["Engineering", "Sales", "Marketing", "Human Resources", "Operations"];
  const deptRecords: Record<string, string> = {};
  for (const name of departments) {
    const dept = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    deptRecords[name] = dept.id;
  }

  const adminEmail = "officialwork.ashish@gmail.com";
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const sampleEmployees = [
    {
      code: "EMP001",
      firstName: "Priya",
      lastName: "Sharma",
      email: "priya.sharma@company.com",
      position: "Engineering Manager",
      dept: "Engineering",
      basicSalary: 95000,
      allowances: 8000,
    },
    {
      code: "EMP002",
      firstName: "Rahul",
      lastName: "Verma",
      email: "rahul.verma@company.com",
      position: "Software Engineer",
      dept: "Engineering",
      basicSalary: 65000,
      allowances: 5000,
    },
    {
      code: "EMP003",
      firstName: "Ananya",
      lastName: "Iyer",
      email: "ananya.iyer@company.com",
      position: "Sales Lead",
      dept: "Sales",
      basicSalary: 70000,
      allowances: 6000,
    },
    {
      code: "EMP004",
      firstName: "Karan",
      lastName: "Mehta",
      email: "karan.mehta@company.com",
      position: "Marketing Executive",
      dept: "Marketing",
      basicSalary: 55000,
      allowances: 4000,
    },
    {
      code: "EMP005",
      firstName: "Sneha",
      lastName: "Patel",
      email: "sneha.patel@company.com",
      position: "HR Executive",
      dept: "Human Resources",
      basicSalary: 58000,
      allowances: 4500,
    },
  ];

  const employeePasswordHash = await bcrypt.hash("employee123", 10);
  const colors = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6"];

  for (let i = 0; i < sampleEmployees.length; i++) {
    const e = sampleEmployees[i];
    const employee = await prisma.employee.upsert({
      where: { email: e.email },
      update: {},
      create: {
        employeeCode: e.code,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        position: e.position,
        departmentId: deptRecords[e.dept],
        joinDate: new Date(2024, i, 15),
        basicSalary: e.basicSalary,
        allowances: e.allowances,
        avatarColor: colors[i % colors.length],
      },
    });

    await prisma.user.upsert({
      where: { email: e.email },
      update: {},
      create: {
        email: e.email,
        passwordHash: employeePasswordHash,
        role: "EMPLOYEE",
        employeeId: employee.id,
      },
    });

    const year = new Date().getFullYear();
    for (const type of ["SICK", "CASUAL", "VACATION"] as const) {
      await prisma.leaveBalance.upsert({
        where: { employeeId_type_year: { employeeId: employee.id, type, year } },
        update: {},
        create: {
          employeeId: employee.id,
          type,
          year,
          totalDays: type === "VACATION" ? 15 : 10,
          usedDays: 0,
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log(`Admin login: ${adminEmail} / admin123`);
  console.log("Employee logins: <email above> / employee123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
