"use client";

import { markAttendance } from "@/lib/actions/attendance";

const OPTIONS = ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "ON_LEAVE"];

export function AttendanceStatusSelect({
  employeeId,
  date,
  status,
}: {
  employeeId: string;
  date: string;
  status: string;
}) {
  return (
    <form action={markAttendance}>
      <input type="hidden" name="employeeId" value={employeeId} />
      <input type="hidden" name="date" value={date} />
      <select
        name="status"
        defaultValue={status}
        className="input !py-1 !text-xs !w-auto"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {OPTIONS.map((o) => (
          <option key={o} value={o}>
            {o.replace("_", " ")}
          </option>
        ))}
      </select>
    </form>
  );
}
