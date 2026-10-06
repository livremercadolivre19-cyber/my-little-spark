import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai/health")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          ok: true,
          providers: {
            openai: Boolean(process.env.OPENAI_API_KEY),
            runway: Boolean(process.env.RUNWAYML_API_SECRET),
          },
          message: "AI server routes are available.",
        }),
    },
  },
});
