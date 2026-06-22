import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

const RESEARCH_TEMPLATES: Record<string, string> = {
  academic: "Act as an expert academic researcher. Produce a rigorous analysis with: Executive Summary, Key Findings, Important Concepts, Methodology Notes, Recommendations, Future Research Directions, and References to consider. Use clear headings and concise language.",
  business: "Act as a senior business research analyst. Output: Executive Summary, Market Insights, Competitive Landscape, Opportunities & Risks, Strategic Recommendations.",
  policy: "Act as a policy analyst. Output: Background, Stakeholders, Key Issues, Policy Options, Trade-offs, Recommendations.",
  literature: "Act as a literature review specialist. Output: Scope, Themes & Trends, Key Authors & Works, Gaps in Literature, Synthesis, Suggested Citations.",
  summary: "Act as an expert summarizer. Output: TL;DR (3 sentences), Key Points (bullets), Notable Quotes, Action Items.",
};

const Input = z.object({
  query: z.string().min(3).max(8000),
  template: z.enum(["academic", "business", "policy", "literature", "summary"]).default("academic"),
});

export const runResearch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: RESEARCH_TEMPLATES[data.template],
      prompt: data.query,
    });
    return { result: text };
  });

const PlanInput = z.object({
  goals: z.string().min(3).max(4000),
  deadline: z.string().optional(),
  hoursPerDay: z.number().min(1).max(16).default(6),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export const runPlanner = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PlanInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: "You are an expert productivity planner. Create an optimized weekly schedule using priority, urgency, importance, and available working hours. Produce clearly-formatted markdown with: Daily Plan (Mon-Sun), Priority Matrix (Urgent/Important quadrants), Time Blocking Suggestions, and Smart Recommendations.",
      prompt: `Goals:\n${data.goals}\n\nDeadline: ${data.deadline ?? "flexible"}\nHours available per day: ${data.hoursPerDay}\nPriority: ${data.priority}`,
    });
    return { result: text };
  });
