import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai/video/$taskId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const apiKey = process.env.RUNWAYML_API_SECRET;

        if (!apiKey) {
          return Response.json(
            { error: "RUNWAYML_API_SECRET não configurada no servidor." },
            { status: 503 },
          );
        }

        if (!params.taskId) {
          return Response.json({ error: "Task ID é obrigatório." }, { status: 400 });
        }

        try {
          const response = await fetch(
            `https://api.dev.runwayml.com/v1/tasks/${encodeURIComponent(params.taskId)}`,
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "X-Runway-Version": "2024-11-06",
              },
            },
          );

          const data = await response.json();

          if (!response.ok) {
            return Response.json(
              { error: data?.error || data?.message || "Falha ao consultar o Runway." },
              { status: response.status },
            );
          }

          return Response.json({
            ok: true,
            taskId: params.taskId,
            status: data.status,
            output: data.output || null,
            failure: data.failure || data.failureCode || null,
          });
        } catch {
          return Response.json({ error: "Erro interno ao consultar o vídeo." }, { status: 500 });
        }
      },
    },
  },
});
