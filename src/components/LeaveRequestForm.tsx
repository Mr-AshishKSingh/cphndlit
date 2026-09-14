"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { requestLeave } from "@/lib/actions/leave";
import { Plus, X } from "lucide-react";

export function LeaveRequestForm() {
  const [open, setOpen] = useState(false);
  const initialState: { error?: string } = {};
  const [state, formAction, pending] = useActionState(requestLeave, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  if (!open) {
    return (
      <button className="btn-primary mb-4" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Request Leave
      </button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="card p-4 mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Request Leave</h3>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost !px-2">
          <X className="h-4 w-4" />
        </button>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Type *</label>
          <select name="type" required className="input">
            <option value="CASUAL">Casual</option>
            <option value="SICK">Sick</option>
            <option value="VACATION">Vacation</option>
            <option value="UNPAID">Unpaid</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className="label">Start Date *</label>
          <input type="date" name="startDate" required className="input" />
        </div>
        <div>
          <label className="label">End Date *</label>
          <input type="date" name="endDate" required className="input" />
        </div>
        <div className="sm:col-span-3">
          <label className="label">Reason</label>
          <textarea name="reason" rows={2} className="input" />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Submitting..." : "Submit Request"}
        </button>
      </div>
    </form>
  );
}
