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

// -------------------- Document analysis (PDF / text upload) --------------------

const DocInput = z.object({
  filename: z.string().min(1).max(200),
  mimeType: z.string().min(1).max(120),
  // base64-encoded file content (PDF) OR plain extracted text
  base64: z.string().max(7_340_032).optional(), // ~5 MB base64-encoded
  text: z.string().max(120_000).optional(),
  instruction: z.string().max(2000).optional(),
  template: z.enum(["summary", "academic", "literature"]).default("summary"),
}).refine((v) => !!v.base64 || !!v.text, { message: "Provide base64 or text" });

const DOC_SYSTEM: Record<string, string> = {
  summary: "You are an expert research assistant analyzing an uploaded document. Produce well-structured markdown with these sections: ## Document Overview, ## Key Findings (bulleted), ## Main Arguments, ## Notable Quotes (with brief context), ## Methodology / Approach (if applicable), ## Limitations, ## Suggested Citation (APA 7 if author/year are visible, otherwise note 'unavailable'). Be precise; ground claims in the document.",
  academic: "You are an academic peer reviewer analyzing an uploaded paper. Output markdown with: ## Abstract Summary, ## Research Question, ## Methodology, ## Key Findings, ## Theoretical Contribution, ## Limitations & Critique, ## Future Work, ## Suggested Citation (APA 7).",
  literature: "You are a literature-review specialist. Extract from the uploaded document: ## Author & Year, ## Topic & Scope, ## Theoretical Framework, ## Methods, ## Key Findings, ## How This Fits Existing Literature, ## Quotable Excerpts, ## Suggested Citation (APA 7 and Harvard).",
};

export const analyzeDocument = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => DocInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const system = DOC_SYSTEM[data.template];
    const userInstruction = data.instruction?.trim()
      || "Provide a thorough analysis and key findings from this document.";

    // Build OpenAI-compatible chat completion body for the Lovable AI Gateway
    const userContent: unknown[] = [{ type: "text", text: `${userInstruction}\n\nFilename: ${data.filename}` }];
    if (data.base64) {
      userContent.push({
        type: "file",
        file: {
          filename: data.filename,
          file_data: `data:${data.mimeType};base64,${data.base64}`,
        },
      });
    } else if (data.text) {
      userContent.push({ type: "text", text: `\n\n---\nDocument text:\n${data.text.slice(0, 120_000)}` });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("AI rate limit reached. Please retry shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
      throw new Error(`AI gateway error (${res.status}): ${detail.slice(0, 300)}`);
    }
    const json = await res.json() as { choices?: { message?: { content?: string } }[] };
    const result = json.choices?.[0]?.message?.content ?? "";
    if (!result) throw new Error("Empty AI response");
    return { result };
  });

// -------------------- Citation extraction --------------------

const CitationParseInput = z.object({
  text: z.string().min(5).max(4000),
});

export const extractCitation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CitationParseInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: `You are a citation parser. Given any reference text (URL, DOI, raw citation, abstract, or description), extract structured fields and respond with ONLY valid JSON (no markdown, no commentary) matching this TypeScript type:
{
  "type": "journal"|"book"|"website"|"report"|"chapter",
  "authors": string,       // "Surname, F. M.; Surname, A." format
  "year": string,
  "title": string,
  "source": string,        // journal/website name; empty if unknown
  "volume": string,
  "issue": string,
  "pages": string,
  "publisher": string,
  "url": string,
  "doi": string
}
Unknown fields must be an empty string. Never invent data.`,
      prompt: data.text,
    });

    // Best-effort JSON extraction (model may wrap in fences)
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not parse AI response");
    try {
      const parsed = JSON.parse(match[0]);
      return { citation: parsed };
    } catch {
      throw new Error("Invalid JSON from AI");
    }
  });
