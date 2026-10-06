import { createFileRoute } from "@tanstack/react-router";
import {
  Bot, Clapperboard, Code2, FileText, Image as ImageIcon, Loader2,
  MessageSquare, Mic, Search, Sparkles, Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AI_PROVIDERS, AI_TOOLS } from "../lib/ai-config";

export const Route = createFileRoute("/ai")({ component: AICentral });

const icons = { MessageSquare, Image: ImageIcon, Clapperboard, Mic, FileText, Code2, Search } as const;

type Health = {
  providers?: Record<string, boolean>;
  tools?: Record<string, boolean>;
};

function AICentral() {
  const [selectedTool, setSelectedTool] = useState("chat");
  const [provider, setProvider] = useState("openai");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState("");
  const [media, setMedia] = useState("");
  const [error, setError] = useState("");
  const [health, setHealth] = useState<Health>({});
  const [file, setFile] = useState<File | null>(null);
  const [sources, setSources] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/ai/auth").then(r => r.json()).then(data => { if (!data.authenticated) window.location.href = "/login"; }).catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/ai/health")
      .then(async response => {
        if (!response.ok) return null;
        return (await response.json()) as Health;
      })
      .then(data => {
        if (active && data) setHealth(data);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const reset = (tool: string) => {
    setSelectedTool(tool);
    setResult("");
    setMedia("");
    setError("");
    setProgress(0);
    setFile(null);
    setSources([]);
    setProvider(tool === "video" ? "runway" : tool === "research" ? "openai" : provider);
  };

  async function handleGenerate() {
    if ((!prompt.trim() && selectedTool !== "files") || loading) return;
    setLoading(true); setProgress(selectedTool === "video" ? 5 : 15);
    setResult(""); setMedia(""); setSources([]); setError("");
    try {
      let response: Response;
      if (selectedTool === "video") {
        response = await fetch("/api/ai/video", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({prompt:prompt.trim(),duration:5,ratio:"1280:720"}) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Não foi possível iniciar o vídeo.");
        const taskId = data.taskId;
        if (!taskId) throw new Error("O Runway não retornou um ID de tarefa.");
        for (let attempt=0; attempt<30; attempt++) {
          await new Promise(r=>setTimeout(r,3000));
          const sr = await fetch(`/api/ai/video/${encodeURIComponent(taskId)}`);
          const s = await sr.json();
          if (!sr.ok) throw new Error(s.error || "Falha ao consultar o vídeo.");
          const state=String(s.status||"").toUpperCase();
          if (state==="SUCCEEDED" || state==="COMPLETED") {
            const output=Array.isArray(s.output)?s.output[0]:s.output;
            setProgress(100); setMedia(output ? String(output) : ""); setResult(output ? "Vídeo concluído." : "Vídeo concluído.");
            return;
          }
          if (state==="FAILED" || state==="CANCELLED") throw new Error(s.failure || "A geração do vídeo falhou.");
          setProgress(Math.min(95,10+attempt*3));
        }
        throw new Error("A geração continua no provedor, mas demorou além do acompanhamento desta tela.");
      } else if (selectedTool === "image") {
        response=await fetch("/api/ai/image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:prompt.trim()})});
        const data=await response.json();
        if(!response.ok) throw new Error(data.error||"Falha ao gerar imagem.");
        setProgress(100); setMedia(data.url ? String(data.url) : data.b64 ? `data:image/png;base64,${data.b64}` : ""); setResult("Imagem gerada com sucesso.");
      } else if (selectedTool === "files") {
        if (!file) throw new Error("Selecione um arquivo para analisar.");
        const form = new FormData();
        form.append("file", file);
        form.append("prompt", prompt.trim() || "Analise este arquivo e explique os pontos mais importantes.");
        response = await fetch("/api/ai/files", { method: "POST", body: form });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Falha ao analisar o arquivo.");
        setProgress(100); setResult(data.text || "O arquivo foi processado, mas não houve resposta de texto.");
      } else if (selectedTool === "code") {
        response = await fetch("/api/ai/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ prompt: "Atue como engenheiro de software sênior. Escreva, depure, revise ou explique código com soluções seguras e prontas para produção. Pedido: " + prompt.trim() }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Falha ao processar código.");
        setProgress(100); setResult(data.text || "A IA não retornou código.");
      } else if (selectedTool === "voice") {
        response=await fetch("/api/ai/voice",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:prompt.trim(),voice:"alloy"})});
        if(!response.ok){const data=await response.json().catch(()=>null);throw new Error(data?.error||"Falha ao gerar voz.");}
        const blob=await response.blob(); setProgress(100); setMedia(URL.createObjectURL(blob)); setResult("Áudio gerado com sucesso.");
      } else {
        const endpoint = selectedTool === "research" ? "/api/ai/research" : provider === "google" ? "/api/ai/google" : provider === "anthropic" ? "/api/ai/anthropic" : "/api/ai/chat";
        response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:prompt.trim()})});
        const data=await response.json();
        if(!response.ok) throw new Error(data.error||"Falha na geração.");
        setProgress(100); setResult(data.text||"A IA não retornou texto."); setSources(Array.isArray(data.sources) ? data.sources : []);
      }
    } catch(err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro.");
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-cyan-300"><Sparkles className="h-4 w-4"/> CENTRAL DE IA</div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Seu espaço de inteligência artificial</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400 md:text-base">Chat, imagens, vídeos, voz, arquivos, código e pesquisa em uma única central.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3"><div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300"><Zap className="h-5 w-5"/></div><div><p className="text-xs text-slate-400">Créditos do proprietário</p><p className="font-semibold text-cyan-300">Ilimitados</p></div></div>
        </header>

        <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AI_PROVIDERS.map(p=><button key={p.id} type="button" onClick={()=>setProvider(p.id)} className={`rounded-2xl border p-4 text-left transition ${provider===p.id?"border-cyan-400/50 bg-cyan-400/10":"border-white/10 bg-white/[0.035] hover:border-cyan-400/30"}`}>
            <div className="mb-3 flex items-center justify-between"><div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300"><Bot className="h-5 w-5"/></div><span className={`rounded-full border px-2 py-1 text-[10px] ${health.providers?.[p.id]?"border-emerald-300/20 bg-emerald-300/5 text-emerald-200":"border-white/10 bg-white/5 text-slate-400"}`}>{health.providers?.[p.id]?"Configurado":"Não configurado"}</span></div>
            <h2 className="font-semibold">{p.name}</h2><p className="mt-1 text-xs leading-5 text-slate-400">{p.description}</p>
          </button>)}
        </section>

        <section className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/[0.035] p-3">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Ferramentas</p>
            <div className="space-y-1">{AI_TOOLS.map(tool=>{const Icon=icons[tool.icon as keyof typeof icons];const active=selectedTool===tool.id;return <button key={tool.id} type="button" onClick={()=>reset(tool.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active?"bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-400/20":"text-slate-300 hover:bg-white/5"}`}><Icon className="h-4 w-4"/><span className="text-sm font-medium">{tool.label}</span></button>})}</div>
          </aside>

          <div className="rounded-3xl border border-cyan-400/15 bg-gradient-to-b from-cyan-400/[0.06] to-white/[0.02] p-5 md:p-7">
            <div className="mb-6 flex items-center gap-3"><div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300"><Sparkles className="h-6 w-6"/></div><div><h2 className="text-xl font-semibold">{AI_TOOLS.find(t=>t.id===selectedTool)?.label}</h2><p className="text-sm text-slate-400">{AI_TOOLS.find(t=>t.id===selectedTool)?.description}</p></div></div>

            {selectedTool!=="video" && selectedTool!=="image" && selectedTool!=="voice" && <div className="mb-4 flex flex-wrap gap-2">
              {["openai","google","anthropic"].map(id=><button key={id} type="button" onClick={()=>setProvider(id)} className={`rounded-xl border px-3 py-2 text-xs ${provider===id?"border-cyan-400/40 bg-cyan-400/10 text-cyan-200":"border-white/10 text-slate-400"}`}>{id==="openai"?"OpenAI":id==="google"?"Google AI":"Anthropic"}</button>)}
            </div>}

            <div className="min-h-64 rounded-2xl border border-white/10 bg-black/20 p-5">
              {loading ? <div className="flex min-h-52 flex-col items-center justify-center text-center"><Loader2 className="mb-4 h-9 w-9 animate-spin text-cyan-300"/><p className="font-medium">Processando com IA...</p><div className="mt-4 w-full max-w-md"><div className="mb-2 flex justify-between text-xs text-slate-400"><span>Progresso</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-400 transition-all duration-700" style={{width:`${progress}%`}}/></div></div></div>
              : error ? <div className="flex min-h-52 items-center justify-center text-center"><p className="max-w-xl text-sm text-red-300">{error}</p></div>
              : media && selectedTool==="image" ? <div><p className="mb-3 text-xs uppercase tracking-wider text-cyan-300">Resultado</p><img src={media} alt="Imagem gerada pela IA" className="max-h-[520px] w-full rounded-2xl object-contain"/></div>
              : media && selectedTool==="video" ? <div><p className="mb-3 text-xs uppercase tracking-wider text-cyan-300">Resultado</p><video controls className="w-full rounded-2xl" src={media}/>
              </div>
              : media && selectedTool==="voice" ? <div className="flex min-h-52 flex-col items-center justify-center"><p className="mb-4 text-sm text-cyan-200">Áudio pronto</p><audio controls src={media} className="w-full max-w-lg"/></div>
              : result ? <div className="min-h-52"><p className="mb-3 text-xs uppercase tracking-wider text-cyan-300">Resultado</p><p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{result}</p></div>
              : <div className="flex min-h-52 flex-col items-center justify-center text-center"><div className="mb-4 rounded-full border border-cyan-400/20 bg-cyan-400/5 p-4 text-cyan-300"><Bot className="h-8 w-8"/></div><p className="font-medium">Pronto para começar</p><p className="mt-2 max-w-md text-sm text-slate-500">Digite um pedido abaixo para testar.</p></div>}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
              {selectedTool === "files" && <div className="mb-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3"><label className="flex cursor-pointer items-center gap-3 text-sm text-slate-300"><FileText className="h-5 w-5 text-cyan-300" /><span className="flex-1">{file ? file.name : "Escolher PDF, documento ou arquivo"}</span><input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" /><span className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950">Selecionar</span></label></div>}
              <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder={selectedTool==="video"?"Descreva o vídeo profissional...":selectedTool==="voice"?"Digite o texto que a IA deve falar...":selectedTool==="image"?"Descreva a imagem que deseja criar...":"Digite o que você quer criar..."} rows={4} className="w-full resize-none bg-transparent p-2 text-sm text-white outline-none placeholder:text-slate-600"/>
              <div className="flex items-center justify-between border-t border-white/10 pt-3"><span className="text-xs text-slate-500">Provedor: {provider}</span><button type="button" onClick={handleGenerate} disabled={loading||((selectedTool !== "files") && !prompt.trim())||(selectedTool === "files" && !file)} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40">{loading?<Loader2 className="h-4 w-4 animate-spin"/>:<Sparkles className="h-4 w-4"/>}{loading?"Processando...":"Gerar"}</button></div>
            </div>
          </div>
        </section>
        <footer className="mt-8 flex items-center gap-2 text-xs text-slate-600"><Zap className="h-3.5 w-3.5"/> Chaves de API nunca devem ser expostas no navegador.</footer>
      </div>
    </main>
  );
}
