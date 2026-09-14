"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword } from "@/lib/actions/profile";

export function ChangePasswordForm() {
  const initialState: { error?: string; success?: string } = {};
  const [state, formAction, pending] = useActionState(changePassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state.success) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.success]);

  return (
    <form ref={formRef} action={formAction} className="card p-5 space-y-3 max-w-md">
      <h3 className="text-sm font-semibold text-slate-900">Change Password</h3>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">{state.success}</p>}

      <div>
        <label className="label">Current Password</label>
        <input type="password" name="currentPassword" required className="input" />
      </div>
      <div>
        <label className="label">New Password</label>
        <input type="password" name="newPassword" required minLength={6} className="input" />
      </div>
      <div>
        <label className="label">Confirm New Password</label>
        <input type="password" name="confirmPassword" required minLength={6} className="input" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}
