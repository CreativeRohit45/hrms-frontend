import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../lib/apiError";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/app/dashboard";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const identifierRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionExpired(params.get("expired") === "true");
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    identifierRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Enter your employee code or email, then your password.");
      return;
    }

    setError(null);
    setSessionExpired(false);
    setIsSubmitting(true);

    try {
      await login({ identifier: identifier.trim(), password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, "Unable to reach the server. Please try again.");
      setError(message === "Session expired or invalid token" ? "Your session expired. Please sign in again." : message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
        <section className="hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-indigo-600/20 via-slate-900 to-slate-950 p-10 shadow-2xl lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-indigo-200">
              <ShieldCheck className="h-4 w-4" />
              CoreSync HRMS
            </div>
            <h1 className="mt-8 text-5xl font-black tracking-tight">Professional HR operations in one consistent workspace.</h1>
            <p className="mt-6 text-base leading-7 text-slate-300">
              Attendance, requests, payroll, and people operations now live in a cleaner, role-aware experience built to scale to mobile.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-4 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Grouped navigation for employees, managers, HR, and super admins.</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Standardized forms, messages, modals, and date/time inputs.</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Mobile-first employee journey without losing desktop admin power.</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Clearer request workflows across leave, gatepass, and attendance corrections.</div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-300">Employee Workspace</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Sign in</h2>
            <p className="mt-2 text-sm text-slate-400">Use your employee code or email to access the HRMS dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Employee Code or Email</label>
              <input
                ref={identifierRef}
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="CS-0001 or name@company.com"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {sessionExpired && !error && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Your session expired. Sign in again to continue.
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Continue to workspace"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
