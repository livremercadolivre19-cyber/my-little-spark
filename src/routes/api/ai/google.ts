import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai/google")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { prompt?: string };
          const prompt = body.prompt?.trim();
          const key = process.env.GEMINI_API_KEY;
          if (!prompt) return Response.json({ error: "Prompt é obrigatório." }, { status: 400 });
          if (!key) return Response.json({ error: "GEMINI_API_KEY não configurada." }, { status: 503 });

          const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          });
          const data = await response.json();
          if (!response.ok) return Response.json({ error: data?.error?.message || "Falha no Google AI." }, { status: response.status });
          const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";
          return Response.json({ ok: true, provider: "google", text });
        } catch {
          return Response.json({ error: "Erro interno no Google AI." }, { status: 500 });
        }
      },
    },
  },
});
