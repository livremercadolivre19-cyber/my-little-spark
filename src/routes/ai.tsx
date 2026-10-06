import { createFileRoute } from "@tanstack/react-router";
import {
  Bot, Clapperboard, Code2, FileText, Image as ImageIcon, Loader2,
  MessageSquare, Mic, Search, Sparkles, Zap,
} from "lucide-react";
import { useState } from "react";
import { AI_PROVIDERS, AI_TOOLS } from "../lib/ai-config";

export const Route = createFileRoute("/ai")({ component: AICentral });

const icons = { MessageSquare, Image: ImageIcon, Clapperboard, Mic, FileText, Code2, Search } as const;

function AICentral() {
  const [selectedTool, setSelectedTool] = useState("chat");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setProgress(selectedTool === "video" ? 5 : 15);
    setResult("");
    setError("");

    try {
      if (selectedTool === "video") {
        const response = await fetch("/api/ai/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompt.trim(), duration: 5, ratio: "1280:720" }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Não foi possível iniciar o vídeo.");

        const taskId = data.taskId;
        if (!taskId) throw new Error("O Runway não retornou um ID de tarefa.");

        let done = false;
        for (let attempt = 0; attempt < 30 && !done; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const statusResponse = await fetch(`/api/ai/video/${encodeURIComponent(taskId)}`);
          const status = await statusResponse.json();
          if (!statusResponse.ok) throw new Error(status.error || "Falha ao consultar o vídeo.");

          const state = String(status.status || "").toUpperCase();
          if (state === "SUCCEEDED" || state === "COMPLETED") {
            setProgress(100);
            const output = Array.isArray(status.output) ? status.output[0] : status.output;
            setResult(output ? String(output) : "Vídeo concluído.");
            done = true;
          } else if (state === "FAILED" || state === "CANCELLED") {
            throw new Error(status.failure || "A geração do vídeo falhou.");
          } else {
            setProgress(Math.min(95, 10 + attempt * 3));
          }
        }
        if (!done) throw new Error("A geração demorou mais que o tempo de acompanhamento da tela. O processamento pode continuar no Runway.");
      } else if (selectedTool === "chat" || selectedTool === "code" || selectedTool === "research") {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompt.trim() }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Falha na geração.");
        setProgress(100);
        setResult(data.text || "A IA não retornou texto.");
      } else {
        throw new Error("Esta ferramenta está preparada na interface, mas ainda precisa do provedor específico.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro.");
    } finally {
      setLoading(false);
      if (!error) setProgress((value) => (value === 100 ? 100 : value));
    }
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-cyan-300"><Sparkles className="h-4 w-4" /> CENTRAL DE IA</div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Seu espaço de inteligência artificial</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400 md:text-base">Chat, imagens, vídeos, voz, arquivos, código e pesquisa em uma única central.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3">
            <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300"><Zap className="h-5 w-5" /></div>
            <div><p className="text-xs text-slate-400">Créditos do proprietário</p><p className="font-semibold text-cyan-300">Ilimitados</p></div>
          </div>
        </header>

        <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AI_PROVIDERS.map((provider) => (
            <div key={provider.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-cyan-400/30">
              <div className="mb-3 flex items-center justify-between">
                <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300"><Bot className="h-5 w-5" /></div>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/5 px-2 py-1 text-[10px] text-cyan-200">{provider.id === "openai" || provider.id === "runway" ? "Conector pronto" : "Preparado"}</span>
              </div>
              <h2 className="font-semibold">{provider.name}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-400">{provider.description}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/[0.035] p-3">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Ferramentas</p>
            <div className="space-y-1">
              {AI_TOOLS.map((tool) => {
                const Icon = icons[tool.icon as keyof typeof icons];
                const active = selectedTool === tool.id;
                return <button key={tool.id} type="button" onClick={() => { setSelectedTool(tool.id); setResult(""); setError(""); setProgress(0); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active ? "bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-400/20" : "text-slate-300 hover:bg-white/5"}`}><Icon className="h-4 w-4" /><span className="text-sm font-medium">{tool.label}</span></button>;
              })}
            </div>
          </aside>

          <div className="rounded-3xl border border-cyan-400/15 bg-gradient-to-b from-cyan-400/[0.06] to-white/[0.02] p-5 md:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300"><Sparkles className="h-6 w-6" /></div>
              <div><h2 className="text-xl font-semibold">{AI_TOOLS.find((tool) => tool.id === selectedTool)?.label ?? "Chat IA"}</h2><p className="text-sm text-slate-400">{AI_TOOLS.find((tool) => tool.id === selectedTool)?.description}</p></div>
            </div>

            <div className="min-h-64 rounded-2xl border border-white/10 bg-black/20 p-5">
              {loading ? (
                <div className="flex min-h-52 flex-col items-center justify-center text-center">
                  <Loader2 className="mb-4 h-9 w-9 animate-spin text-cyan-300" />
                  <p className="font-medium">{selectedTool === "video" ? "Gerando seu vídeo..." : "Processando..."}</p>
                  <div className="mt-4 w-full max-w-md">
                    <div className="mb-2 flex justify-between text-xs text-slate-400"><span>Progresso</span><span>{progress}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-400 transition-all duration-700" style={{ width: `${progress}%` }} /></div>
                  </div>
                </div>
              ) : error ? (
                <div className="flex min-h-52 items-center justify-center text-center"><p className="max-w-xl text-sm text-red-300">{error}</p></div>
              ) : result ? (
                <div className="min-h-52">
                  <p className="mb-3 text-xs uppercase tracking-wider text-cyan-300">Resultado</p>
                  {selectedTool === "video" && result.startsWith("http") ? <video controls className="w-full rounded-2xl" src={result} /> : <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{result}</p>}
                </div>
              ) : (
                <div className="flex min-h-52 flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-full border border-cyan-400/20 bg-cyan-400/5 p-4 text-cyan-300"><Bot className="h-8 w-8" /></div>
                  <p className="font-medium">Pronto para começar</p>
                  <p className="mt-2 max-w-md text-sm text-slate-500">Digite um pedido abaixo para testar a geração real.</p>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
              <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={selectedTool === "video" ? "Descreva o vídeo profissional que você quer criar..." : "Digite o que você quer criar..."} rows={4} className="w-full resize-none bg-transparent p-2 text-sm text-white outline-none placeholder:text-slate-600" />
              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-xs text-slate-500">Ferramenta: {selectedTool}</span>
                <button type="button" onClick={handleGenerate} disabled={loading || !prompt.trim()} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{loading ? "Processando..." : "Gerar"}
                </button>
              </div>
            </div>
          </div>
        </section>
        <footer className="mt-8 flex items-center gap-2 text-xs text-slate-600"><Zap className="h-3.5 w-3.5" /> Chaves de API nunca devem ser expostas no navegador.</footer>
      </div>
    </main>
  );
}
