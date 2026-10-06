import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai/files")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) return Response.json({ error: "OPENAI_API_KEY não configurada no servidor." }, { status: 503 });

          const form = await request.formData();
          const file = form.get("file");
          const prompt = String(form.get("prompt") || "Analise este arquivo e explique os pontos mais importantes.");

          if (!(file instanceof File)) return Response.json({ error: "Envie um arquivo para análise." }, { status: 400 });
          if (file.size > 20 * 1024 * 1024) return Response.json({ error: "O arquivo deve ter no máximo 20 MB." }, { status: 413 });

          const upload = new FormData();
          upload.append("file", file, file.name);
          upload.append("purpose", "user_data");

          const uploadResponse = await fetch("https://api.openai.com/v1/files", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}` },
            body: upload,
          });
          const uploadData = await uploadResponse.json();
          if (!uploadResponse.ok) {
            return Response.json({ error: uploadData?.error?.message || "Falha ao enviar o arquivo." }, { status: uploadResponse.status });
          }

          const model = process.env.OPENAI_FILES_MODEL || process.env.OPENAI_MODEL || "gpt-6-luna";
          const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model,
              input: [{
                role: "user",
                content: [
                  { type: "input_text", text: prompt },
                  { type: "input_file", file_id: uploadData.id },
                ],
              }],
              store: false,
            }),
          });
          const data = await response.json();
          if (!response.ok) return Response.json({ error: data?.error?.message || "Falha ao analisar o arquivo." }, { status: response.status });

          return Response.json({
            ok: true,
            provider: "openai",
            fileId: uploadData.id,
            fileName: file.name,
            text: data?.output_text || "",
            responseId: data?.id || null,
            usage: data?.usage || null,
          });
        } catch {
          return Response.json({ error: "Erro interno ao analisar o arquivo." }, { status: 500 });
        }
      },
    },
  },
});
