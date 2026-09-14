"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitExpense } from "@/lib/actions/expenses";
import { Plus, X } from "lucide-react";

const CATEGORIES = ["Travel", "Meals", "Office Supplies", "Software", "Client Entertainment", "Other"];

export function ExpenseForm() {
  const [open, setOpen] = useState(false);
  const initialState: { error?: string } = {};
  const [state, formAction, pending] = useActionState(submitExpense, initialState);
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
        <Plus className="h-4 w-4" /> Submit Expense
      </button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="card p-4 mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Submit Expense</h3>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost !px-2">
          <X className="h-4 w-4" />
        </button>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Title *</label>
          <input name="title" required className="input" placeholder="e.g. Client dinner" />
        </div>
        <div>
          <label className="label">Category *</label>
          <select name="category" required className="input">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Amount *</label>
          <input type="number" min={0} step="0.01" name="amount" required className="input" />
        </div>
        <div>
          <label className="label">Date *</label>
          <input type="date" name="date" required className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea name="description" rows={2} className="input" />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );
}
