"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { clsx } from "clsx";

type Item = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "amber" | "indigo" | "emerald";
  createdAt: string;
};

const TONE_DOT: Record<Item["tone"], string> = {
  amber: "bg-amber-400",
  indigo: "bg-indigo-500",
  emerald: "bg-emerald-500",
};

function timeAgoClient(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [count, setCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setItems(data.items ?? []);
        setCount(data.count ?? 0);
      } catch {
        // ignore transient fetch errors
      }
    }
    load();
    const interval = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (open && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost !px-2 relative"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-30">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">You&apos;re all caught up.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => go(item.href)}
                  className="w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0"
                >
                  <span className={clsx("h-2 w-2 rounded-full mt-1.5 shrink-0", TONE_DOT[item.tone])} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 truncate">{item.description}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{timeAgoClient(item.createdAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
