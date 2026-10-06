export type AICapability = "chat" | "image" | "video" | "voice" | "files" | "code" | "research";

export type AIProvider = {
  id: string;
  name: string;
  description: string;
  capabilities: AICapability[];
  configured: boolean;
};

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "Chat, raciocínio, código, imagens e voz.",
    capabilities: ["chat", "image", "voice", "files", "code", "research"],
    configured: false,
  },
  {
    id: "runway",
    name: "Runway",
    description: "Geração profissional de vídeo com IA.",
    capabilities: ["video"],
    configured: false,
  },
  {
    id: "google",
    name: "Google AI",
    description: "Modelos multimodais e recursos generativos.",
    capabilities: ["chat", "image", "video", "files", "research"],
    configured: false,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Modelos avançados para texto, análise e código.",
    capabilities: ["chat", "files", "code", "research"],
    configured: false,
  },
];

export const AI_TOOLS = [
  { id: "chat", label: "Chat IA", icon: "MessageSquare", description: "Converse com modelos avançados." },
  { id: "image", label: "Imagens", icon: "Image", description: "Crie imagens com IA." },
  { id: "video", label: "Vídeos", icon: "Clapperboard", description: "Gere vídeos profissionais." },
  { id: "voice", label: "Voz", icon: "Mic", description: "Geração e conversão de voz." },
  { id: "files", label: "Arquivos", icon: "FileText", description: "Analise documentos e arquivos." },
  { id: "code", label: "Código", icon: "Code2", description: "Crie, revise e transforme código." },
  { id: "research", label: "Pesquisa", icon: "Search", description: "Pesquise e organize informações." },
] as const;

export const AI_CREDITS = {
  ownerUnlimited: true,
  enabled: true,
  note: "Limites e créditos devem ser validados no servidor. Nunca exponha chaves de API no navegador.",
} as const;
