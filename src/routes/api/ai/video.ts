import { createFileRoute } from "@tanstack/react-router";

type VideoBody = {
  prompt?: string;
  duration?: number;
  ratio?: string;
  imageUrl?: string;
};

export const Route = createFileRoute("/api/ai/video")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as VideoBody;
          const prompt = body.prompt?.trim();

          if (!prompt) {
            return Response.json({ error: "Prompt do vídeo é obrigatório." }, { status: 400 });
          }

          const apiKey = process.env.RUNWAYML_API_SECRET;
          if (!apiKey) {
            return Response.json(
              { error: "RUNWAYML_API_SECRET não configurada no servidor." },
              { status: 503 },
            );
          }

          const payload: Record<string, unknown> = {
            model: process.env.RUNWAY_VIDEO_MODEL || "gen4.5",
            promptText: prompt,
            ratio: body.ratio || "1280:720",
            duration: body.duration || 5,
          };

          if (body.imageUrl) payload.promptImage = body.imageUrl;

          const response = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "X-Runway-Version": "2024-11-06",
            },
            body: JSON.stringify(payload),
          });

          const data = await response.json();

          if (!response.ok) {
            return Response.json(
              { error: data?.error || data?.message || "Falha na API do Runway." },
              { status: response.status },
            );
          }

          return Response.json({
            ok: true,
            provider: "runway",
            taskId: data.id || data.taskId,
            status: data.status || "PENDING",
          });
        } catch {
          return Response.json({ error: "Erro interno ao iniciar o vídeo." }, { status: 500 });
        }
      },
    },
  },
});
