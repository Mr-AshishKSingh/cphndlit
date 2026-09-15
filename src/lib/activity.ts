import { prisma } from "@/lib/db";

type ActivityType = "LOGIN" | "LOGOUT" | "PAGE_VIEW" | "ACTION";

export async function logActivity(params: {
  userId: string;
  employeeId?: string | null;
  type: ActivityType;
  description: string;
  path?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        employeeId: params.employeeId ?? null,
        type: params.type,
        description: params.description,
        path: params.path,
      },
    });
  } catch {
    // Activity logging is best-effort — never let it break the real action.
  }
}

const PATH_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  employees: "Employees",
  attendance: "Attendance",
  tasks: "Tasks",
  payroll: "Payroll",
  payslips: "Payslips",
  leave: "Leave",
  expenses: "Expenses",
  announcements: "Announcements",
  profile: "Profile",
};

export function describePath(path: string): string {
  const segment = path.split("/").filter(Boolean)[0] ?? "";
  return PATH_LABELS[segment] ?? (segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : "Home");
}
