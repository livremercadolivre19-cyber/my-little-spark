import { createFileRoute } from "@tanstack/react-router";
import { createOwnerCookie, clearOwnerCookie, isOwnerRequest } from "@/lib/owner-auth";

export const Route = createFileRoute("/api/ai/auth")({
  server: {
    handlers: {
      GET: async ({ request }) => Response.json({ authenticated: isOwnerRequest(request) }),
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({})) as { password?: string };
        const expected = process.env.OWNER_PASSWORD;
        if (!expected || !body.password || body.password !== expected) {
          return Response.json({ error: "Senha do proprietário inválida." }, { status: 401 });
        }
        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json", "Set-Cookie": createOwnerCookie() },
        });
      },
      DELETE: async () => new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json", "Set-Cookie": clearOwnerCookie() },
      }),
    },
  },
});
