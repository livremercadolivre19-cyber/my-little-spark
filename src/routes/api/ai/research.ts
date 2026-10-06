import { createFileRoute } from "@tanstack/react-router";

type ResearchBody = {
  prompt?: string;
};

export const Route = createFileRoute("/api/ai/research")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as ResearchBody;
          const prompt = body.prompt?.trim();
          const apiKey = process.env.OPENAI_API_KEY;

          if (!prompt) {
            return Response.json({ error: "Pergunta de pesquisa é obrigatória." }, { status: 400 });
          }

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
              model: process.env.OPENAI_RESEARCH_MODEL || process.env.OPENAI_MODEL || "gpt-6-luna",
              tools: [{ type: "web_search" }],
              input: [
                {
                  role: "user",
                  content: [
                    {
                      type: "input_text",
                      text: prompt,
                    },
                  ],
                },
              ],
              store: false,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            return Response.json(
              { error: data?.error?.message || "Falha na pesquisa web." },
              { status: response.status },
            );
          }

          const sources = Array.isArray(data?.output)
            ? data.output
                .filter((item: { type?: string }) => item.type === "web_search_call")
                .flatMap((item: { action?: { sources?: Array<{ url?: string }> } }) =>
                  item.action?.sources || [],
                )
                .map((source: { url?: string }) => source.url)
                .filter(Boolean)
            : [];

          return Response.json({
            ok: true,
            provider: "openai",
            text: data?.output_text || "",
            responseId: data?.id || null,
            sources: [...new Set(sources)],
            usage: data?.usage || null,
          });
        } catch {
          return Response.json(
            { error: "Erro interno ao realizar a pesquisa." },
            { status: 500 },
          );
        }
      },
    },
  },
});
