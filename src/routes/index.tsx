import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5 text-cyan-300">
          <Sparkles className="h-10 w-10" />
        </div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
          CENTRAL DE IA
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Todas as suas ferramentas de IA em um só lugar.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">
          Chat, vídeo, imagens, voz, arquivos, código e pesquisa com uma interface
          profissional em azul elétrico.
        </p>
        <Link
          to="/ai"
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3.5 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          <Zap className="h-5 w-5" />
          Abrir Central de IA
        </Link>
      </div>
    </main>
  );
}
