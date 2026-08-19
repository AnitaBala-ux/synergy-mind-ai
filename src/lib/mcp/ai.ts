import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { generateText } from "ai";

type RuntimeGlobals = typeof globalThis & {
  Deno?: { env?: { get?: (name: string) => string | undefined } };
  process?: { env?: Record<string, string | undefined> };
};

function lovableApiKey(): string {
  const runtime = globalThis as RuntimeGlobals;
  const key =
    runtime.Deno?.env?.get?.("LOVABLE_API_KEY") ?? runtime.process?.env?.["LOVABLE_API_KEY"];
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  return key;
}

export async function runAi(system: string, prompt: string): Promise<string> {
  const gateway = createLovableAiGatewayProvider(lovableApiKey());
  const { text } = await generateText({
    model: gateway("openai/gpt-5.4"),
    system,
    prompt,
  });
  return text;
}
