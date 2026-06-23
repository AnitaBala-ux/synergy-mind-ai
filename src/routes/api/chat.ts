import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const BodySchema = z.object({
  messages: z
    .array(z.object({ role: z.string().min(1).max(32), parts: z.array(z.unknown()).max(200) }).passthrough())
    .min(1)
    .max(200),
  threadId: z.string().uuid().optional(),
});



const SYSTEM_PROMPT = `You are ResearchFlow AI, an expert research and productivity assistant.
You help users with research synthesis, summaries, planning, writing, brainstorming, and task management.
Be concise, structured, and use markdown (headings, bullets, bold) for clarity.
When asked to plan, produce actionable steps with priorities and time estimates.
When summarizing research, organize output as: Executive Summary, Key Findings, Important Concepts, Recommendations, Future Directions.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.json().catch(() => null);
        const parsed = BodySchema.safeParse(raw);
        if (!parsed.success) {
          return new Response("Invalid request body", { status: 400 });
        }
        const { messages, threadId } = parsed.data;
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
          onFinish: async ({ messages: finalMessages }) => {
            if (typeof threadId !== "string") return;
            try {
              const rows = (finalMessages as UIMessage[]).map((m) => ({
                thread_id: threadId,
                role: m.role,
                parts: JSON.parse(JSON.stringify(m.parts)),
              }));
              await supabaseAdmin.from("messages").delete().eq("thread_id", threadId);
              if (rows.length) await supabaseAdmin.from("messages").insert(rows);
              await supabaseAdmin
                .from("threads")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", threadId);
            } catch (e) {
              console.error("Persist chat error:", e);
            }
          },
        });
      },
    },
  },
});
