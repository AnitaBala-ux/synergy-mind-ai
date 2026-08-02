import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runAi } from "../ai";

const TEMPLATES: Record<string, string> = {
  academic:
    "Act as an expert academic researcher. Produce: Executive Summary, Key Findings, Important Concepts, Methodology Notes, Recommendations, Future Research Directions.",
  business:
    "Act as a senior business research analyst. Produce: Executive Summary, Market Insights, Competitive Landscape, Opportunities & Risks, Strategic Recommendations.",
  policy:
    "Act as a policy analyst. Produce: Background, Stakeholders, Key Issues, Policy Options, Trade-offs, Recommendations.",
  literature:
    "Act as a literature review specialist. Produce: Scope, Themes & Trends, Key Authors & Works, Gaps in Literature, Synthesis.",
  summary:
    "Act as an expert summarizer. Produce: TL;DR (3 sentences), Key Points, Notable Quotes, Action Items.",
};

export default defineTool({
  name: "research_analyze",
  title: "Run research analysis",
  description:
    "Run a structured SynergyMind AI research analysis on a topic, question, or pasted text and return a markdown report.",
  inputSchema: {
    query: z.string().min(3).describe("The research question, topic, or text to analyse."),
    template: z
      .enum(["academic", "business", "policy", "literature", "summary"])
      .default("academic")
      .describe("Analysis style to apply."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ query, template }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const text = await runAi(TEMPLATES[template] ?? TEMPLATES.academic, query);
    return { content: [{ type: "text", text }] };
  },
});
