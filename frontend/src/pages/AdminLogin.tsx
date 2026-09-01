import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAdminSession } from "../hooks/useAdminSession";
import ErrorMessage from "../components/ErrorMessage";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useAdminSession();

  useEffect(() => {
    if (!sessionLoading && session) navigate("/admin/dashboard");
  }, [session, sessionLoading, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }
    navigate("/admin/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Panel administrativo</h1>
        <p className="mt-1 text-sm text-slate-500">Inicie sesión para continuar.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-water-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-water-400"
            />
          </div>

          {error && <ErrorMessage message={error} />}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-water-600 px-4 py-2.5 font-semibold text-white transition hover:bg-water-700 disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400">
          El usuario administrador se crea una sola vez en Supabase (Authentication → Users), no
          aquí.
        </p>
      </div>
    </div>
  );
}
