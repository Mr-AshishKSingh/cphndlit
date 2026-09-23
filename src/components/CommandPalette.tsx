"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, ListChecks, CornerDownLeft } from "lucide-react";
import { clsx } from "clsx";
import { NAV_ITEMS } from "@/components/Sidebar";

type Employee = { id: string; firstName: string; lastName: string; position: string; avatarColor: string };
type Task = { id: string; title: string; status: string };

type ResultItem = {
  key: string;
  group: "Pages" | "Employees" | "Tasks";
  label: string;
  sub?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function CommandPalette({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setEmployees([]);
    setTasks([]);
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        close();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const trimmedQuery = query.trim();
  const showApiResults = trimmedQuery.length >= 2;

  useEffect(() => {
    if (!open || !showApiResults) return;
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`);
        if (!res.ok) return;
        const data = await res.json();
        setEmployees(data.employees ?? []);
        setTasks(data.tasks ?? []);
        setActiveIndex(0);
      } catch {
        // ignore transient fetch errors
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [trimmedQuery, open, showApiResults]);

  const pageMatches = NAV_ITEMS.filter((item) => (item.adminOnly ? isAdmin : item.employeeOnly ? !isAdmin : true)).filter(
    (item) => trimmedQuery.length === 0 || item.label.toLowerCase().includes(trimmedQuery.toLowerCase())
  );

  const items: ResultItem[] = [
    ...pageMatches.map((p) => ({ key: `page-${p.href}`, group: "Pages" as const, label: p.label, href: p.href, icon: p.icon })),
    ...(showApiResults ? employees : []).map((e) => ({
      key: `emp-${e.id}`,
      group: "Employees" as const,
      label: `${e.firstName} ${e.lastName}`,
      sub: e.position,
      href: `/employees/${e.id}`,
      icon: Users,
    })),
    ...(showApiResults ? tasks : []).map((t) => ({
      key: `task-${t.id}`,
      group: "Tasks" as const,
      label: t.title,
      sub: t.status.replace("_", " "),
      href: `/tasks/${t.id}`,
      icon: ListChecks,
    })),
  ];

  const safeIndex = Math.min(activeIndex, Math.max(items.length - 1, 0));

  function go(href: string) {
    close();
    router.push(href);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(Math.min(safeIndex + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(Math.max(safeIndex - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[safeIndex];
      if (item) go(item.href);
    }
  }

  let renderedGroup: string | null = null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors w-56"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-[10px] font-medium border border-slate-200 rounded px-1.5 py-0.5 text-slate-400">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search pages, employees, tasks..."
                className="flex-1 text-sm outline-none placeholder:text-slate-400"
              />
              <kbd className="text-[10px] font-medium border border-slate-200 rounded px-1.5 py-0.5 text-slate-400 shrink-0">
                Esc
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto py-1.5">
              {items.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  {showApiResults ? "No results." : "Type to search, or browse pages above."}
                </p>
              ) : (
                items.map((item, i) => {
                  const showHeader = item.group !== renderedGroup;
                  renderedGroup = item.group;
                  const Icon = item.icon;
                  return (
                    <div key={item.key}>
                      {showHeader && (
                        <p className="px-4 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          {item.group}
                        </p>
                      )}
                      <button
                        onClick={() => go(item.href)}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={clsx(
                          "w-full flex items-center gap-3 px-4 py-2 text-left text-sm",
                          i === safeIndex ? "bg-indigo-50 text-indigo-700" : "text-slate-700"
                        )}
                      >
                        <Icon className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.sub && <span className="text-xs text-slate-400 shrink-0">{item.sub}</span>}
                        {i === safeIndex && <CornerDownLeft className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
