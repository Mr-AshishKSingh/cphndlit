import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Avatar, Badge } from "@/components/ui";
import { taskPriorityTone, taskStatusTone, humanize } from "@/lib/status";
import { formatDate, formatDateTime } from "@/lib/format";
import { TaskDetailControls } from "@/components/TaskDetailControls";
import { TaskSubmissionPanel } from "@/components/TaskSubmissionPanel";
import { TaskComments } from "@/components/TaskComments";
import { TaskPreviewShell } from "@/components/TaskPreviewContext";
import { ArrowLeft } from "lucide-react";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return null;
  const isAdmin = session.role === "ADMIN";

  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignedTo: { include: { department: true } },
      assignedBy: { include: { employee: true } },
      attachments: { orderBy: { uploadedAt: "desc" } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { include: { employee: true } } },
      },
    },
  });

  if (!task) notFound();
  if (!isAdmin && task.assignedToId !== session.employeeId) redirect("/tasks");

  const canSubmit = task.assignedToId === session.employeeId;
  const comments = task.comments.map((c) => ({
    id: c.id,
    body: c.body,
    action: c.action,
    createdAt: c.createdAt,
    authorName: c.author.employee ? `${c.author.employee.firstName} ${c.author.employee.lastName}` : "CEO",
  }));

  return (
    <div>
      <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to tasks
      </Link>

      <PageHeader
        title={task.title}
        action={
          <div className="flex gap-2">
            <Badge tone={taskPriorityTone[task.priority]}>{humanize(task.priority)} priority</Badge>
            <Badge tone={taskStatusTone[task.status]}>{humanize(task.status)}</Badge>
          </div>
        }
      />

      <TaskPreviewShell taskId={task.id} isAdmin={isAdmin}>
        <div className="card p-5 space-y-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Description</h3>
            {task.description ? (
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{task.description}</p>
            ) : (
              <p className="text-sm text-slate-400">No description provided.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-sm">
            <div>
              <p className="text-xs text-slate-500">Assigned to</p>
              <div className="flex items-center gap-2 mt-1">
                <Avatar name={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`} color={task.assignedTo.avatarColor} size={6} />
                <span className="text-slate-900">
                  {task.assignedTo.firstName} {task.assignedTo.lastName}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500">Assigned by</p>
              <p className="text-slate-900 mt-1">
                {task.assignedBy.employee ? `${task.assignedBy.employee.firstName} ${task.assignedBy.employee.lastName}` : "CEO"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Due date</p>
              <p className="text-slate-900 mt-1">{task.dueDate ? formatDate(task.dueDate) : "No due date"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Created</p>
              <p className="text-slate-900 mt-1">{formatDateTime(task.createdAt)}</p>
            </div>
            {task.completedAt && (
              <div>
                <p className="text-xs text-slate-500">Completed</p>
                <p className="text-slate-900 mt-1">{formatDateTime(task.completedAt)}</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <TaskDetailControls taskId={task.id} status={task.status} canDelete={isAdmin} />
          </div>
        </div>

        <div className="mt-4">
          <TaskSubmissionPanel
            taskId={task.id}
            initialNotes={task.submissionNotes}
            submittedAt={task.submittedAt}
            attachments={task.attachments}
            canEdit={canSubmit}
          />
        </div>

        <div className="mt-4">
          <TaskComments taskId={task.id} comments={comments} isAdmin={isAdmin} />
        </div>
      </TaskPreviewShell>
    </div>
  );
}
