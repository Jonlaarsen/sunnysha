"use client";
import { useState } from "react";

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<{ error: string | null }>;
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const { error } = await onSubmit(email, password);

    if (error) {
      setErrorMessage(error);
      setLoading(false);
    } else {
      setPassword("");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-400 via-indigo-500 to-sky-300 px-4">
      <div className="w-full max-w-md bg-white/95 border border-white/40 backdrop-blur shadow-2xl rounded-3xl px-10 py-12 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 text-2xl font-extrabold shadow-inner">
            QC
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-indigo-400">
              SUNNYSHA
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              Secure Sign In
            </h1>
            <p className="text-sm text-slate-500">
              Enter your credentials to continue
            </p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">
              Email
            </label>
            <input
              className="w-full p-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="user@example.com"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">
              Password
            </label>
            <input
              className="w-full p-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-2">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-semibold tracking-wide shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-xs text-center text-slate-400">
          QC Report System • Internal use only
        </p>
      </div>
    </div>
  );
}


