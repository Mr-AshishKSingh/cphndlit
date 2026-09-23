"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { NAV_ITEMS } from "@/components/Sidebar";
import { logoutAction } from "@/lib/actions/auth";
import { CommandPalette } from "@/components/CommandPalette";
import { NotificationBell } from "@/components/NotificationBell";

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
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/70">
      <div className="h-16 flex items-center justify-between px-4 md:px-6">
        <button
          className="md:hidden btn-ghost !px-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="md:hidden flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg brand-gradient flex items-center justify-center shadow-sm shadow-indigo-500/30">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm text-slate-900 tracking-tight">Company Dashboard</span>
        </div>

        <div className="hidden md:block">
          <CommandPalette isAdmin={isAdmin} />
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <div className="text-right hidden sm:block ml-1">
            <p className="text-sm font-medium text-slate-900 leading-tight">{name}</p>
            <p className="text-xs text-slate-500 leading-tight">
              {role === "ADMIN" ? "CEO / Admin" : "Employee"}
            </p>
          </div>
          <div className="h-9 w-9 rounded-full brand-gradient text-white flex items-center justify-center text-sm font-semibold shadow-sm shadow-indigo-500/30 ring-2 ring-white">
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
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active ? "brand-gradient text-white shadow-sm shadow-indigo-500/25" : "text-slate-600 hover:bg-slate-100"
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
