import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LockKeyhole, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const response = await fetch("/api/ai/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) { setError(data.error || "Não foi possível entrar."); return; }
    navigate({ to: "/ai" });
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#050816] px-5 text-white">
    <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-cyan-400/20 bg-white/[0.04] p-8 shadow-2xl">
      <div className="mb-6 flex justify-center"><div className="rounded-2xl bg-cyan-400/10 p-4 text-cyan-300"><LockKeyhole className="h-8 w-8"/></div></div>
      <div className="mb-8 text-center"><div className="mb-2 flex items-center justify-center gap-2 text-sm font-semibold text-cyan-300"><Sparkles className="h-4 w-4"/> CENTRAL DE IA</div><h1 className="text-2xl font-bold">Área do proprietário</h1><p className="mt-2 text-sm text-slate-400">Acesso protegido à sua Central de IA.</p></div>
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Senha do proprietário" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-400/50"/>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      <button disabled={loading || !password} className="mt-5 w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-40">{loading ? "Entrando..." : "Entrar"}</button>
    </form>
  </main>;
}
