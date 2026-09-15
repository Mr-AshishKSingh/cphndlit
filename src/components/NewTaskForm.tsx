"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createTask } from "@/lib/actions/tasks";
import { Plus, X } from "lucide-react";

type Employee = { id: string; firstName: string; lastName: string };

export function NewTaskForm({ employees }: { employees: Employee[] }) {
  const [open, setOpen] = useState(false);
  const [assignToAll, setAssignToAll] = useState(false);
  const initialState: { error?: string } = {};
  const [state, formAction, pending] = useActionState(createTask, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setOpen(false);
      setAssignToAll(false);
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  if (!open) {
    return (
      <button className="btn-primary mb-4" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New Task
      </button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="card p-4 mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">New Task</h3>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost !px-2">
          <X className="h-4 w-4" />
        </button>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="label">Title *</label>
          <input name="title" required className="input" placeholder="e.g. Prepare Q3 board deck" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea name="description" rows={2} className="input" />
        </div>
        <div>
          <label className="label">Assign To {!assignToAll && "*"}</label>
          <select name="assignedToId" required={!assignToAll} disabled={assignToAll} className="input disabled:bg-slate-50 disabled:text-slate-400">
            <option value="">Select employee</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs text-slate-600 mt-1.5">
            <input
              type="checkbox"
              name="assignToAll"
              checked={assignToAll}
              onChange={(e) => setAssignToAll(e.target.checked)}
              className="rounded border-slate-300"
            />
            Assign to all employees
          </label>
        </div>
        <div>
          <label className="label">Priority</label>
          <select name="priority" defaultValue="MEDIUM" className="input">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
        <div>
          <label className="label">Due Date</label>
          <input type="date" name="dueDate" className="input" />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Creating..." : "Create Task"}
        </button>
      </div>
    </form>
  );
}
