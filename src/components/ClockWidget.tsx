"use client";

import { useState, useTransition } from "react";
import { clockIn, clockOut } from "@/lib/actions/attendance";
import { LogIn, LogOut } from "lucide-react";

export function ClockWidget({
  clockedIn,
  clockedOut,
  inTime,
  outTime,
}: {
  clockedIn: boolean;
  clockedOut: boolean;
  inTime: string | null;
  outTime: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle(fn: () => Promise<{ error?: string } | undefined>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-1">Today</h3>
      <p className="text-xs text-slate-500 mb-4">
        {inTime ? `Clocked in at ${inTime}` : "Not clocked in yet"}
        {outTime ? ` · Clocked out at ${outTime}` : ""}
      </p>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="flex gap-3">
        <button
          disabled={clockedIn || pending}
          onClick={() => handle(clockIn)}
          className="btn-primary flex-1"
        >
          <LogIn className="h-4 w-4" /> Clock In
        </button>
        <button
          disabled={!clockedIn || clockedOut || pending}
          onClick={() => handle(clockOut)}
          className="btn-secondary flex-1"
        >
          <LogOut className="h-4 w-4" /> Clock Out
        </button>
      </div>
    </div>
  );
}
