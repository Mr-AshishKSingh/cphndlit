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
  Building2,
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
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-slate-900 text-slate-300 min-h-screen">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-800">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <span className="text-white font-semibold text-sm">CEO Portal</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 text-xs text-slate-500 border-t border-slate-800">
        {isAdmin ? "Admin access" : "Employee access"}
      </div>
    </aside>
  );
}
