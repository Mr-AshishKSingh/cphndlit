"use client";

import { deleteEmployee } from "@/lib/actions/employees";
import { Trash2 } from "lucide-react";

export function DeleteEmployeeButton({
  employeeId,
  name,
  compact,
}: {
  employeeId: string;
  name: string;
  compact?: boolean;
}) {
  return (
    <form
      action={deleteEmployee.bind(null, employeeId)}
      onSubmit={(e) => {
        const ok = window.confirm(
          `Delete ${name}? This permanently removes their login, attendance, tasks, leave, payroll and documents. This cannot be undone.`
        );
        if (!ok) e.preventDefault();
      }}
    >
      {compact ? (
        <button type="submit" className="btn-ghost !px-2 text-red-600" title="Delete employee">
          <Trash2 className="h-4 w-4" />
        </button>
      ) : (
        <button type="submit" className="btn-danger">
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      )}
    </form>
  );
}
