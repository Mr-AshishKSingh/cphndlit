import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Avatar, Badge, EmptyState } from "@/components/ui";
import { taskPriorityTone, humanize } from "@/lib/status";
import { formatDate } from "@/lib/format";
import { NewTaskForm } from "@/components/NewTaskForm";
import { TaskStatusSelect } from "@/components/TaskStatusSelect";
import { Paperclip } from "lucide-react";

const COLUMNS = [
  { key: "TODO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "DONE", label: "Done" },
  { key: "BLOCKED", label: "Blocked" },
] as const;

export default async function TasksPage() {
  const session = await getSession();
  if (!session) return null;
  const isAdmin = session.role === "ADMIN";

  const [tasks, employees] = await Promise.all([
    prisma.task.findMany({
      where: isAdmin ? {} : { assignedToId: session.employeeId! },
      include: { assignedTo: true, _count: { select: { attachments: true } } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
    isAdmin
      ? prisma.employee.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, firstName: true, lastName: true },
          orderBy: { firstName: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader title="Tasks" description={isAdmin ? "All company tasks" : "Your assigned tasks"} />

      {isAdmin && <NewTaskForm employees={employees} />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
                <span className="text-xs text-slate-400">{colTasks.length}</span>
              </div>
              {colTasks.length === 0 ? (
                <div className="card p-4">
                  <p className="text-xs text-slate-400 text-center">No tasks</p>
                </div>
              ) : (
                colTasks.map((t) => (
                  <div key={t.id} className="card p-4 space-y-2">
                    <Link href={`/tasks/${t.id}`} className="block space-y-2 hover:opacity-80">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">{t.title}</p>
                        <Badge tone={taskPriorityTone[t.priority]}>{humanize(t.priority)}</Badge>
                      </div>
                      {t.description && <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>}
                      <div className="flex items-center justify-between pt-1">
                        {isAdmin ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={`${t.assignedTo.firstName} ${t.assignedTo.lastName}`} color={t.assignedTo.avatarColor} size={6} />
                            <span className="text-xs text-slate-600">{t.assignedTo.firstName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">
                            {t.dueDate ? `Due ${formatDate(t.dueDate)}` : "No due date"}
                          </span>
                        )}
                        {(t.submissionNotes || t._count.attachments > 0) && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600" title="Work submitted">
                            <Paperclip className="h-3 w-3" />
                            {t._count.attachments > 0 && t._count.attachments}
                          </span>
                        )}
                      </div>
                    </Link>
                    <TaskStatusSelect taskId={t.id} status={t.status} canDelete={isAdmin} />
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <EmptyState title="No tasks yet" description={isAdmin ? "Create a task to get started." : "You have no tasks assigned."} />
      )}
    </div>
  );
}
