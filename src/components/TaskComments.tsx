"use client";

import { useActionState, useEffect, useRef } from "react";
import { postTaskComment } from "@/lib/actions/taskComments";
import { formatDateTime } from "@/lib/format";
import { CheckCircle2, RotateCcw, MessageSquare } from "lucide-react";
import { clsx } from "clsx";

type Comment = {
  id: string;
  body: string;
  action: string | null;
  createdAt: Date;
  authorName: string;
};

export function TaskComments({
  taskId,
  comments,
  isAdmin,
}: {
  taskId: string;
  comments: Comment[];
  isAdmin: boolean;
}) {
  const initialState: { error?: string } = {};
  const [state, formAction, pending] = useActionState(postTaskComment, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  return (
    <div className="card p-5 space-y-5">
      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-slate-400" />
        Comments &amp; Review
      </h3>

      {comments.length === 0 ? (
        <p className="text-sm text-slate-400">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className={clsx(
                "rounded-xl border px-3.5 py-2.5",
                c.action === "APPROVED"
                  ? "bg-emerald-50/60 border-emerald-200"
                  : c.action === "CHANGES_REQUESTED"
                  ? "bg-amber-50/60 border-amber-200"
                  : "bg-slate-50 border-slate-200"
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{c.authorName}</span>
                  {c.action === "APPROVED" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                    </span>
                  )}
                  {c.action === "CHANGES_REQUESTED" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                      <RotateCcw className="h-3.5 w-3.5" /> Changes requested
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 shrink-0">{formatDateTime(c.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} action={formAction} className="space-y-2 pt-2 border-t border-slate-100">
        <input type="hidden" name="taskId" value={taskId} />
        <textarea
          name="body"
          rows={3}
          placeholder={isAdmin ? "Leave feedback on the work submitted..." : "Write a comment..."}
          className="input"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} className="btn-secondary">
            Post Comment
          </button>
          {isAdmin && (
            <>
              <button
                type="submit"
                name="decision"
                value="APPROVE"
                disabled={pending}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
              >
                <CheckCircle2 className="h-4 w-4" /> Approve Work
              </button>
              <button
                type="submit"
                name="decision"
                value="REQUEST_CHANGES"
                disabled={pending}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer bg-amber-500 text-white shadow-sm shadow-amber-500/30 hover:bg-amber-600 hover:shadow-md active:scale-[0.98]"
              >
                <RotateCcw className="h-4 w-4" /> Request Changes
              </button>
            </>
          )}
        </div>
        {isAdmin && (
          <p className="text-xs text-slate-400">
            Approving marks the task Done. Requesting changes reopens it as In Progress — add a comment explaining what to fix.
          </p>
        )}
      </form>
    </div>
  );
}
