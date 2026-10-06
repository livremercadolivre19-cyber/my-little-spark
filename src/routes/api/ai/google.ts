import { createFileRoute } from "@tanstack/react-router";
import { isOwnerRequest, unauthorized } from "@/lib/owner-auth";

type GoogleBody = {
  prompt?: string;
  model?: string;
};

export const Route = createFileRoute("/api/ai/google")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isOwnerRequest(request)) return unauthorized();
        try {
          const body = (await request.json()) as GoogleBody;
          const prompt = body.prompt?.trim();
          const key = process.env.GEMINI_API_KEY;

          if (!prompt) {
            return Response.json({ error: "Prompt é obrigatório." }, { status: 400 });
          }

          if (!key) {
            return Response.json(
              { error: "GEMINI_API_KEY não configurada." },
              { status: 503 },
            );
          }

          const model = body.model || process.env.GEMINI_MODEL || "gemini-3.6-flash";

          const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": key,
              },
              body: JSON.stringify({
                model,
                input: prompt,
                store: false,
              }),
            },
          );

          const data = await response.json();

          if (!response.ok) {
            return Response.json(
              { error: data?.error?.message || "Falha no Google AI." },
              { status: response.status },
            );
          }

          return Response.json({
            ok: true,
            provider: "google",
            responseId: data?.id || null,
            status: data?.status || "completed",
            text: data?.output_text || "",
            usage: data?.usage || null,
          });
        } catch {
          return Response.json(
            { error: "Erro interno no Google AI." },
            { status: 500 },
          );
        }
      },
    },
  },
});
