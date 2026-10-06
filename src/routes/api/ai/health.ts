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
            google: Boolean(process.env.GEMINI_API_KEY),
            anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
          },
          tools: {
            chat: Boolean(process.env.OPENAI_API_KEY),
            image: Boolean(process.env.OPENAI_API_KEY),
            video: Boolean(process.env.RUNWAYML_API_SECRET),
            voice: Boolean(process.env.OPENAI_API_KEY),
            files: Boolean(process.env.OPENAI_API_KEY),
            code: Boolean(process.env.OPENAI_API_KEY),
            research: Boolean(process.env.OPENAI_API_KEY),
            google: Boolean(process.env.GEMINI_API_KEY),
            anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
          },
          message: "AI server routes are available.",
        }),
    },
  },
});
