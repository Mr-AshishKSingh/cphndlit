"use client";

import { updateTaskStatus, deleteTask } from "@/lib/actions/tasks";
import { Trash2 } from "lucide-react";

const OPTIONS = ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"];

export function TaskStatusSelect({
  taskId,
  status,
  canDelete,
}: {
  taskId: string;
  status: string;
  canDelete?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <form action={updateTaskStatus}>
        <input type="hidden" name="taskId" value={taskId} />
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
      {canDelete && (
        <form action={deleteTask.bind(null, taskId)}>
          <button type="submit" className="btn-ghost !px-2 text-red-600" title="Delete task">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}
