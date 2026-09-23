import { CheckCircle2, Flame, CalendarOff } from "lucide-react";

export function PerformanceWidget({
  tasksDone,
  tasksTotal,
  attendanceStreak,
  leaveDaysRemaining,
}: {
  tasksDone: number;
  tasksTotal: number;
  attendanceStreak: number;
  leaveDaysRemaining: number;
}) {
  const completionRate = tasksTotal === 0 ? 0 : Math.round((tasksDone / tasksTotal) * 100);

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">My Performance</h2>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Task completion
            </span>
            <span className="text-xs font-medium text-slate-900">
              {tasksDone}/{tasksTotal} ({completionRate}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-500" /> Attendance streak
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {attendanceStreak} {attendanceStreak === 1 ? "day" : "days"}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <CalendarOff className="h-3.5 w-3.5 text-sky-500" /> Leave days left
          </span>
          <span className="text-sm font-semibold text-slate-900">{leaveDaysRemaining}</span>
        </div>
      </div>
    </div>
  );
}
