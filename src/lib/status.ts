export const attendanceTone: Record<string, "green" | "red" | "amber" | "slate" | "blue"> = {
  PRESENT: "green",
  ABSENT: "red",
  LATE: "amber",
  HALF_DAY: "blue",
  ON_LEAVE: "slate",
};

export const taskStatusTone: Record<string, "slate" | "blue" | "green" | "red"> = {
  TODO: "slate",
  IN_PROGRESS: "blue",
  DONE: "green",
  BLOCKED: "red",
};

export const taskPriorityTone: Record<string, "slate" | "amber" | "red"> = {
  LOW: "slate",
  MEDIUM: "amber",
  HIGH: "red",
};

export const leaveStatusTone: Record<string, "amber" | "green" | "red"> = {
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
};

export const payrollStatusTone: Record<string, "slate" | "blue" | "green"> = {
  DRAFT: "slate",
  GENERATED: "blue",
  PAID: "green",
};

export const expenseStatusTone: Record<string, "amber" | "green" | "red"> = {
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
};

export const employeeStatusTone: Record<string, "green" | "slate"> = {
  ACTIVE: "green",
  INACTIVE: "slate",
};

export function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
