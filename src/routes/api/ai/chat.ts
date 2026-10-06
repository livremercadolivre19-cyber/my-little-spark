import { createFileRoute } from "@tanstack/react-router";

type ChatBody = {
  prompt?: string;
  model?: string;
};

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as ChatBody;
          const prompt = body.prompt?.trim();

          if (!prompt) {
            return Response.json({ error: "Prompt é obrigatório." }, { status: 400 });
          }

          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) {
            return Response.json(
              { error: "OPENAI_API_KEY não configurada no servidor." },
              { status: 503 },
            );
          }

          const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: body.model || process.env.OPENAI_MODEL || "gpt-5",
              input: prompt,
              store: false,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            return Response.json(
              { error: data?.error?.message || "Falha na API da OpenAI." },
              { status: response.status },
            );
          }

          return Response.json({
            ok: true,
            provider: "openai",
            responseId: data.id,
            text: data.output_text || "",
            usage: data.usage || null,
          });
        } catch {
          return Response.json({ error: "Erro interno ao processar a solicitação." }, { status: 500 });
        }
      },
    },
  },
});
