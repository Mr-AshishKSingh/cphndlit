"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createAnnouncement } from "@/lib/actions/announcements";
import { Plus, X } from "lucide-react";

export function AnnouncementForm() {
  const [open, setOpen] = useState(false);
  const initialState: { error?: string } = {};
  const [state, formAction, pending] = useActionState(createAnnouncement, initialState);
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
        <Plus className="h-4 w-4" /> New Announcement
      </button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="card p-4 mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">New Announcement</h3>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost !px-2">
          <X className="h-4 w-4" />
        </button>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div>
        <label className="label">Title *</label>
        <input name="title" required className="input" placeholder="e.g. Office closed Friday" />
      </div>
      <div>
        <label className="label">Message *</label>
        <textarea name="body" required rows={3} className="input" />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="pinned" className="rounded border-slate-300" />
        Pin to top
      </label>

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Posting..." : "Post Announcement"}
        </button>
      </div>
    </form>
  );
}
