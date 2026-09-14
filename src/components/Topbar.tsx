"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, Building2 } from "lucide-react";
import { clsx } from "clsx";
import { NAV_ITEMS } from "@/components/Sidebar";
import { logoutAction } from "@/lib/actions/auth";

export function Topbar({
  name,
  role,
  isAdmin,
}: {
  name: string;
  role: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => (item.adminOnly ? isAdmin : item.employeeOnly ? !isAdmin : true));

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
      <div className="h-16 flex items-center justify-between px-4 md:px-6">
        <button
          className="md:hidden btn-ghost !px-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="md:hidden flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-slate-900">CEO Portal</span>
        </div>

        <div className="hidden md:block" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900 leading-tight">{name}</p>
            <p className="text-xs text-slate-500 leading-tight">
              {role === "ADMIN" ? "CEO / Admin" : "Employee"}
            </p>
          </div>
          <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
            {initials || "U"}
          </div>
          <form action={logoutAction}>
            <button type="submit" className="btn-ghost !px-2" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-slate-200 px-3 py-3 space-y-1 bg-white">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                  active ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
