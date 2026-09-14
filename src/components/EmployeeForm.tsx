"use client";

import { useActionState } from "react";
import { createEmployee, updateEmployee } from "@/lib/actions/employees";

type Department = { id: string; name: string };
type ManagerOption = { id: string; firstName: string; lastName: string };

type EmployeeDefaults = {
  id?: string;
  employeeCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  position?: string;
  departmentId?: string | null;
  joinDate?: string;
  dateOfBirth?: string | null;
  address?: string | null;
  basicSalary?: number;
  allowances?: number;
  bankName?: string | null;
  bankAccount?: string | null;
  managerId?: string | null;
  status?: string;
};

export function EmployeeForm({
  mode,
  departments,
  managers,
  defaults,
}: {
  mode: "create" | "edit";
  departments: Department[];
  managers: ManagerOption[];
  defaults?: EmployeeDefaults;
}) {
  const action = mode === "create" ? createEmployee : updateEmployee;
  const initialState: { error?: string } = {};
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}

      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {state.error}
        </div>
      )}

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Employee Code *</label>
            <input
              name="employeeCode"
              required
              disabled={mode === "edit"}
              defaultValue={defaults?.employeeCode}
              className="input disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="EMP006"
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select name="status" defaultValue={defaults?.status ?? "ACTIVE"} className="input">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <label className="label">First Name *</label>
            <input name="firstName" required defaultValue={defaults?.firstName} className="input" />
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input name="lastName" required defaultValue={defaults?.lastName} className="input" />
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" name="email" required defaultValue={defaults?.email} className="input" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input name="phone" defaultValue={defaults?.phone ?? ""} className="input" />
          </div>
          <div>
            <label className="label">Date of Birth</label>
            <input type="date" name="dateOfBirth" defaultValue={defaults?.dateOfBirth ?? ""} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address</label>
            <input name="address" defaultValue={defaults?.address ?? ""} className="input" />
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Employment</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Position *</label>
            <input name="position" required defaultValue={defaults?.position} className="input" />
          </div>
          <div>
            <label className="label">Department</label>
            <select name="departmentId" defaultValue={defaults?.departmentId ?? ""} className="input">
              <option value="">None</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Join Date *</label>
            <input
              type="date"
              name="joinDate"
              required
              defaultValue={defaults?.joinDate}
              className="input"
            />
          </div>
          <div>
            <label className="label">Reports To</label>
            <select name="managerId" defaultValue={defaults?.managerId ?? ""} className="input">
              <option value="">None</option>
              {managers
                .filter((m) => m.id !== defaults?.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Compensation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Basic Salary (Monthly) *</label>
            <input
              type="number"
              min={0}
              step="0.01"
              name="basicSalary"
              required
              defaultValue={defaults?.basicSalary}
              className="input"
            />
          </div>
          <div>
            <label className="label">Allowances (Monthly)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              name="allowances"
              defaultValue={defaults?.allowances ?? 0}
              className="input"
            />
          </div>
          <div>
            <label className="label">Bank Name</label>
            <input name="bankName" defaultValue={defaults?.bankName ?? ""} className="input" />
          </div>
          <div>
            <label className="label">Bank Account</label>
            <input name="bankAccount" defaultValue={defaults?.bankAccount ?? ""} className="input" />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving..." : mode === "create" ? "Create Employee" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
