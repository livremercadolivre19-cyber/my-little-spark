import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai/image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { prompt?: string; model?: string };
          const prompt = body.prompt?.trim();
          const apiKey = process.env.OPENAI_API_KEY;
          if (!prompt) return Response.json({ error: "Prompt da imagem é obrigatório." }, { status: 400 });
          if (!apiKey) return Response.json({ error: "OPENAI_API_KEY não configurada." }, { status: 503 });

          const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: body.model || process.env.OPENAI_IMAGE_MODEL || "gpt-image-2", prompt, n: 1 }),
          });
          const data = await response.json();
          if (!response.ok) return Response.json({ error: data?.error?.message || "Falha ao gerar imagem." }, { status: response.status });
          const image = data?.data?.[0];
          return Response.json({ ok: true, provider: "openai", url: image?.url, b64: image?.b64_json });
        } catch {
          return Response.json({ error: "Erro interno ao gerar imagem." }, { status: 500 });
        }
      },
    },
  },
});
