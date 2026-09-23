import { Avatar, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { Milestone } from "@/lib/milestones";
import { Cake, PartyPopper } from "lucide-react";

function relativeDay(daysAway: number) {
  if (daysAway === 0) return "Today";
  if (daysAway === 1) return "Tomorrow";
  return `In ${daysAway} days`;
}

export function MilestonesWidget({ milestones, title = "Upcoming Celebrations" }: { milestones: Milestone[]; title?: string }) {
  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">{title}</h2>
      {milestones.length === 0 ? (
        <EmptyState title="Nothing in the next 30 days" description="Birthdays and work anniversaries will show up here." />
      ) : (
        <ul className="space-y-3">
          {milestones.map((m) => (
            <li key={`${m.employeeId}-${m.type}`} className="flex items-center gap-3">
              <Avatar name={`${m.firstName} ${m.lastName}`} color={m.avatarColor} size={8} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {m.firstName} {m.lastName}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  {m.type === "birthday" ? (
                    <>
                      <Cake className="h-3 w-3 text-pink-500" /> Birthday · {formatDate(m.date)}
                    </>
                  ) : (
                    <>
                      <PartyPopper className="h-3 w-3 text-amber-500" /> {m.years}-year anniversary · {formatDate(m.date)}
                    </>
                  )}
                </p>
              </div>
              <span className="text-xs font-medium text-indigo-600 shrink-0">{relativeDay(m.daysAway)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
