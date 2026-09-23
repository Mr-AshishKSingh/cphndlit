import { startOfDay } from "@/lib/date";

export type Milestone = {
  employeeId: string;
  firstName: string;
  lastName: string;
  avatarColor: string;
  type: "birthday" | "anniversary";
  date: Date;
  daysAway: number;
  years?: number;
};

function nextOccurrence(original: Date, from: Date): Date {
  const today0 = startOfDay(from);
  let next = new Date(from.getFullYear(), original.getMonth(), original.getDate());
  if (next < today0) {
    next = new Date(from.getFullYear() + 1, original.getMonth(), original.getDate());
  }
  return next;
}

export function upcomingMilestones(
  employees: {
    id: string;
    firstName: string;
    lastName: string;
    avatarColor: string;
    dateOfBirth: Date | null;
    joinDate: Date;
  }[],
  windowDays = 30
): Milestone[] {
  const now = new Date();
  const today0 = startOfDay(now);
  const results: Milestone[] = [];

  for (const e of employees) {
    if (e.dateOfBirth) {
      const next = nextOccurrence(e.dateOfBirth, now);
      const daysAway = Math.round((next.getTime() - today0.getTime()) / 86400000);
      if (daysAway <= windowDays) {
        results.push({
          employeeId: e.id,
          firstName: e.firstName,
          lastName: e.lastName,
          avatarColor: e.avatarColor,
          type: "birthday",
          date: next,
          daysAway,
        });
      }
    }
    const nextAnniversary = nextOccurrence(e.joinDate, now);
    const daysAway = Math.round((nextAnniversary.getTime() - today0.getTime()) / 86400000);
    const years = nextAnniversary.getFullYear() - e.joinDate.getFullYear();
    if (daysAway <= windowDays && years > 0) {
      results.push({
        employeeId: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        avatarColor: e.avatarColor,
        type: "anniversary",
        date: nextAnniversary,
        daysAway,
        years,
      });
    }
  }

  return results.sort((a, b) => a.daysAway - b.daysAway);
}
