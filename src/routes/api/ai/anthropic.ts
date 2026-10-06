import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai/anthropic")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { prompt?: string };
          const prompt = body.prompt?.trim();
          const key = process.env.ANTHROPIC_API_KEY;
          if (!prompt) return Response.json({ error: "Prompt é obrigatório." }, { status: 400 });
          if (!key) return Response.json({ error: "ANTHROPIC_API_KEY não configurada." }, { status: 503 });

          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": key,
              "anthropic-version": "2023-06-01",
              "Content-Type": "application/json",
              "anthropic-dangerous-direct-browser-access": "false",
            },
            body: JSON.stringify({
              model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
              max_tokens: 4096,
              messages: [{ role: "user", content: prompt }],
            }),
          });
          const data = await response.json();
          if (!response.ok) return Response.json({ error: data?.error?.message || "Falha no Anthropic." }, { status: response.status });
          const text = Array.isArray(data?.content) ? data.content.map((part: { text?: string }) => part.text || "").join("") : "";
          return Response.json({ ok: true, provider: "anthropic", text });
        } catch {
          return Response.json({ error: "Erro interno no Anthropic." }, { status: 500 });
        }
      },
    },
  },
});
