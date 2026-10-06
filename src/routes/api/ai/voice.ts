import { createFileRoute } from "@tanstack/react-router";
import { isOwnerRequest, unauthorized } from "@/lib/owner-auth";

export const Route = createFileRoute("/api/ai/voice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isOwnerRequest(request)) return unauthorized();
        try {
          const body = (await request.json()) as { text?: string; voice?: string };
          const input = body.text?.trim();
          const apiKey = process.env.OPENAI_API_KEY;
          if (!input) return Response.json({ error: "Texto para voz é obrigatório." }, { status: 400 });
          if (!apiKey) return Response.json({ error: "OPENAI_API_KEY não configurada." }, { status: 503 });

          const response = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
              input,
              voice: body.voice || "alloy",
              response_format: "mp3",
            }),
          });
          if (!response.ok) {
            const data = await response.json().catch(() => null);
            return Response.json({ error: data?.error?.message || "Falha ao gerar voz." }, { status: response.status });
          }
          const bytes = Buffer.from(await response.arrayBuffer());
          return new Response(bytes, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
        } catch {
          return Response.json({ error: "Erro interno ao gerar voz." }, { status: 500 });
        }
      },
    },
  },
});
