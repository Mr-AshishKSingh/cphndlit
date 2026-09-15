"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ListChecks,
  Wallet,
  CalendarOff,
  Megaphone,
  Receipt,
  UserCircle,
  Sparkles,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { clsx } from "clsx";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  employeeOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users, adminOnly: true },
  { href: "/activity", label: "Activity", icon: Activity, adminOnly: true },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/payroll", label: "Payroll", icon: Wallet, adminOnly: true },
  { href: "/payslips", label: "Payslips", icon: Wallet, employeeOnly: true },
  { href: "/leave", label: "Leave", icon: CalendarOff },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => (item.adminOnly ? isAdmin : item.employeeOnly ? !isAdmin : true));

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-slate-950 text-slate-300 min-h-screen relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-24 h-64 w-64 rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #22d3ee, transparent 70%)" }}
      />

      <div className="relative flex items-center gap-2.5 px-5 h-16 border-b border-white/5">
        <div className="h-9 w-9 rounded-xl brand-gradient flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
          <Sparkles className="h-4.5 w-4.5 text-white" />
        </div>
        <div className="min-w-0">
          <span className="block text-white font-semibold text-sm leading-tight tracking-tight">Company Dashboard</span>
          <span className="block text-[11px] text-slate-500 leading-tight">AI Automation Consultancy</span>
        </div>
      </div>

      <nav className="relative flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
                active
                  ? "brand-gradient text-white shadow-md shadow-indigo-500/25"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative px-5 py-4 border-t border-white/5">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-white/5 rounded-full px-2.5 py-1">
          <ShieldCheck className="h-3 w-3" />
          {isAdmin ? "Admin access" : "Employee access"}
        </div>
      </div>
    </aside>
  );
}
