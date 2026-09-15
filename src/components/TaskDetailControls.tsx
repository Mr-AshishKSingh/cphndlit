"use client";

import { updateTaskStatus, deleteTask } from "@/lib/actions/tasks";
import { Trash2 } from "lucide-react";

const OPTIONS = ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"];

export function TaskDetailControls({
  taskId,
  status,
  canDelete,
}: {
  taskId: string;
  status: string;
  canDelete?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <form action={updateTaskStatus} className="flex-1 min-w-[160px]">
        <input type="hidden" name="taskId" value={taskId} />
        <label className="label">Status</label>
        <select name="status" defaultValue={status} className="input">
          {OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o.replace("_", " ")}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-secondary mt-2 w-full">
          Update Status
        </button>
      </form>

      {canDelete && (
        <form
          action={deleteTask.bind(null, taskId)}
          onSubmit={(e) => {
            if (!window.confirm("Delete this task? This cannot be undone.")) e.preventDefault();
          }}
        >
          <button type="submit" className="btn-danger">
            <Trash2 className="h-4 w-4" /> Delete Task
          </button>
        </form>
      )}
    </div>
  );
}
