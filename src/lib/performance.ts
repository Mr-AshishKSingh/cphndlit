import { startOfDay, addDays, toDateInputValue } from "@/lib/date";

const WORKING_STATUSES = new Set(["PRESENT", "LATE", "HALF_DAY"]);
const MAX_LOOKBACK_DAYS = 120;

// Consecutive working-day streak ending today (or yesterday, if today isn't
// marked yet). Weekends and approved leave are skipped without breaking the
// streak; an unmarked weekday or a recorded absence breaks it.
export function computeAttendanceStreak(records: { date: Date; status: string }[]): number {
  const byDateKey = new Map<string, string>();
  for (const r of records) {
    byDateKey.set(toDateInputValue(r.date), r.status);
  }

  let cursor = startOfDay(new Date());
  if (!byDateKey.has(toDateInputValue(cursor))) {
    cursor = addDays(cursor, -1);
  }

  let streak = 0;
  for (let i = 0; i < MAX_LOOKBACK_DAYS; i++) {
    const key = toDateInputValue(cursor);
    const dow = cursor.getDay();
    const status = byDateKey.get(key);

    if (status) {
      if (WORKING_STATUSES.has(status)) {
        streak++;
      } else if (status !== "ON_LEAVE") {
        break;
      }
    } else if (dow !== 0 && dow !== 6) {
      break;
    }

    cursor = addDays(cursor, -1);
  }

  return streak;
}
