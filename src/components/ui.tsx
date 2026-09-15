import { clsx } from "clsx";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const statTones: Record<string, string> = {
  indigo: "from-indigo-500 to-violet-500 shadow-indigo-500/30",
  emerald: "from-emerald-500 to-teal-500 shadow-emerald-500/30",
  amber: "from-amber-500 to-orange-500 shadow-amber-500/30",
  rose: "from-rose-500 to-pink-500 shadow-rose-500/30",
  sky: "from-sky-500 to-cyan-500 shadow-sky-500/30",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "indigo",
  href,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "indigo" | "emerald" | "amber" | "rose" | "sky";
  href?: string;
}) {
  const content = (
    <div className={clsx("card p-4 flex items-center gap-4 h-full", href && "card-interactive")}>
      <div
        className={clsx(
          "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br text-white shadow-sm",
          statTones[tone]
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 leading-snug">{label}</p>
        <p className="text-xl font-semibold text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-2xl">
        {content}
      </Link>
    );
  }
  return content;
}

const badgeTones: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700",
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-rose-100 text-rose-700",
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
  indigo: "bg-indigo-100 text-indigo-700",
  purple: "bg-purple-100 text-purple-700",
};

export function Badge({ tone = "slate", children }: { tone?: keyof typeof badgeTones; children: React.ReactNode }) {
  return <span className={clsx("badge", badgeTones[tone])}>{children}</span>;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="card p-10 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
    </div>
  );
}

export function Avatar({ name, color, size = 9 }: { name: string; color?: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0 shadow-sm ring-2 ring-white"
      style={{
        backgroundColor: color ?? "#6366f1",
        width: `${size * 4}px`,
        height: `${size * 4}px`,
        fontSize: `${size * 1.1}px`,
      }}
    >
      {initials}
    </div>
  );
}
