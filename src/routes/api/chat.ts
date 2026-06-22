import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type ChatRequestBody = { messages?: unknown; threadId?: unknown };

const SYSTEM_PROMPT = `You are ResearchFlow AI, an expert research and productivity assistant.
You help users with research synthesis, summaries, planning, writing, brainstorming, and task management.
Be concise, structured, and use markdown (headings, bullets, bold) for clarity.
When asked to plan, produce actionable steps with priorities and time estimates.
When summarizing research, organize output as: Executive Summary, Key Findings, Important Concepts, Recommendations, Future Directions.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, threadId } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages required", { status: 400 });
        }
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
