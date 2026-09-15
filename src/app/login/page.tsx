"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import { Sparkles } from "lucide-react";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      <div
        className="pointer-events-none absolute top-[-10%] left-[-10%] h-[420px] w-[420px] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute bottom-[-15%] right-[-10%] h-[420px] w-[420px] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, #22d3ee, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute top-1/3 right-1/4 h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #a855f7, transparent 70%)" }}
      />

      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl brand-gradient flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/40">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Company Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1.5">AI Automation Consultancy · Workforce Portal</p>
        </div>

        <form
          action={formAction}
          className="rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-2xl p-6 space-y-4"
        >
          {state.error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-3 py-2">
              {state.error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          Demo admin: officialwork.ashish@gmail.com / admin123
        </p>
      </div>
    </div>
  );
}
